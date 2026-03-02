// app.js

// 1. 繪製易經卦象圖形 (由上往下畫)
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

// 2. 核心演算法：產生單一爻的數值
function castLine(method) {
    if (method === 'coin') {
        let sum = 0;
        for(let i = 0; i < 3; i++) {
            sum += (Math.random() < 0.5 ? 2 : 3);
        }
        return sum;
    } else {
        let r = Math.floor(Math.random() * 16) + 1;
        if (r === 1) return 6;               
        if (r >= 2 && r <= 6) return 7;      
        if (r >= 7 && r <= 13) return 8;     
        return 9;                            
    }
}

// 3. 輔助函式：用二進位字串找出對應的卦象 ID
function getGuaIdByBinary(binaryStr) {
    for (let id in iChingData) {
        if (iChingData[id].binary === binaryStr) return id;
    }
    return null; 
}

// 4. 監聽按鈕點擊事件：開始卜卦！
document.getElementById('divine-btn').addEventListener('click', function() {
    
    const method = document.getElementById('method-select').value;
    
    let origBinary = ""; // 本卦二進位
    let transBinary = ""; // 之卦二進位
    let changingLines = []; // 變爻位置紀錄

    for(let i = 0; i < 6; i++) {
        let lineValue = castLine(method);
        if (lineValue === 7 || lineValue === 9) origBinary += "1";
        else origBinary += "0";

        if (lineValue === 6 || lineValue === 7) transBinary += "1";
        else transBinary += "0";

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

    // 【新增】：提早把「靜爻」算出來，等一下畫圖跟解卦都會用到
    let staticLines = [];
    for (let i = 0; i < 6; i++) {
        if (!changingLines.includes(i)) staticLines.push(i);
    }

    // 重心是否轉移到之卦？(決定版面配置)
    let focusOnZhiGua = false;
    if (count === 4 || count === 5 || (count === 6 && origId !== "1" && origId !== "2")) {
        focusOnZhiGua = true;
    }

    // 【視覺修正】：決定之卦要亮紅燈的爻
    let transHighlight = [];
    if (count === 4 || count === 5) {
        // 4變、5變時，要看的是之卦的「靜爻」，所以把靜爻標紅
        transHighlight = staticLines;
    } 
    // 若為 6 變爻，看整體卦辭不標單一爻，所以維持空陣列 []

    // 呼叫函式畫出圖形
    drawHexagram(origBinary, 'orig-pic', changingLines); // 本卦永遠標示動爻
    drawHexagram(transBinary, 'trans-pic', transHighlight); // 之卦依據新邏輯動態標示

    // 5. 處理變爻的顯示邏輯 (朱熹解卦法則)
    let changingText = `<h3 style="margin-top: 0; color: #8a6d3b;">解卦指示</h3>`;
    changingText += `本次卜卦共有 <strong style="color:#d35400;">${count}</strong> 個變爻。<br><br>`;

    if (count === 0) {
        changingText += `【解卦法則：六爻皆靜】<br>事物處於相對穩定的狀態。請參考本卦（${origGua.name}）的<strong>卦辭</strong>：<br><br><span style="color:#2c3e50; font-size:1.1em;">「${origGua.gua_ci}」</span>`;
    } 
    else if (count === 1) {
        let y1 = changingLines[0];
        changingText += `【解卦法則：一爻變】<br>請看本卦（${origGua.name}）發生變動的<strong>爻辭</strong>，這是最直接的指引：<br><br><strong style="color:#2c3e50; font-size:1.1em;">${origGua.yao_ci[y1].name}</strong>：<span style="color:#2c3e50; font-size:1.1em;">「${origGua.yao_ci[y1].text}」</span>`;
    } 
    else if (count === 2) {
        let y1 = changingLines[0]; 
        let y2 = changingLines[1]; 
        changingText += `【解卦法則：兩爻變】<br>請看本卦（${origGua.name}）的兩個變爻，並以<strong>上位者（${origGua.yao_ci[y2].name}）</strong>為主：<br><br>`;
        changingText += `<strong style="color:#2c3e50; font-size:1.1em;">${origGua.yao_ci[y2].name} (主)</strong>：<span style="color:#2c3e50; font-size:1.1em;">「${origGua.yao_ci[y2].text}」</span><br><br>`;
        changingText += `<strong style="color:#7f8c8d;">${origGua.yao_ci[y1].name} (輔)</strong>：<span style="color:#7f8c8d;">「${origGua.yao_ci[y1].text}」</span>`;
    } 
    else if (count === 3) {
        changingText += `【解卦法則：三爻變】<br>變動剛好一半，處於轉折點。請綜合參考本卦與之卦的<strong>卦辭</strong>：<br><br>`;
        changingText += `<strong style="color:#2c3e50; font-size:1.1em;">本卦 (${origGua.name})</strong>：<span style="color:#2c3e50; font-size:1.1em;">「${origGua.gua_ci}」</span><br><br>`;
        changingText += `<strong style="color:#2c3e50; font-size:1.1em;">之卦 (${transGua.name})</strong>：<span style="color:#2c3e50; font-size:1.1em;">「${transGua.gua_ci}」</span>`;
    } 
    else if (count === 4) {
        let s1 = staticLines[0]; 
        let s2 = staticLines[1]; 
        changingText += `【解卦法則：四爻變】<br>變動已過半，未來趨勢成形。請看<strong>之卦（${transGua.name}）</strong>的兩個「靜爻」，並以<strong>下位者（${transGua.yao_ci[s1].name}）</strong>為主：<br><br>`;
        changingText += `<strong style="color:#2c3e50; font-size:1.1em;">${transGua.yao_ci[s1].name} (主)</strong>：<span style="color:#2c3e50; font-size:1.1em;">「${transGua.yao_ci[s1].text}」</span><br><br>`;
        changingText += `<strong style="color:#7f8c8d;">${transGua.yao_ci[s2].name} (輔)</strong>：<span style="color:#7f8c8d;">「${transGua.yao_ci[s2].text}」</span>`;
    } 
    else if (count === 5) {
        let s1 = staticLines[0];
        changingText += `【解卦法則：五爻變】<br>變動將達極限。請看<strong>之卦（${transGua.name}）</strong>唯一沒變的「靜爻」：<br><br>`;
        changingText += `<strong style="color:#2c3e50; font-size:1.1em;">${transGua.yao_ci[s1].name}</strong>：<span style="color:#2c3e50; font-size:1.1em;">「${transGua.yao_ci[s1].text}」</span>`;
    } 
    else if (count === 6) {
        if (origId === "1" || origId === "2") {
            changingText += `【解卦法則：六爻全變 (特例)】<br>請看本卦（${origGua.name}）的專屬特例：<br><br><span style="color:#2c3e50; font-size:1.1em;">「<strong>${origGua.special}</strong>」</span>`;
        } else {
            changingText += `【解卦法則：六爻全變】<br>物極必反，原狀態已完全翻轉。請直接看<strong>之卦（${transGua.name}）</strong>的<strong>卦辭</strong>：<br><br><span style="color:#2c3e50; font-size:1.1em;">「${transGua.gua_ci}」</span>`;
        }
    }

    // 版面配置邏輯
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