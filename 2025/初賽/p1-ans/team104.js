let currentInput = ""; // 存儲用戶輸入
let lastResult = null; // 上一次計算結果

// 用戶輸入數字或操作符
function appendValue(value) {
    const display = document.getElementById('display');
    
    // 防止以 "*" 或 "/" 開頭
    if (currentInput === "" && (value === "*" || value === "/")) {
        return;
    }
    
    // 替換 "*" 和 "/" 為 "×" 和 "÷" 顯示
    if (value === "*") {
        currentInput += "*"; // 邏輯中保留 "*"
        display.textContent += "×"; // 顯示 "×"
    } else if (value === "/") {
        currentInput += "/"; // 邏輯中保留 "/"
        display.textContent += "÷"; // 顯示 "÷"
    } else {
        currentInput += value;
        display.textContent += value;
    }
}

// 清空顯示屏和輸入
function clearDisplay() {
    currentInput = "";
    document.getElementById('display').textContent = "";
}

// 計算結果
function calculateResult() {
    try {
        // 將 "×" 替換回 "*"，"÷" 替換回 "/"
        const sanitizedInput = currentInput.replace(/×/g, "*").replace(/÷/g, "/");
        const result = eval(sanitizedInput); // 計算結果
        
        // 更新顯示
        currentInput = result.toString();
        document.getElementById('display').textContent = currentInput;
    } catch (e) {
        // 發生錯誤時顯示
        document.getElementById('display').textContent = "錯誤";
    }
}
