const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const fileInput = document.getElementById('fileInput');

// Function to scroll to the bottom
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to add a message
function addMessage(content, isBot = false, isImage = false) {
    const block = document.createElement('div');
    const message = document.createElement('p');
    block.className = 'message';
    if (isImage) {
        // Add image message
        const img = document.createElement('img');
        img.src = content;
        img.alt = 'Uploaded Image';
        block.classList.add('image');
        block.classList.add('user');
        block.appendChild(img);
    } else {
        // Add text message
        message.textContent = content;
        block.classList.add(isBot ? 'bot' : 'user');
        block.appendChild(message)
    }
    chatBox.appendChild(block);
    scrollToBottom();
}

// Send text message
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        addMessage(text); // User message
        addMessage('已收到訊息！', true); // Bot reply
        messageInput.value = ''; // Clear input
    }
}

// Handle image upload
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png') && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Display image
            addMessage(e.target.result, false, true); // User's uploaded image
            addMessage('已收到圖片！', true); // Bot reply
        };
        reader.readAsDataURL(file); // Read file as Data URL
    } else {
        alert('只接受 JPG/JPEG/PNG 格式，且文件大小需小於 5MB。');
    }
    fileInput.value = ''; // Reset file input
});

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
