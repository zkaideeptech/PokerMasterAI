// 初始化扑克牌选项
const suits = ['♠️', '♥️', '♣️', '♦️'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function initializeCardSelectors() {
    const cardSelects = document.querySelectorAll('.card-select');
    cardSelects.forEach(select => {
        select.innerHTML = '<option value="">选择牌</option>';
        suits.forEach(suit => {
            ranks.forEach(rank => {
                const option = document.createElement('option');
                option.value = `${rank}${suit}`;
                option.textContent = `${rank}${suit}`;
                select.appendChild(option);
            });
        });
    });
}

// 切换输入模式
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const mode = btn.dataset.mode;
        document.getElementById('structuredInput').style.display = 
            mode === 'structured' ? 'block' : 'none';
        document.getElementById('freetextInput').style.display = 
            mode === 'freetext' ? 'block' : 'none';
    });
});

// 结构化输入分析
document.getElementById('analyzeStructuredBtn').addEventListener('click', async () => {
    const card1 = document.getElementById('card1').value;
    const card2 = document.getElementById('card2').value;
    const flop1 = document.getElementById('flop1').value;
    const flop2 = document.getElementById('flop2').value;
    const flop3 = document.getElementById('flop3').value;
    const turn = document.getElementById('turn').value;
    const river = document.getElementById('river').value;
    const position = document.getElementById('position').value;
    const opponentPosition = document.getElementById('opponentPosition').value;
    const gameStage = document.getElementById('gameStage').value;
    const potSize = document.getElementById('potSize').value;
    const opponentAction = document.getElementById('opponentAction').value;

    const situation = `
        我的手牌：${card1} ${card2}
        我的位置：${position}
        对手位置：${opponentPosition}
        当前轮次：${gameStage}
        公共牌：${flop1} ${flop2} ${flop3} ${turn} ${river}
        底池：${potSize}BB
        对手行动：${opponentAction}
    `;

    await analyzePokerGame(situation);
});

// 自由文本分析
document.getElementById('analyzeFreetextBtn').addEventListener('click', async () => {
    const situation = document.getElementById('situationText').value;
    await analyzePokerGame(situation);
});

async function analyzePokerGame(situation) {
    const resultDiv = document.getElementById('analysisResult');
    
    if (!situation.trim()) {
        resultDiv.innerHTML = '<div class="error">请输入牌局信息！</div>';
        return;
    }

    try {
        resultDiv.innerHTML = '<div class="loading">分析中，请稍候...</div>';
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('apiKey') || prompt('请输入你的 API Key:'))
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
                        content: situation
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
    return analysis.split('\n').map(line => `<p>${line}</p>`).join('');
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeCardSelectors();
});
