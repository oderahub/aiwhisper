document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const API_KEY = 'AIzaSyCfsKxRrCpi9lkhRLVkPBqH7tIy77QSj9M';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
        await getGeminiResponse(message);
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

    async function getGeminiResponse(userMessage) {
        const loadingMessage = addMessage('...', 'ai');

        try {
            const requestBody = {
                contents: [{
                    parts: [{
                        text: userMessage
                    }]
                }]
            };

            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;

            loadingMessage.remove();
            addMessage(aiResponse, 'ai');
        } catch (error) {
            loadingMessage.remove();
            addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            console.error('Error:', error);
        }
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