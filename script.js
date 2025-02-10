document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const TYPING_SPEED = 50;
    const INITIAL_RESPONSE_DELAY = 800;
    const MESSAGES = [
        "I appreciate you sharing that. Let me think about it...",
        "That's an interesting point. Here's my perspective...",
        "I understand what you're saying. Let me elaborate...",
        "Thank you for explaining. Here's what I think...",
    ];

    // Elements
    const landingContent = document.querySelector('.landing-content');
    const chatInterface = document.querySelector('.chat-interface');
    const startChatBtn = document.querySelector('.start-chat');
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const clearChatBtn = document.querySelector('.clear-chat');
    const messageForm = document.querySelector('.message-form');
    const messageInput = document.querySelector('.message-input');
    const messagesContainer = document.querySelector('.messages');
    const welcomeSection = document.querySelector('.welcome-section');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const languageSelector = document.getElementById('language-selector');
    const voiceInputBtn = document.getElementById('voice-input');
    const fileUpload = document.getElementById('file-upload');

    // State
    let isProcessing = false;
    let chatHistory = [];
    let currentChatId = 'default';
    let darkMode = localStorage.getItem('darkMode') === 'true';

    // Initialize chat interface state
    chatInterface.style.display = 'none';
    chatInterface.style.opacity = '0';

    // Event Listeners

    menuToggle.addEventListener('click', toggleSidebar);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    languageSelector.addEventListener('change', changeLanguage);
    voiceInputBtn.addEventListener('click', startVoiceInput);
    fileUpload.addEventListener('change', handleFileUpload);
    newChatBtn.addEventListener('click', newChat);
    clearChatBtn.addEventListener('click', clearChat);
    messageForm.addEventListener('submit', handleMessageSubmit);
    messageInput.addEventListener('input', autoResizeTextarea);


    startChatBtn.addEventListener('click', () => {
        // Fade out landing page
        landingContent.style.opacity = '0';

        // Wait for fade out animation
        setTimeout(() => {
            // Hide landing page
            landingContent.style.display = 'none';

            // Show chat interface
            chatInterface.style.display = 'flex';
            chatInterface.style.opacity = '0';

            // Trigger reflow
            void chatInterface.offsetWidth;

            // Fade in chat interface
            chatInterface.style.opacity = '1';

            // Focus input
            messageInput?.focus();

            // Enable scrolling if needed
            document.body.style.overflow = 'auto';
        }, 500); // Match this with your CSS transition duration
    });

    // Auto-resize textarea
    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    }


    // Toggle sidebar for mobile
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        document.body.classList.toggle('sidebar-open');
    }

    // Toggle dark mode with smooth transition
    function toggleDarkMode() {
        darkMode = !darkMode;
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('darkMode', darkMode);
    }

    function changeLanguage() {
        const lang = languageSelector.value;
        document.documentElement.setAttribute('lang', lang);
        // Additional language change logic would go here
    }

    function startVoiceInput() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                messageInput.value = transcript;
                autoResizeTextarea();
            };

            recognition.start();
            voiceInputBtn.classList.add('recording');

            recognition.onend = () => {
                voiceInputBtn.classList.remove('recording');
            };
        } else {
            showNotification('Voice input is not supported in your browser');
        }
    }

    function handleFileUpload() {
        const file = fileUpload.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                messageInput.value = e.target.result;
                autoResizeTextarea();
            };
            reader.readAsText(file);
        }
    }

    function newChat() {
        if (isProcessing) return;

        currentChatId = Date.now().toString();
        messagesContainer.innerHTML = '';
        chatHistory = [];
        welcomeSection.style.display = 'block';
        localStorage.setItem('chatHistory', JSON.stringify({}));
        messageInput.focus();
    }

    function clearChat() {
        if (isProcessing) return;

        const confirmed = confirm('Are you sure you want to clear all messages?');
        if (confirmed) {
            messagesContainer.innerHTML = '';
            chatHistory = [];
            welcomeSection.style.display = 'block';
            localStorage.removeItem('chatHistory');
        }
    }

    async function handleMessageSubmit(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (isProcessing || !message) return;

        addMessage(message, 'user');
        messageInput.value = '';
        autoResizeTextarea();
        messageInput.focus();

        isProcessing = true;
        await simulateResponse(message);
        isProcessing = false;
    }

    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const avatar = type === 'user' ? '👤' : '🤖';

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${content}</div>
                <div class="message-footer">
                    <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                    ${type === 'ai' ? '<button class="copy-button">Copy</button>' : ''}
                </div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (type === 'user') {
            welcomeSection.style.display = 'none';
        }

        chatHistory.push({ type, content, timestamp: new Date() });
        saveChatToLocalStorage();

        if (type === 'ai') {
            const copyBtn = messageDiv.querySelector('.copy-button');
            copyBtn?.addEventListener('click', () => copyToClipboard(content));
        }

        return messageDiv;
    }

    async function simulateResponse(userMessage) {
        const loadingMessage = addMessage('...', 'ai');

        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, INITIAL_RESPONSE_DELAY));

        // Get random response
        const response = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

        // Remove loading message
        loadingMessage.remove();

        // Add actual response with typing effect
        const messageDiv = addMessage('', 'ai');
        const messageText = messageDiv.querySelector('.message-text');

        // Typing effect
        let i = 0;
        const typeWriter = () => {
            if (i < response.length) {
                messageText.textContent += response.charAt(i);
                i++;
                setTimeout(typeWriter, TYPING_SPEED);
            }
        };

        typeWriter();
    }

    function saveChatToLocalStorage() {
        const storage = JSON.parse(localStorage.getItem('chatHistory') || '{}');
        storage[currentChatId] = chatHistory;
        localStorage.setItem('chatHistory', JSON.stringify(storage));
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard');
        } catch (err) {
            showNotification('Failed to copy text');
            console.error('Failed to copy:', err);
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Initialize app state
    (() => {
        // Set initial dark mode
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

        // Load saved chat
        const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '{}');
        if (savedChats[currentChatId]) {
            chatHistory = savedChats[currentChatId];
            welcomeSection.style.display = 'none';
            chatHistory.forEach(msg => addMessage(msg.content, msg.type));
        }

        // Focus input on load if chat is visible
        if (!chatInterface.classList.contains('hidden')) {
            messageInput.focus();
        }
    })();
});

function createBubbles() {
    const bubbleContainer = document.getElementById('bubble-container');
    const bubbleCount = 15;

    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        // Random size between 20px and 100px
        const size = Math.random() * 80 + 20;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Random starting position
        bubble.style.left = `${Math.random() * 100}%`;

        // Random animation duration between 15-30 seconds
        const duration = Math.random() * 15 + 15;
        bubble.style.animationDuration = `${duration}s`;

        // Random animation delay
        bubble.style.animationDelay = `${Math.random() * 20}s`;

        bubbleContainer.appendChild(bubble);
    }
}

// Call when DOM is loaded
document.addEventListener('DOMContentLoaded', createBubbles);

document.addEventListener('DOMContentLoaded', () => {
    // Prevent scrolling on landing page
    document.body.style.overflow = 'hidden';

    // Handle transition to chat interface
    const startChatBtn = document.querySelector('.start-chat');
    const landingContent = document.querySelector('.landing-content');
    const chatInterface = document.querySelector('.chat-interface');

    startChatBtn.addEventListener('click', () => {
        // Fade out landing page
        landingContent.style.opacity = '0';
        landingContent.style.transition = 'opacity 0.5s ease-out';

        // After fade out, hide landing and show chat
        setTimeout(() => {
            landingContent.style.display = 'none';
            chatInterface.style.display = 'flex';

            // Fade in chat interface
            setTimeout(() => {
                chatInterface.style.opacity = '1';
            }, 50);

            // Focus on input
            const messageInput = document.querySelector('.message-input');
            messageInput.focus();
        }, 500);
    });

    // Add necessary CSS to elements
    landingContent.style.minHeight = '100vh';
    landingContent.style.transition = 'opacity 0.5s ease-out';

    chatInterface.style.opacity = '0';
    chatInterface.style.transition = 'opacity 0.5s ease-out';
});