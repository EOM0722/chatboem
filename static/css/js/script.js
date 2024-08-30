let conversationHistory = [];

function loadConversationHistory() {
    fetch('/get_history', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        conversationHistory = data.history;
        displayConversationHistory();
    })
    .catch(error => console.error('Error:', error));
}

function displayConversationHistory() {
    const chatLog = document.getElementById('chat-log');
    chatLog.innerHTML = '';
    conversationHistory.forEach(message => {
        addMessage(message.role === 'user' ? '질문자' : '닥스AI', message.content);
    });
}

function addMessage(sender, content) {
    const chatLog = document.getElementById('chat-log');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === '질문자' ? 'user-message' : 'bot-message');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${content}`;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

document.getElementById('file-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        document.getElementById('status').textContent = '분석 중입니다...';
        document.getElementById('status').style.display = 'block';
        document.getElementById('uploaded-image').style.display = 'none';

        fetch('/predict', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('uploaded-image').src = data.image_path;
            document.getElementById('uploaded-image').style.display = 'block';
            document.getElementById('status').style.display = 'none';
            document.getElementById('diagnosis-result').innerHTML = `<strong>진단 결과:</strong> ${data.diagnosis_result}<br><br>${data.gpt_response}`;
            
            addMessage('닥스AI', `진단 결과: ${data.diagnosis_result}\n${data.gpt_response}`);
            loadConversationHistory();
        })
        .catch(error => {
            document.getElementById('status').textContent = '분석 중 오류가 발생했습니다.';
            console.error('Error:', error);
        });
    }
});

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (userInput !== '') {
        addMessage('질문자', userInput);
        document.getElementById('user-input').value = '';

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userInput }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            addMessage('닥스AI', data.response);
            loadConversationHistory();
        })
        .catch(error => {
            addMessage('닥스AI', '응답에 실패했습니다. 나중에 다시 시도해 주세요.');
            console.error('Error:', error);
        });
    }
}

function resetConversation() {
    fetch('/reset', { 
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        document.getElementById('chat-log').innerHTML = '';
        conversationHistory = [];
    })
    .catch(error => console.error('Error:', error));
}

window.onload = function() {
    resetConversation();
};