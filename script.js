
(function () {
'use strict';

/* ==========================================================================
    1. Pure Mathematical Engine (PEMDAS / BODMAS)
    ========================================================================== */
const Precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2,
    '^': 3
};

function normalizeExpression(raw) {
    return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
}

function tokenize(expr) {
    const norm = normalizeExpression(expr);
    const tokens = [];
    let i = 0;

    while (i < norm.length) {
    const ch = norm[i];

    if (ch === '(') {
        tokens.push({ type: 'lparen', value: '(' });
        i++;
        continue;
    }
    if (ch === ')') {
        tokens.push({ type: 'rparen', value: ')' });
        i++;
        continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '^') {
        const prev = tokens[tokens.length - 1];
        const isUnary = ch === '-' && (i === 0 || prev?.type === 'operator' || prev?.type === 'lparen');

        if (isUnary) {
        let numStr = '-';
        i++;
        while (i < norm.length && /[0-9.]/.test(norm[i])) {
            numStr += norm[i];
            i++;
        }
        if (numStr === '-') {
            throw new Error('Invalid syntax: incomplete negative value');
        }
        if ((numStr.match(/\./g) || []).length > 1) {
            throw new Error('Invalid number: multiple decimals');
        }
        tokens.push({ type: 'number', value: numStr });
        continue;
        }

        tokens.push({ type: 'operator', value: ch });
        i++;
        continue;
    }

    if (/[0-9.]/.test(ch)) {
        let numStr = '';
        while (i < norm.length && /[0-9.]/.test(norm[i])) {
        numStr += norm[i];
        i++;
        }
        if ((numStr.match(/\./g) || []).length > 1) {
        throw new Error('Invalid number: multiple decimals');
        }
        tokens.push({ type: 'number', value: numStr });
        continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
    }

    return tokens;
}

function infixToPostfix(tokens) {
    const output = [];
    const opStack = [];

    for (const token of tokens) {
    if (token.type === 'number') {
        output.push(token);
    } else if (token.type === 'operator') {
        const pCurr = Precedence[token.value] || 0;
        while (opStack.length > 0 && opStack[opStack.length - 1].type === 'operator') {
        const top = opStack[opStack.length - 1];
        const pTop = Precedence[top.value] || 0;
        // Exponentiation is right-associative
        if (token.value === '^' ? pTop > pCurr : pTop >= pCurr) {
            output.push(opStack.pop());
        } else {
            break;
        }
        }
        opStack.push(token);
    } else if (token.type === 'lparen') {
        opStack.push(token);
    } else if (token.type === 'rparen') {
        let matched = false;
        while (opStack.length > 0) {
        const top = opStack.pop();
        if (top.type === 'lparen') {
            matched = true;
            break;
        }
        output.push(top);
        }
        if (!matched) throw new Error('Mismatched parentheses');
    }
    }

    while (opStack.length > 0) {
    const top = opStack.pop();
    if (top.type === 'lparen' || top.type === 'rparen') {
        throw new Error('Mismatched parentheses');
    }
    output.push(top);
    }

    return output;
}

function evaluatePostfix(postfix) {
    const stack = [];

    for (const token of postfix) {
    if (token.type === 'number') {
        stack.push(parseFloat(token.value));
    } else if (token.type === 'operator') {
        if (stack.length < 2) {
        throw new Error('Malformed expression syntax');
        }
        const b = stack.pop();
        const a = stack.pop();

        let val = 0;
        switch (token.value) {
        case '+': val = a + b; break;
        case '-': val = a - b; break;
        case '*': val = a * b; break;
        case '/':
            if (b === 0) throw new Error('Cannot divide by zero');
            val = a / b;
            break;
        case '%':
            if (b === 0) throw new Error('Cannot divide by zero');
            val = a % b;
            break;
        case '^': val = Math.pow(a, b); break;
        default: throw new Error(`Unknown operator: ${token.value}`);
        }
        stack.push(val);
    }
    }

    if (stack.length !== 1) {
    throw new Error('Malformed expression');
    }

    return stack[0];
}

function formatResult(val) {
    if (!Number.isFinite(val)) {
    if (Number.isNaN(val)) return 'Error';
    return val > 0 ? 'Infinity' : '-Infinity';
    }
    // Precision round to prevent 0.1 + 0.2 = 0.30000000000000004
    const rounded = parseFloat(val.toPrecision(12));
    if (Math.abs(rounded) >= 1e14 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
    return rounded.toExponential(6).replace(/\.?0+e/, 'e');
    }
    return rounded.toString();
}

function evaluateExpression(raw) {
    try {
    const trimmed = raw.trim();
    if (!trimmed) return { success: true, result: '0' };
    const tokens = tokenize(trimmed);
    if (!tokens.length) return { success: true, result: '0' };
    const postfix = infixToPostfix(tokens);
    const num = evaluatePostfix(postfix);
    return { success: true, result: formatResult(num) };
    } catch (err) {
    return { success: false, result: 'Error', error: err.message || 'Error' };
    }
}

/* ==========================================================================
    2. Audio Synthesis (Web Audio API - Subtle Material Click Juice)
    ========================================================================== */
let audioCtx = null;
let isMuted = localStorage.getItem('gdg_calc_sound') === 'muted';

function playKeyClickSound(type) {
    if (isMuted) return;
    try {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    let freq = 480;
    if (type === 'equals') freq = 680;
    else if (type === 'clear') freq = 320;
    else if (type === 'op') freq = 540;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
    } catch (e) {
    // Audio context not allowed before interaction
    }
}

/* ==========================================================================
    3. UI State Management
    ========================================================================== */
const state = {
    currentInput: '0',
    expressionFormula: '',
    lastEvaluated: false,
    lastAnswer: '0',
    history: []
};

// DOM Elements
const primaryDisplay = document.getElementById('primary-display');
const expressionDisplay = document.getElementById('expression-display');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const historyToggleBtn = document.getElementById('history-toggle-btn');
const historyCounter = document.getElementById('history-counter');
const historyDrawer = document.getElementById('history-drawer');
const historyOverlay = document.getElementById('history-overlay');
const historyList = document.getElementById('history-list');
const historyClearBtn = document.getElementById('history-clear-btn');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// Load History from localStorage
try {
    const stored = localStorage.getItem('gdg_algiers_calc_history');
    if (stored) {
    state.history = JSON.parse(stored);
    }
} catch (e) {
    state.history = [];
}

function saveHistory() {
    try {
    localStorage.setItem('gdg_algiers_calc_history', JSON.stringify(state.history.slice(0, 50)));
    } catch (e) {}
    updateHistoryUI();
}

function updateDisplay() {
    // Format primary display text
    primaryDisplay.textContent = state.currentInput;
    expressionDisplay.textContent = state.expressionFormula;

    // Adjust font size dynamically to fit content
    const len = state.currentInput.length;
    if (len > 14) {
    primaryDisplay.style.fontSize = '22px';
    } else if (len > 10) {
    primaryDisplay.style.fontSize = '28px';
    } else if (len > 8) {
    primaryDisplay.style.fontSize = '34px';
    } else {
    primaryDisplay.style.fontSize = '44px';
    }

    // Error styling
    if (state.currentInput === 'Error' || state.currentInput.startsWith('Cannot divide')) {
    primaryDisplay.classList.add('error-state');
    } else {
    primaryDisplay.classList.remove('error-state');
    }

    // Scroll both displays to right
    primaryDisplay.scrollLeft = primaryDisplay.scrollWidth;
    expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
}

/* ==========================================================================
    4. Calculator Operations
    ========================================================================== */
function appendDigit(digit) {
    if (state.lastEvaluated) {
    state.currentInput = digit;
    state.expressionFormula = '';
    state.lastEvaluated = false;
    } else if (state.currentInput === '0' || state.currentInput === 'Error') {
    state.currentInput = digit;
    } else {
    state.currentInput += digit;
    }
    updateDisplay();
}

function appendDecimal() {
    if (state.lastEvaluated) {
    state.currentInput = '0.';
    state.expressionFormula = '';
    state.lastEvaluated = false;
    updateDisplay();
    return;
    }

    if (state.currentInput === 'Error') {
    state.currentInput = '0.';
    updateDisplay();
    return;
    }

    // Check if current input already contains a decimal point
    // If currentInput has multiple tokens (e.g. within compound formula), check the last segment
    const lastNumMatch = state.currentInput.match(/[0-9.]*$/);
    const currentSegment = lastNumMatch ? lastNumMatch[0] : state.currentInput;

    if (!currentSegment.includes('.')) {
    state.currentInput += '.';
    updateDisplay();
    }
}

function appendOperator(op) {
    if (state.currentInput === 'Error') {
    state.currentInput = '0';
    }

    // If right after an evaluation, continue from the previous answer
    if (state.lastEvaluated) {
    state.expressionFormula = state.currentInput + ' ' + op + ' ';
    state.currentInput = '0';
    state.lastEvaluated = false;
    updateDisplay();
    return;
    }

    // If currentInput is already set, append to expression formula
    const trimmedCurr = state.currentInput.trim();
    if (trimmedCurr !== '') {
    state.expressionFormula += trimmedCurr + ' ' + op + ' ';
    state.currentInput = '0';
    } else {
    // Replace the last operator in expressionFormula if user types another operator
    const trailingOpRegex = /\s*([+\-×÷\^])\s*$/;
    if (trailingOpRegex.test(state.expressionFormula)) {
        state.expressionFormula = state.expressionFormula.replace(trailingOpRegex, ' ' + op + ' ');
    }
    }
    updateDisplay();
}

function appendParenthesis(paren) {
    if (state.lastEvaluated) {
    state.expressionFormula = '';
    state.lastEvaluated = false;
    }

    if (paren === '(') {
    if (state.currentInput !== '0' && state.currentInput !== '') {
        state.expressionFormula += state.currentInput + ' × ( ';
    } else {
        state.expressionFormula += '( ';
    }
    state.currentInput = '0';
    } else if (paren === ')') {
    if (state.currentInput !== '') {
        state.expressionFormula += state.currentInput + ' ) ';
        state.currentInput = '';
    } else {
        state.expressionFormula += ') ';
    }
    }
    updateDisplay();
}

function toggleSign() {
    if (state.currentInput === 'Error' || state.currentInput === '0') return;

    if (state.currentInput.startsWith('-')) {
    state.currentInput = state.currentInput.slice(1);
    } else {
    state.currentInput = '-' + state.currentInput;
    }
    updateDisplay();
}

function applyPercentage() {
    if (state.currentInput === 'Error') return;

    const val = parseFloat(state.currentInput);
    if (Number.isFinite(val)) {
    const res = formatResult(val / 100);
    state.currentInput = res;
    updateDisplay();
    }
}

function deleteLast() {
    if (state.lastEvaluated) {
    state.expressionFormula = '';
    state.lastEvaluated = false;
    updateDisplay();
    return;
    }

    if (state.currentInput.length > 1) {
    state.currentInput = state.currentInput.slice(0, -1);
    } else {
    state.currentInput = '0';
    }
    updateDisplay();
}

function clearAll() {
    state.currentInput = '0';
    state.expressionFormula = '';
    state.lastEvaluated = false;
    updateDisplay();
}

function recallAns() {
    if (state.lastEvaluated) {
    state.expressionFormula = '';
    state.lastEvaluated = false;
    }
    state.currentInput = state.lastAnswer;
    updateDisplay();
}

function calculateEquals() {
    // Build complete formula
    let fullExpr = state.expressionFormula;
    if (state.currentInput !== '') {
    fullExpr += state.currentInput;
    } else if (!fullExpr.trim()) {
    fullExpr = '0';
    }

    fullExpr = fullExpr.trim();
    if (!fullExpr) return;

    // Close any open parentheses automatically for user convenience
    const openParens = (fullExpr.match(/\(/g) || []).length;
    const closeParens = (fullExpr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
    fullExpr += ' )'.repeat(openParens - closeParens);
    }

    const evalResult = evaluateExpression(fullExpr);

    if (evalResult.success) {
    const rawExprClean = fullExpr;
    const resVal = evalResult.result;

    // Save record in history
    state.history.unshift({
        id: Date.now(),
        expression: rawExprClean,
        result: resVal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    saveHistory();

    state.lastAnswer = resVal;
    state.expressionFormula = rawExprClean + ' =';
    state.currentInput = resVal;
    state.lastEvaluated = true;
    } else {
    state.expressionFormula = fullExpr + ' =';
    state.currentInput = evalResult.error || 'Error';
    state.lastEvaluated = true;
    }

    updateDisplay();
}

/* ==========================================================================
    5. History Drawer UI & Management
    ========================================================================== */
function updateHistoryUI() {
    const count = state.history.length;
    historyCounter.textContent = count;
    if (count > 0) {
    historyCounter.classList.add('show');
    } else {
    historyCounter.classList.remove('show');
    }

    if (count === 0) {
    historyList.innerHTML = `
        <div class="history-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>No calculations recorded yet.</span>
        </div>
    `;
    return;
    }

    historyList.innerHTML = state.history
    .map(
        (item) => `
        <div class="history-item" data-res="${item.result}" data-expr="${item.expression}" role="button" tabindex="0">
        <div class="history-item-expr">${item.expression} =</div>
        <div class="history-item-result">${item.result}</div>
        <div class="history-item-meta">
            <span>${item.time}</span>
            <span style="color: var(--google-blue); font-weight: 500;">Tap to use</span>
        </div>
        </div>
    `
    )
    .join('');
}

function toggleHistory(open) {
    const shouldOpen = open !== undefined ? open : !historyDrawer.classList.contains('open');
    if (shouldOpen) {
    historyDrawer.classList.add('open');
    historyOverlay.classList.add('open');
    } else {
    historyDrawer.classList.remove('open');
    historyOverlay.classList.remove('open');
    }
}

historyToggleBtn.addEventListener('click', () => toggleHistory());
historyOverlay.addEventListener('click', () => toggleHistory(false));
const historyCloseBtn = document.getElementById('history-close-btn');
if (historyCloseBtn) {
    historyCloseBtn.addEventListener('click', () => toggleHistory(false));
}
historyClearBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    showToast('History cleared');
});

historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const res = item.getAttribute('data-res');
    if (res) {
    state.currentInput = res;
    state.expressionFormula = '';
    state.lastEvaluated = false;
    updateDisplay();
    toggleHistory(false);
    showToast('Result loaded');
    }
});

/* ==========================================================================
    6. Toast Feedback Notification
    ========================================================================== */
let toastTimeout = null;
function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    }, 2000);
}

copyBtn.addEventListener('click', () => {
    const textToCopy = state.currentInput;
    if (!textToCopy || textToCopy === 'Error') return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Copied: ' + textToCopy);
    }).catch(() => {
        fallbackCopy(textToCopy);
    });
    } else {
    fallbackCopy(textToCopy);
    }
});

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
    document.execCommand('copy');
    showToast('Copied: ' + text);
    } catch (e) {
    showToast('Could not copy');
    }
    document.body.removeChild(textArea);
}

/* ==========================================================================
    7. Theme System & Sound Feedback Switcher
    ========================================================================== */
const savedTheme = localStorage.getItem('gdg_calc_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gdg_calc_theme', theme);

    const themeIcon = document.getElementById('theme-icon');
    if (theme === 'dark') {
    // Render Sun Icon (to switch to light)
    themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    } else {
    // Render Moon Icon (to switch to dark)
    themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    }
}
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    playKeyClickSound('op');
});

// Sound Toggle
function updateSoundIcon() {
    const icon = document.getElementById('sound-icon');
    if (isMuted) {
    icon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    `;
    soundToggleBtn.style.opacity = '0.55';
    } else {
    icon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    `;
    soundToggleBtn.style.opacity = '1';
    }
}
updateSoundIcon();

soundToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('gdg_calc_sound', isMuted ? 'muted' : 'active');
    updateSoundIcon();
    if (!isMuted) playKeyClickSound('equals');
    showToast(isMuted ? 'Sound muted' : 'Sound enabled');
});

/* ==========================================================================
    8. Click & Ripple Micro-Animation Handlers
    ========================================================================== */
function triggerRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    circle.classList.add('ripple');

    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    let clientX = e?.clientX;
    let clientY = e?.clientY;

    if (!clientX || !clientY) {
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
    }

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${clientX - rect.left - radius}px`;
    circle.style.top = `${clientY - rect.top - radius}px`;

    const existing = btn.getElementsByClassName('ripple')[0];
    if (existing) existing.remove();

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 450);
}

function handleButtonAction(btn, e) {
    triggerRipple(btn, e);

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value');

    switch (action) {
    case 'num':
        playKeyClickSound('num');
        appendDigit(value);
        break;
    case 'decimal':
        playKeyClickSound('num');
        appendDecimal();
        break;
    case 'op':
        playKeyClickSound('op');
        appendOperator(value);
        break;
    case 'equals':
        playKeyClickSound('equals');
        calculateEquals();
        break;
    case 'clear':
        playKeyClickSound('clear');
        clearAll();
        break;
    case 'delete':
        playKeyClickSound('clear');
        deleteLast();
        break;
    case 'toggle-sign':
        playKeyClickSound('op');
        toggleSign();
        break;
    case 'percent':
        playKeyClickSound('op');
        applyPercentage();
        break;
    case 'paren-open':
        playKeyClickSound('op');
        appendParenthesis('(');
        break;
    case 'paren-close':
        playKeyClickSound('op');
        appendParenthesis(')');
        break;
    case 'ans':
        playKeyClickSound('op');
        recallAns();
        break;
    }
}

// Attach Click to all Buttons
document.querySelectorAll('.btn, .aux-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleButtonAction(btn, e));
});

/* ==========================================================================
    9. Complete Keyboard Support & Visual Keypress Animations
    ========================================================================== */
window.addEventListener('keydown', (e) => {
    // If modal history is open, allow Escape to close it
    if (e.key === 'Escape' && historyDrawer.classList.contains('open')) {
    toggleHistory(false);
    e.preventDefault();
    return;
    }

    let matchedBtn = null;

    if (/[0-9]/.test(e.key)) {
    matchedBtn = document.querySelector(`.btn[data-key="${e.key}"]`);
    if (matchedBtn) appendDigit(e.key);
    } else if (e.key === '.' || e.key === ',') {
    matchedBtn = document.querySelector('.btn[data-action="decimal"]');
    appendDecimal();
    } else if (e.key === '+') {
    matchedBtn = document.querySelector('.btn[data-key="+"]');
    appendOperator('+');
    } else if (e.key === '-') {
    matchedBtn = document.querySelector('.btn[data-key="-"]');
    appendOperator('−');
    } else if (e.key === '*') {
    matchedBtn = document.querySelector('.btn[data-key="*"]');
    appendOperator('×');
    } else if (e.key === '/') {
    matchedBtn = document.querySelector('.btn[data-key="/"]');
    appendOperator('÷');
    } else if (e.key === '^') {
    matchedBtn = document.querySelector('.aux-btn[data-key="^"]');
    appendOperator('^');
    } else if (e.key === '%') {
    matchedBtn = document.querySelector('.btn[data-key="%"]');
    applyPercentage();
    } else if (e.key === '(') {
    matchedBtn = document.querySelector('.aux-btn[data-key="("]');
    appendParenthesis('(');
    } else if (e.key === ')') {
    matchedBtn = document.querySelector('.aux-btn[data-key=")"]');
    appendParenthesis(')');
    } else if (e.key === 'Enter' || e.key === '=') {
    matchedBtn = document.querySelector('.btn-equals');
    calculateEquals();
    e.preventDefault();
    } else if (e.key === 'Backspace') {
    matchedBtn = document.querySelector('.btn-del');
    deleteLast();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
    matchedBtn = document.querySelector('.btn-ac');
    clearAll();
    }

    if (matchedBtn) {
    matchedBtn.classList.add('key-pressed');
    triggerRipple(matchedBtn);
    playKeyClickSound(matchedBtn.getAttribute('data-action'));
    setTimeout(() => {
        matchedBtn.classList.remove('key-pressed');
    }, 160);
    }
});

// Initial setup
updateHistoryUI();
updateDisplay();
})();
