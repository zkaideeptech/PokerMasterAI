document.getElementById('analyzeBtn').addEventListener('click', analyzePokerGame);

async function analyzePokerGame() {
    const handCards = document.getElementById('handCards').value;
    const communityCards = document.getElementById('communityCards').value;
    const position = document.getElementById('position').value;
    const potSize = document.getElementById('potSize').value;
    const opponentAction = document.getElementById('opponentAction').value;
    
    const resultDiv = document.getElementById('analysisResult');
    
    // 验证输入
    if (!handCards || !communityCards || !potSize || !opponentAction) {
        resultDiv.innerHTML = '<div class="error">请填写所有必要信息！</div>';
        return;
    }

    // 构建分析请求文本
    const analysisRequest = `
        手牌：${handCards}
        位置：${position}
        底池：${potSize}BB
        公共牌：${communityCards}
        对手行动：${opponentAction}
    `;

    try {
        resultDiv.innerHTML = '<div class="loading">分析中，请稍候...</div>';
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-86165c5c418a4584800df8a9627f2ed2'
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的德州扑克分析师，请分析给定的牌局并提供详细的建议。请从以下几个方面进行分析：1. 当前牌力 2. 胜率估算 3. 行动建议 4. 理由分析"
                    },
                    {
                        role: "user",
                        content: analysisRequest
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const analysis = data.choices[0].message.content;
            resultDiv.innerHTML = formatAnalysis(analysis);
        } else {
            throw new Error('API返回数据格式错误');
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">分析出错：${error.message}</div>`;
    }
}

function formatAnalysis(analysis) {
    // 将分析结果转换为HTML格式，保持换行
    return analysis.split('\n').map(line => `<p>${line}</p>`).join('');
}
