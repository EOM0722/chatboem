const BACKEND_URL = 'https://1b62-106-249-0-85.ngrok-free.app';  // ngrok URL로 업데이트 필요
let userId = null;

async function initSession() {
    try {
        const response = await fetch(`${BACKEND_URL}/init`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        userId = data.user_id;
        console.log('Session initialized:', userId);
    } catch (error) {
        console.error('Failed to initialize session:', error);
    }
}

async function sendImageForPrediction(formData) {
    formData.append('user_id', userId);
    try {
        const response = await fetch(`${BACKEND_URL}/predict`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '알 수 없는 오류가 발생했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error('Error sending image for prediction:', error);
        throw error;
    }
}

async function sendChatMessage(message) {
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: message, user_id: userId }),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '알 수 없는 오류가 발생했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
}

async function resetConversation() {
    try {
        const response = await fetch(`${BACKEND_URL}/reset`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId }),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '대화 초기화 중 오류가 발생했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error('Error resetting conversation:', error);
        throw error;
    }
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

document.addEventListener('DOMContentLoaded', async function() {
    await initSession();
    await resetConversation();

    document.getElementById('file-upload').addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            // 업로드된 이미지 미리보기
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('uploaded-image').src = e.target.result;
                document.getElementById('uploaded-image').style.display = 'block';
            }
            reader.readAsDataURL(file);

            try {
                const data = await sendImageForPrediction(formData);
                document.getElementById('diagnosis-result').innerHTML = `
                    <h3>진단 결과:</h3>
                    <p><strong>${data.diagnosis_result}</strong></p>
                    <p>${data.gpt_response}</p>
                `;
                
                addMessage('닥스AI', `진단 결과: ${data.diagnosis_result}\n${data.gpt_response}`);
            } catch (error) {
                document.getElementById('diagnosis-result').innerHTML = '분석 중 오류가 발생했습니다.';
                console.error('Error:', error);
            }
        }
    });

    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
});

async function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (userInput !== '') {
        addMessage('질문자', userInput);
        document.getElementById('user-input').value = '';

        try {
            const data = await sendChatMessage(userInput);
            addMessage('닥스AI', data.response);
        } catch (error) {
            addMessage('닥스AI', `응답에 실패했습니다: ${error.message}`);
            console.error('Error:', error);
        }
    }
}
