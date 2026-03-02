// app.js

// 🌟 新增：八卦(三爻)的二進位對應表，用來解析上下卦
const baGuaMap = {
    "111": "乾(天)", "110": "兌(澤)", "101": "離(火)", "100": "震(雷)",
    "011": "巽(風)", "010": "坎(水)", "001": "艮(山)", "000": "坤(地)"
};

document.getElementById('setup-api-btn').addEventListener('click', function() {
    let currentKey = localStorage.getItem('gemini_api_key') || '';
    let newKey = prompt("請輸入您的 Gemini API Key：\n(此金鑰僅會儲存於您的設備本機，確保安全)", currentKey);
    if (newKey !== null) {
        localStorage.setItem('gemini_api_key', newKey.trim());
        alert("API Key 已儲存！下次卜卦將自動啟用 AI 解惑功能。");
    }
});

function drawHexagram(binaryStr, containerId, highlightLines = []) {
    let html = '<div class="hexagram-box">';
    for (let i = 5; i >= 0; i--) {
        let isHighlight = highlightLines.includes(i) ? "changing-yao" : "";
        if (binaryStr[i] === '1') {
            html += `<div class="yao ${isHighlight}"><div class="yang"></div></div>`;
        } else {
            html += `<div class="yao ${isHighlight}"><div class="yin-part"></div><div class="yin-part"></div></div>`;
        }
    }
    html += '</div>';
    document.getElementById(containerId).innerHTML = html;
}

function castLine(method) {
    if (method === 'coin') {
        let sum = 0;
        for(let i = 0; i < 3; i++) sum += (Math.random() < 0.5 ? 2 : 3);
        return sum;
    } else {
        let r = Math.floor(Math.random() * 16) + 1;
        if (r === 1) return 6;               
        if (r >= 2 && r <= 6) return 7;      
        if (r >= 7 && r <= 13) return 8;     
        return 9;                            
    }
}

function getGuaIdByBinary(binaryStr) {
    for (let id in iChingData) {
        if (iChingData[id].binary === binaryStr) return id;
    }
    return null; 
}

async function fetchAIInterpretation(promptText) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        if (data.error) return "API 金鑰錯誤或額度已滿，無法取得 AI 解析。";
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        return "無法連線至 AI 伺服器，請檢查網路連線。";
    }
}

// 🌟 輔助函式：用來將卦名加上 [上X 下Y] 的格式
function formatGuaNameWithParts(baseName, binaryStr) {
    let lowerBinary = binaryStr.substring(0, 3); // 內卦 (下半部 1~3爻)
    let upperBinary = binaryStr.substring(3, 6); // 外卦 (上半部 4~6爻)
    return `${baseName} [上${baGuaMap[upperBinary]} 下${baGuaMap[lowerBinary]}]`;
}

document.getElementById('divine-btn').addEventListener('click', async function() {
    const method = document.getElementById('method-select').value;
    const userQuestion = document.getElementById('user-question').value.trim();
    
    // 🌟 顯示使用者問題
    const questionDisplay = document.getElementById('question-display');
    if (userQuestion) {
        questionDisplay.innerText = `❓ 您的提問：${userQuestion}`;
        questionDisplay.style.display = 'block';
    } else {
        questionDisplay.style.display = 'none';
    }

    let origBinary = "", transBinary = "", changingLines = [];

    for(let i = 0; i < 6; i++) {
        let lineValue = castLine(method);
        if (lineValue === 7 || lineValue === 9) origBinary += "1"; else origBinary += "0";
        if (lineValue === 6 || lineValue === 7) transBinary += "1"; else transBinary += "0";
        if (lineValue === 6 || lineValue === 9) changingLines.push(i);
    }

    const origId = getGuaIdByBinary(origBinary);
    const transId = getGuaIdByBinary(transBinary);
    const origGua = iChingData[origId];
    const transGua = iChingData[transId];

    // 🌟 將卦名套用上下卦結構解析
    document.getElementById('orig-name').innerText = formatGuaNameWithParts(origGua.name, origBinary);
    document.getElementById('orig-guaci').innerText = origGua.gua_ci;
    document.getElementById('trans-name').innerText = formatGuaNameWithParts(transGua.name, transBinary);
    document.getElementById('trans-guaci').innerText = transGua.gua_ci;

    let count = changingLines.length;
    let staticLines = [];
    for (let i = 0; i < 6; i++) {
        if (!changingLines.includes(i)) staticLines.push(i);
    }

    let focusOnZhiGua = false;
    if (count === 4 || count === 5 || (count === 6 && origId !== "1" && origId !== "2")) focusOnZhiGua = true;
    let transHighlight = [];
    if (count === 4 || count === 5) transHighlight = staticLines;

    drawHexagram(origBinary, 'orig-pic', changingLines); 
    drawHexagram(transBinary, 'trans-pic', transHighlight); 

    let changingText = `<h3 class="interp-title">解卦指示</h3>`;
    changingText += `本次卜卦共有 <strong style="color:#e74c3c;">${count}</strong> 個變爻。<br><br>`;
    
    let focusTextForAI = ""; 

    if (count === 0) {
        changingText += `【解卦法則：六爻皆靜】<br>事物處於相對穩定的狀態。`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：本卦卦辭</span>「${origGua.gua_ci}」</div>`;
        focusTextForAI = `本卦卦辭：「${origGua.gua_ci}」`;
    } 
    else if (count === 1) {
        let y1 = changingLines[0];
        changingText += `【解卦法則：一爻變】<br>請看發生變動的爻辭，這是最直接的指引：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${origGua.name} ${origGua.yao_ci[y1].name}</span>「${origGua.yao_ci[y1].text}」</div>`;
        focusTextForAI = `${origGua.yao_ci[y1].name} 爻辭：「${origGua.yao_ci[y1].text}」`;
    } 
    else if (count === 2) {
        let y1 = changingLines[0]; let y2 = changingLines[1]; 
        changingText += `【解卦法則：兩爻變】<br>請看本卦的兩個變爻，並以<strong>上位者（${origGua.yao_ci[y2].name}）</strong>為主：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${origGua.yao_ci[y2].name}</span>「${origGua.yao_ci[y2].text}」</div>`;
        changingText += `<div class="highlight-aux">次要參考：${origGua.yao_ci[y1].name} ➔「${origGua.yao_ci[y1].text}」</div>`;
        focusTextForAI = `主要為 ${origGua.yao_ci[y2].name} 爻辭：「${origGua.yao_ci[y2].text}」，輔以 ${origGua.yao_ci[y1].name} 爻辭：「${origGua.yao_ci[y1].text}」`;
    } 
    else if (count === 3) {
        changingText += `【解卦法則：三爻變】<br>變動剛好一半，處於轉折點。請綜合參考本卦與之卦的<strong>卦辭</strong>：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：本卦 (${origGua.name})</span>「${origGua.gua_ci}」</div>`;
        changingText += `<div class="highlight-main" style="margin-top:5px;"><span class="ref-title">👉 綜合參考：之卦 (${transGua.name})</span>「${transGua.gua_ci}」</div>`;
        focusTextForAI = `本卦卦辭：「${origGua.gua_ci}」，以及之卦卦辭：「${transGua.gua_ci}」`;
    } 
    else if (count === 4) {
        let s1 = staticLines[0]; let s2 = staticLines[1]; 
        changingText += `【解卦法則：四爻變】<br>未來趨勢成形。請看<strong>之卦（${transGua.name}）</strong>的兩個靜爻，並以<strong>下位者（${transGua.yao_ci[s1].name}）</strong>為主：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${transGua.yao_ci[s1].name}</span>「${transGua.yao_ci[s1].text}」</div>`;
        changingText += `<div class="highlight-aux">次要參考：${transGua.yao_ci[s2].name} ➔「${transGua.yao_ci[s2].text}」</div>`;
        focusTextForAI = `之卦 ${transGua.yao_ci[s1].name} 靜爻：「${transGua.yao_ci[s1].text}」`;
    } 
    else if (count === 5) {
        let s1 = staticLines[0];
        changingText += `【解卦法則：五爻變】<br>變動將達極限。請看<strong>之卦（${transGua.name}）</strong>唯一沒變的靜爻：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${transGua.yao_ci[s1].name}</span>「${transGua.yao_ci[s1].text}」</div>`;
        focusTextForAI = `之卦 ${transGua.yao_ci[s1].name} 唯一靜爻：「${transGua.yao_ci[s1].text}」`;
    } 
    else if (count === 6) {
        if (origId === "1" || origId === "2") {
            changingText += `【解卦法則：六爻全變 (特例)】<br>請看本卦（${origGua.name}）的專屬特例：`;
            changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：乾坤特例</span>「${origGua.special}」</div>`;
            focusTextForAI = `乾坤特例：「${origGua.special}」`;
        } else {
            changingText += `【解卦法則：六爻全變】<br>原狀態已完全翻轉。請直接看<strong>之卦（${transGua.name}）</strong>的卦辭：`;
            changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：之卦卦辭</span>「${transGua.gua_ci}」</div>`;
            focusTextForAI = `之卦卦辭：「${transGua.gua_ci}」`;
        }
    }

    let interpTop = document.getElementById('interp-top');
    let interpBottom = document.getElementById('interp-bottom');

    if (focusOnZhiGua) {
        interpTop.style.display = 'none'; interpBottom.style.display = 'block'; interpBottom.innerHTML = changingText; 
    } else {
        interpBottom.style.display = 'none'; interpTop.style.display = 'block'; interpTop.innerHTML = changingText; 
    }

    let huBinary = origBinary[1] + origBinary[2] + origBinary[3] + origBinary[2] + origBinary[3] + origBinary[4];
    let cuoBinary = origBinary.split('').map(b => b === '1' ? '0' : '1').join('');
    let zongBinary = origBinary.split('').reverse().join('');

    let huId = getGuaIdByBinary(huBinary);
    let cuoId = getGuaIdByBinary(cuoBinary);
    let zongId = getGuaIdByBinary(zongBinary);

    // 🌟 深度分析也加上上下卦解析
    document.getElementById('hu-name').innerText = formatGuaNameWithParts(iChingData[huId].name, huBinary);
    document.getElementById('cuo-name').innerText = formatGuaNameWithParts(iChingData[cuoId].name, cuoBinary);
    document.getElementById('zong-name').innerText = formatGuaNameWithParts(iChingData[zongId].name, zongBinary);

    document.getElementById('hu-guaci').innerText = iChingData[huId].gua_ci;
    document.getElementById('cuo-guaci').innerText = iChingData[cuoId].gua_ci;
    document.getElementById('zong-guaci').innerText = iChingData[zongId].gua_ci;

    drawHexagram(huBinary, 'hu-pic', []);
    drawHexagram(cuoBinary, 'cuo-pic', []);
    drawHexagram(zongBinary, 'zong-pic', []);

    document.getElementById('result-panel').style.display = 'block';
    document.getElementById('advanced-section').style.display = 'block';

    const apiKey = localStorage.getItem('gemini_api_key');
    const aiPanel = document.getElementById('ai-panel');
    const aiContent = document.getElementById('ai-content');
    const aiLoading = document.getElementById('ai-loading');

    if (apiKey) {
        aiPanel.style.display = 'block';
        aiContent.style.display = 'none';
        aiLoading.style.display = 'block';

        let promptText = `你現在是一位精通易經的國學大師。`;
        if (userQuestion) {
            promptText += `使用者問的問題是：「${userQuestion}」。`;
        } else {
            promptText += `使用者沒有輸入具體問題，請給予廣泛的心境與運勢建議。`;
        }
        
        promptText += `
        卜出的本卦是『${origGua.name}』，之卦是『${transGua.name}』。
        根據朱熹的解卦法則，本次主要參考的古文是：${focusTextForAI}。

        請一併將以下三個延伸維度納入思考框架：
        1. 【互卦】(過程與內部隱憂)：『${iChingData[huId].name}』 (卦辭：${iChingData[huId].gua_ci})
        2. 【錯卦】(極端反向策略)：『${iChingData[cuoId].name}』 (卦辭：${iChingData[cuoId].gua_ci})
        3. 【綜卦】(換位思考)：『${iChingData[zongId].name}』 (卦辭：${iChingData[zongId].gua_ci})

        請用繁體中文（台灣習慣用語）寫一段淺顯易懂的白話文，結合上述古文與「互、錯、綜」的多維度視角，給予中肯、具啟發性的解讀與建議。
        不需要回報卦象的推演計算過程，請直接針對使用者的問題給予解釋與建言即可。`;

        const aiResponse = await fetchAIInterpretation(promptText);
        
        aiLoading.style.display = 'none';
        aiContent.style.display = 'block';
        aiContent.innerText = aiResponse;
    } else {
        aiPanel.style.display = 'none';
    }
});