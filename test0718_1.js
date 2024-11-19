// test0718.jsファイルの一部

let apiKey = '';  // グローバル変数でAPIキーを保存

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('image-input').addEventListener('change', handleImageUpload);
    document.getElementById('evaluate-button').addEventListener('click', evaluateImage);
    document.getElementById('retake-button').addEventListener('click', retakeImage);
    document.getElementById('complete-button').addEventListener('click', completeProcess);

    // APIキーを保存するボタンのイベントリスナーを追加
    document.getElementById('save-api-key').addEventListener('click', () => {
        apiKey = document.getElementById('api-key').value;
        if (apiKey) {
            alert('APIキーが保存されました');
        } else {
            alert('APIキーを入力してください');
        }
    });
});

function handleImageUpload(event) {
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = '';
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imageContainer.appendChild(img);
            document.getElementById('evaluate-button').style.display = 'inline-block';
        }
        reader.readAsDataURL(file);
    }
}

async function evaluateImage() {
    const imageContainer = document.getElementById('image-container');
    if (!imageContainer.firstChild || !apiKey) {
        if (!apiKey) alert('APIキーが設定されていません');
        return;
    }

    const imageData = imageContainer.firstChild.src.split(',')[1]; // Base64部分のみ取得
    appendMessage('ChatGPT', '画像を評価しています...');  // この部分に続けてリクエストを送信

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`  // 保存されたAPIキーを使用
            },
            body: JSON.stringify({
                model: 'gpt-4o',  // 使用するモデルを指定
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'この画像には何が写っていますか？' },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
                        ]
                    },
                    {
                        role: 'user',
                        content: 'この画像の構図を100点満点で評価し、より良い写真にするためのアドバイスをください。'
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            appendMessage('ChatGPT', `エラーが発生しました。ステータスコード: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const advice = data.choices[0].message.content.split('\n').map(line => line.trim());
            const score = advice[0].replace('点数: ', '');
            const suggestion = advice.slice(1).join(' ');
            appendMessage('ChatGPT', `点数: ${score}\nアドバイス: ${suggestion}`);
        } else {
            appendMessage('ChatGPT', '評価結果を取得できませんでした。');
        }

        document.getElementById('retake-button').style.display = 'inline-block';
        document.getElementById('complete-button').style.display = 'inline-block';
        document.getElementById('evaluate-button').style.display = 'none';

    } catch (error) {
        console.error('Error:', error);
    }
}

function retakeImage() {
    document.getElementById('image-input').value = '';
    document.getElementById('image-container').innerHTML = '';
    document.getElementById('retake-button').style.display = 'none';
    document.getElementById('complete-button').style.display = 'none';
    document.getElementById('evaluate-button').style.display = 'none';
}

function completeProcess() {
    appendMessage('ChatGPT', 'お疲れさまでした！');
    document.getElementById('retake-button').style.display = 'none';
    document.getElementById('complete-button').style.display = 'none';
    document.getElementById('image-input').value = '';
    document.getElementById('image-container').innerHTML = '';
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
