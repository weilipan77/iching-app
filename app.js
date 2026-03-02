// app.js

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

document.getElementById('divine-btn').addEventListener('click', function() {
    const method = document.getElementById('method-select').value;
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

    document.getElementById('orig-name').innerText = origGua.name;
    document.getElementById('orig-guaci').innerText = origGua.gua_ci;
    document.getElementById('trans-name').innerText = transGua.name;
    document.getElementById('trans-guaci').innerText = transGua.gua_ci;

    let count = changingLines.length;
    let staticLines = [];
    for (let i = 0; i < 6; i++) {
        if (!changingLines.includes(i)) staticLines.push(i);
    }

    let focusOnZhiGua = false;
    if (count === 4 || count === 5 || (count === 6 && origId !== "1" && origId !== "2")) {
        focusOnZhiGua = true;
    }

    let transHighlight = [];
    if (count === 4 || count === 5) transHighlight = staticLines;

    drawHexagram(origBinary, 'orig-pic', changingLines); 
    drawHexagram(transBinary, 'trans-pic', transHighlight); 

    // 📝 處理變爻的顯示邏輯 (明確切分標籤與古文)
    let changingText = `<h3 class="interp-title">解卦指示</h3>`;
    changingText += `本次卜卦共有 <strong style="color:#e74c3c;">${count}</strong> 個變爻。<br><br>`;

    if (count === 0) {
        changingText += `【解卦法則：六爻皆靜】<br>事物處於相對穩定的狀態。`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：本卦卦辭</span>「${origGua.gua_ci}」</div>`;
    } 
    else if (count === 1) {
        let y1 = changingLines[0];
        changingText += `【解卦法則：一爻變】<br>請看發生變動的爻辭，這是最直接的指引：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${origGua.name} ${origGua.yao_ci[y1].name}</span>「${origGua.yao_ci[y1].text}」</div>`;
    } 
    else if (count === 2) {
        let y1 = changingLines[0]; // 下爻
        let y2 = changingLines[1]; // 上爻
        changingText += `【解卦法則：兩爻變】<br>請看本卦的兩個變爻，並以<strong>上位者（${origGua.yao_ci[y2].name}）</strong>為主：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${origGua.yao_ci[y2].name}</span>「${origGua.yao_ci[y2].text}」</div>`;
        changingText += `<div class="highlight-aux">次要參考：${origGua.yao_ci[y1].name} ➔「${origGua.yao_ci[y1].text}」</div>`;
    } 
    else if (count === 3) {
        changingText += `【解卦法則：三爻變】<br>變動剛好一半，處於轉折點。請綜合參考本卦與之卦的<strong>卦辭</strong>：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：本卦 (${origGua.name})</span>「${origGua.gua_ci}」</div>`;
        changingText += `<div class="highlight-main" style="margin-top:5px;"><span class="ref-title">👉 綜合參考：之卦 (${transGua.name})</span>「${transGua.gua_ci}」</div>`;
    } 
    else if (count === 4) {
        let s1 = staticLines[0]; // 下爻
        let s2 = staticLines[1]; // 上爻
        changingText += `【解卦法則：四爻變】<br>未來趨勢成形。請看<strong>之卦（${transGua.name}）</strong>的兩個靜爻，並以<strong>下位者（${transGua.yao_ci[s1].name}）</strong>為主：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${transGua.yao_ci[s1].name}</span>「${transGua.yao_ci[s1].text}」</div>`;
        changingText += `<div class="highlight-aux">次要參考：${transGua.yao_ci[s2].name} ➔「${transGua.yao_ci[s2].text}」</div>`;
    } 
    else if (count === 5) {
        let s1 = staticLines[0];
        changingText += `【解卦法則：五爻變】<br>變動將達極限。請看<strong>之卦（${transGua.name}）</strong>唯一沒變的靜爻：`;
        changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：${transGua.yao_ci[s1].name}</span>「${transGua.yao_ci[s1].text}」</div>`;
    } 
    else if (count === 6) {
        if (origId === "1" || origId === "2") {
            changingText += `【解卦法則：六爻全變 (特例)】<br>請看本卦（${origGua.name}）的專屬特例：`;
            changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：乾坤特例</span>「${origGua.special}」</div>`;
        } else {
            changingText += `【解卦法則：六爻全變】<br>原狀態已完全翻轉。請直接看<strong>之卦（${transGua.name}）</strong>的卦辭：`;
            changingText += `<div class="highlight-main"><span class="ref-title">👉 主要參考：之卦卦辭</span>「${transGua.gua_ci}」</div>`;
        }
    }

    let interpTop = document.getElementById('interp-top');
    let interpBottom = document.getElementById('interp-bottom');

    if (focusOnZhiGua) {
        interpTop.style.display = 'none'; 
        interpBottom.style.display = 'block'; 
        interpBottom.innerHTML = changingText; 
    } else {
        interpBottom.style.display = 'none'; 
        interpTop.style.display = 'block'; 
        interpTop.innerHTML = changingText; 
    }

    document.getElementById('result-panel').style.display = 'block';
});