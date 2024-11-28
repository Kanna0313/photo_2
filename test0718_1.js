// test0718.jsファイルの一部

let apiKey = '';  // グローバル変数でAPIキーを保存
let previousImages = []; // 過去の画像データを保存


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
                        content: 'この写真を100点満点で評価してください。主題の配置や全体の印象を考慮して全体的な点数を決めてください。ただし、改善アドバイスは構図に関するもの（「もう少し左に移動する」「被写体に近づく」など）に限定してください。注意：- アドバイスは簡潔で1文以内にしてください。- 初心者でも実践しやすい内容を心がけてください。-二回目以降の点数は必ず前回のものと変えてください。'

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
            appendMessage('ChatGPT', ` ${score}\n ${suggestion}`);
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
    addPreviousImage(); // 現在の画像を保存
    document.getElementById('image-input').value = '';
    document.getElementById('image-container').innerHTML = '';
    document.getElementById('retake-button').style.display = 'none';
    document.getElementById('complete-button').style.display = 'none';
    document.getElementById('evaluate-button').style.display = 'none';
}


function addPreviousImage() {
    const imageContainer = document.getElementById('image-container');
    const imgElement = imageContainer.querySelector('img');
    
    if (imgElement) {
        // 現在の画像を複製してリストに追加
        const newImage = imgElement.cloneNode(true);
        previousImages.push(newImage);
        updatePreviousImages();
    }
}

function updatePreviousImages() {
    const previousImagesContainer = document.getElementById('previous-images');
    previousImagesContainer.innerHTML = '<h2>評価された写真</h2>';
    
    previousImages.forEach((image, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = "center";
        wrapper.style.marginBottom = "10px";
        
        const label = document.createElement('p');
        label.innerText = `写真 ${index + 1}`;
        
        wrapper.appendChild(label);
        wrapper.appendChild(image);
        previousImagesContainer.appendChild(wrapper);
    });
}


function completeProcess() {
    appendMessage('ChatGPT', 'お疲れさまでした！');
    document.getElementById('retake-button').style.display = 'none';
    document.getElementById('complete-button').style.display = 'none';
    //document.getElementById('image-input').value = '';
    //document.getElementById('image-container').innerHTML = '';
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
