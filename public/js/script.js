document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const fileInput = document.getElementById('file-input');
    const attachmentBtn = document.getElementById('attachment-btn');
    const modelSelect = document.getElementById('model-select');
    const clearChatBtn = document.getElementById('clear-chat');
    const apiBtns = document.querySelectorAll('.api-btn');

    // --- State ---
    let activeApi = 'text';
    let file = null;

    // --- API Endpoints ---
    const API_URL = 'http://localhost:3000';
    const ENDPOINTS = {
        text: '/generate-text',
        image: '/generate-from-image',
        video: '/generate-from-video',
        audio: '/generate-from-audio',
        document: '/generate-from-document',
        chat: '/chat',
        models: '/models',
    };

    // --- UI Initialization ---
    const init = async () => {
        try {
            const response = await fetch(`${API_URL}${ENDPOINTS.models}`);
            const data = await response.json();
            modelSelect.innerHTML = data.models
                .map(model => `<option value="${model}">${model}</option>`)
                .join('');
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    // --- Event Listeners ---
    apiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activeApi = btn.dataset.api;
            apiBtns.forEach(b => b.classList.remove('api-btn--active'));
            btn.classList.add('api-btn--active');
            fileInput.accept = getAcceptType(activeApi);
        });
    });

    attachmentBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        file = e.target.files[0];
        if (file) {
            userInput.placeholder = `File selected: ${file.name}`;
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage && !file) return;

        displayMessage('user', { text: userMessage, file });
        userInput.value = '';
        userInput.placeholder = 'Type your message...';

        showLoader();

        const formData = new FormData();
        if (userMessage) formData.append('prompt', userMessage);
        if (file) formData.append(getFieldName(activeApi), file);

        try {
            const response = await fetch(`${API_URL}${ENDPOINTS[activeApi]}`, {
                method: 'POST',
                body: file ? formData : JSON.stringify({ prompt: userMessage }),
                headers: file ? {} : { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong');
            }

            const data = await response.json();
            displayMessage('bot', { text: data.reply });
        } catch (error) {
            displayMessage('bot', { text: `Error: ${error.message}` });
        } finally {
            removeLoader();
            file = null;
            fileInput.value = '';
        }
    });

    clearChatBtn.addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/chat`, { method: 'DELETE' });
            chatBox.innerHTML = '';
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    });

    // --- UI Helper Functions ---
    const displayMessage = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `message--${sender}`);

        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');

        if (message.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                contentElement.appendChild(img);
            };
            reader.readAsDataURL(message.file);
        }

        if (message.text) {
            const textNode = document.createElement('p');
            textNode.textContent = message.text;
            contentElement.appendChild(textNode);
        }

        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const showLoader = () => {
        const loader = document.createElement('div');
        loader.classList.add('loader');
        chatBox.appendChild(loader);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const removeLoader = () => {
        const loader = chatBox.querySelector('.loader');
        if (loader) loader.remove();
    };

    // --- API Helper Functions ---
    const getAcceptType = (api) => {
        const types = {
            image: 'image/*',
            video: 'video/*',
            audio: 'audio/*',
            document: '.pdf,.doc,.docx,.txt',
        };
        return types[api] || '*';
    };

    const getFieldName = (api) => {
        return ['text', 'chat'].includes(api) ? 'prompt' : api;
    };

    // --- Initialize ---
    init();
});
