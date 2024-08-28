document.getElementById('file-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        // 업로드 시 상태 업데이트
        document.getElementById('status').textContent = '분석 중입니다...';
        document.getElementById('uploaded-image').style.display = 'none';

        // 파일 업로드 및 예측 요청
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // 이미지 미리보기 및 진단 결과 표시
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('uploaded-image').src = e.target.result;
                document.getElementById('uploaded-image').style.display = 'block';
            };
            reader.readAsDataURL(file);

            document.getElementById('status').textContent = '분석 완료';
            document.getElementById('diagnosis-result').textContent = `예측 결과: ${data.diagnosis_result}\n${data.gpt_response}`;
        })
        .catch(error => {
            document.getElementById('status').textContent = '분석 중 오류가 발생했습니다.';
            console.error('Error:', error);
        });
    }
});

document.getElementById('send-button').addEventListener('click', function() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        const chatLog = document.getElementById('chat-log');
        chatLog.innerHTML += `<p><strong>환자:</strong> ${userInput}</p>`;
        document.getElementById('user-input').value = '';

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userInput })
        })
        .then(response => response.json())
        .then(data => {
            chatLog.innerHTML += `<p><strong>닥스AI:</strong> ${data.response}</p>`;
            chatLog.scrollTop = chatLog.scrollHeight;
        })
        .catch(error => {
            chatLog.innerHTML += `<p><strong>닥스AI:</strong> 응답에 실패했습니다. 나중에 다시 시도해 주세요.</p>`;
            console.error('Error:', error);
        });
    }
});

document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('send-button').click();
    }
});
