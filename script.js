// 初始化所有卡牌选择器
function initializeCardSelectors() {
    const template = document.getElementById('card1').innerHTML;
    const selectors = ['card2', 'flop1', 'flop2', 'flop3', 'turn', 'river'];
    
    // 复制模板到其他选择器
    selectors.forEach(id => {
        document.getElementById(id).innerHTML = template;
    });

    // 添加事件监听器
    document.querySelectorAll('.card-selector select').forEach(select => {
        select.addEventListener('change', updateAvailableCards);
    });
}

// 更新可用牌
function updateAvailableCards() {
    const allSelects = document.querySelectorAll('.card-selector select');
    const selectedCards = new Set();

    // 收集所有已选择的牌
    allSelects.forEach(select => {
        if (select.value) {
            selectedCards.add(select.value);
        }
    });

    // 更新每个选择器的可用选项
    allSelects.forEach(select => {
        const currentValue = select.value;
        Array.from(select.options).forEach(option => {
            if (option.value && option.value !== currentValue) {
                // 禁用已被其他选择器选中的牌
                option.disabled = selectedCards.has(option.value);
            }
        });
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeCardSelectors();
    updateAvailableCards(); // 初始化时更新一次可用牌
});

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeCardSelectors();
    updateAvailableCards();

    // 初始化行动历史的删除按钮
    document.querySelector('.remove-action').addEventListener('click', (e) => {
        const container = document.querySelector('.action-history-container');
        if (container.children.length > 1) {
            e.target.closest('.action-history-entry').remove();
        }
    });
});

// 添加行动历史的按钮事件
document.getElementById('addAction').addEventListener('click', () => {
    const container = document.querySelector('.action-history-container');
    const newEntry = container.children[0].cloneNode(true);
    
    // 清空新条目的选择
    newEntry.querySelectorAll('select, input').forEach(el => el.value = '');
    
    // 添加删除按钮事件
    newEntry.querySelector('.remove-action').addEventListener('click', (e) => {
        if (container.children.length > 1) {
            e.target.closest('.action-history-entry').remove();
        }
    });
    
    container.appendChild(newEntry);
});

// API Key 配置
const API_KEY = 'sk-86165c5c418a4584800df8a9627f2ed2';

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
    const myStack = document.getElementById('myStack').value;
    const opponentStack = document.getElementById('opponentStack').value;
    const opponentType = document.getElementById('opponentType').value;
    
    // 收集行动历史
    const actionHistory = [];
    document.querySelectorAll('.action-history-entry').forEach(entry => {
        const position = entry.querySelector('.action-position').value;
        const action = entry.querySelector('.action-type').value;
        const amount = entry.querySelector('.action-amount').value;
        if (position && action) {
            actionHistory.push(`${position}${amount ? ' ' + action + ' ' + amount + 'BB' : ' ' + action}`);
        }
    });

    const situation = `
        我的手牌：${card1} ${card2}
        我的位置：${position}
        我的筹码深度：${myStack}BB
        对手位置：${opponentPosition}
        对手筹码深度：${opponentStack}BB
        对手类型：${opponentType}
        当前轮次：${gameStage}
        公共牌：${flop1} ${flop2} ${flop3} ${turn} ${river}
        底池：${potSize}BB
        行动历史：${actionHistory.join(' -> ')}
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
                'Authorization': `Bearer ${API_KEY}`  // 使用配置的 API Key
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

document.addEventListener('DOMContentLoaded', function() {
    // 初始化自定义选择器
    initializeCustomSelects();
});

function initializeCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(select => {
        const trigger = select.querySelector('.custom-select-trigger');
        
        // 点击触发器打开/关闭选项
        trigger.addEventListener('click', () => {
            select.classList.toggle('open');
        });

        // 点击选项时
        select.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                if (option.classList.contains('disabled')) return;
                
                trigger.textContent = option.textContent;
                trigger.style.color = option.classList.contains('red') ? 'red' : 'black';
                select.dataset.value = option.dataset.value;
                select.classList.remove('open');
                
                updateAvailableOptions();
            });
        });
    });

    // 点击外部关闭选项
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select').forEach(select => {
                select.classList.remove('open');
            });
        }
    });
}

function updateAvailableOptions() {
    const selectedValues = new Set();
    document.querySelectorAll('.custom-select').forEach(select => {
        if (select.dataset.value) {
            selectedValues.add(select.dataset.value);
        }
    });

    document.querySelectorAll('.custom-select .option').forEach(option => {
        if (selectedValues.has(option.dataset.value)) {
            option.classList.add('disabled');
        } else {
            option.classList.remove('disabled');
        }
    });
}

// 分析按钮点击事件
document.getElementById('analyzeBtn').addEventListener('click', async function() {
    // ... 其他代码保持不变 ...
    
    // 获取选择的牌的显示文本而不是值
    const card1 = document.getElementById('card1').selectedOptions[0].text;
    const card2 = document.getElementById('card2').selectedOptions[0].text;
    const flop1 = document.getElementById('flop1').selectedOptions[0].text;
    const flop2 = document.getElementById('flop2').selectedOptions[0].text;
    const flop3 = document.getElementById('flop3').selectedOptions[0].text;
    const turn = document.getElementById('turn').selectedOptions[0].text;
    const river = document.getElementById('river').selectedOptions[0].text;
    
    // ... 其他代码保持不变 ...
});
