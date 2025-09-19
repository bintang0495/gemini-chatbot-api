const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  appendMessage('bot', 'Gemini is thinking...');

  fetch('http://localhost:3000/generate-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: userMessage }),
  })
    .then(response => response.json())
    .then(data => {
      // Hapus pesan "Gemini is thinking..."
      const thinkingMessage = chatBox.lastChild;
      chatBox.removeChild(thinkingMessage);
      appendMessage('bot', data.reply);
    })
    .catch(error => {
      console.error('Error:', error);
      const thinkingMessage = chatBox.lastChild;
      chatBox.removeChild(thinkingMessage);
      appendMessage('bot', 'Sorry, something went wrong.');
    });
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
