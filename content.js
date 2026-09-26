console.log("MITS Auto Login Running...");

// Always retrieve saved credentials
chrome.storage.sync.get(["username", "password"], function (data) {
    // 1️⃣ BASE URL: auto-click login button
    if (window.location.href === "http://moodle.mitsgwalior.in/" ||
        window.location.href === "https://moodle.mitsgwalior.in/") {
        console.log("On base URL, searching for login button...");
        setTimeout(() => {
            let loginBtn = document.querySelector("a[href*='login']");
            if (loginBtn) {
                console.log("Login button found. Auto-clicking...");
                loginBtn.click();
            } else {
                console.log("Login button not found on base page");
            }
        }, 1000);
        return;
    }

    // 2️⃣ LOGIN PAGE: auto-fill + submit
    if (window.location.href.includes("/login/index.php")) {
        console.log("On login page, checking for credentials...");
        
        if (!data.username || !data.password) {
            console.log("Credentials not saved. Please set them in the extension popup.");
            // Show a more user-friendly notification
            showCredentialsNotification();
            return;
        }

        attemptAutoLogin(data.username, data.password);
        return;
    }

    // 3️⃣ DASHBOARD PAGE: do nothing
    if (window.location.href.includes("/my/")) {
        console.log("Already logged in (Dashboard).");
        return;
    }
});

function attemptAutoLogin(username, password) {
    console.log("Attempting auto-login...");
    
    let maxAttempts = 10;
    let attemptCount = 0;
    
    let loginInterval = setInterval(() => {
        attemptCount++;
        let uname = document.getElementById("username");
        let pass = document.getElementById("password");
        let login = document.getElementById("loginbtn");
        
        if (uname && pass && login) {
            clearInterval(loginInterval);
            console.log("Login form found, filling credentials...");
            
            uname.value = username;
            pass.value = password;
            console.log("Filled username/password");
            
            setTimeout(() => {
                login.click();
                console.log("Login clicked");
                
                // Wait for login to complete and redirect
                monitorLoginStatus();
            }, 800);
        } else if (attemptCount >= maxAttempts) {
            clearInterval(loginInterval);
            console.log("Login form not found after maximum attempts");
        }
    }, 500);
}

function monitorLoginStatus() {
    let checkCount = 0;
    let maxChecks = 20;
    
    let checkLogin = setInterval(() => {
        checkCount++;
        
        // Check if we're on dashboard or if login was successful
        if (window.location.href.includes("/my/") || 
            document.body.innerText.includes("Dashboard") || 
            document.body.innerText.includes("My courses") ||
            document.querySelector(".dashboard-card-deck") ||
            document.querySelector(".block_myoverview")) {
            
            clearInterval(checkLogin);
            console.log("Login successful!");
            
            // Ensure we're on the dashboard
            if (!window.location.href.includes("/my/")) {
                window.location.href = "/my/";
            }
        } else if (checkCount >= maxChecks) {
            clearInterval(checkLogin);
            console.log("Login status check timeout");
        }
        
        // Check for login errors
        if (document.body.innerText.includes("Invalid login") || 
            document.body.innerText.includes("incorrect") ||
            document.querySelector(".loginerrors")) {
            
            clearInterval(checkLogin);
            console.log("Login failed - invalid credentials");
            showLoginErrorNotification();
        }
    }, 1000);
}

function showCredentialsNotification() {
    // Create a visible notification on the page
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffeb3b;
        color: #333;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 300px;
        border-left: 4px solid #ff9800;
    `;
    notification.innerHTML = `
        <strong>MITS Auto Login</strong><br>
        Please set your credentials in the extension popup.
        <div style="margin-top: 8px; font-size: 12px;">
            Click the extension icon in the toolbar.
        </div>
    `;
    document.body.appendChild(notification);
    
    // Remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 10000);
}

function showLoginErrorNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 300px;
    `;
    notification.innerHTML = `
        <strong>Login Failed</strong><br>
        Please check your credentials in the extension popup.
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 8000);
}

/* =====================================================================
   AI Quiz Solver — auto-detects /mod/quiz/attempt.php pages, lets user
   trigger a Gemini-powered solver that answers each question and
   advances to the next page, stopping at /mod/quiz/summary.php.
   ===================================================================== */

const QUIZ_SOLVER_FLAG = 'mitsQuizSolverActive';

function isExtensionAlive() {
    try {
        return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
        return false;
    }
}

if (location.pathname.includes('/mod/quiz/attempt.php')) {
    setTimeout(initQuizSolver, 600);
} else if (location.pathname.includes('/mod/quiz/summary.php')) {
    setTimeout(showSummaryStopNotification, 400);
}

function initQuizSolver() {
    injectSolverButton();
    if (sessionStorage.getItem(QUIZ_SOLVER_FLAG) === '1') {
        console.log('[QuizSolver] auto-resume on new page');
        setTimeout(solveCurrentPage, 800);
    }
}

function injectSolverButton() {
    if (document.getElementById('mitsQuizSolverBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'mitsQuizSolverBtn';
    btn.type = 'button';
    btn.innerHTML = '🤖 Solve Quiz with AI';
    btn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 14px 22px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        font-family: 'Segoe UI', system-ui, sans-serif;
        letter-spacing: 0.3px;
    `;
    btn.onmouseenter = () => { btn.style.transform = 'translateY(-2px)'; };
    btn.onmouseleave = () => { btn.style.transform = 'translateY(0)'; };
    btn.onclick = () => {
        if (!isExtensionAlive()) {
            showQuizNotification('Extension was reloaded. Please refresh this page (F5) and try again.', 'error');
            return;
        }
        try {
            chrome.storage.sync.get(['geminiApiKey'], (data) => {
                if (chrome.runtime.lastError) {
                    showQuizNotification('Extension was reloaded. Please refresh this page (F5).', 'error');
                    return;
                }
                if (!data.geminiApiKey) {
                    showQuizNotification('Set your Gemini API key in the extension popup first.', 'error');
                    return;
                }
                sessionStorage.setItem(QUIZ_SOLVER_FLAG, '1');
                btn.disabled = true;
                btn.innerHTML = '⏳ Solving…';
                btn.style.opacity = '0.7';
                btn.style.cursor = 'not-allowed';
                solveCurrentPage();
            });
        } catch (e) {
            showQuizNotification('Extension was reloaded. Please refresh this page (F5).', 'error');
        }
    };
    document.body.appendChild(btn);
}

function setSolverButtonStatus(text) {
    const btn = document.getElementById('mitsQuizSolverBtn');
    if (btn) btn.innerHTML = text;
}

function parseQuestionsOnPage() {
    const queNodes = document.querySelectorAll('.que');
    const questions = [];
    queNodes.forEach((qNode) => {
        const qtext = qNode.querySelector('.qtext');
        if (!qtext) return;
        const answerArea = qNode.querySelector('.answer');
        if (!answerArea) return;
        const inputs = answerArea.querySelectorAll('input[type=radio], input[type=checkbox]');
        if (inputs.length === 0) return;
        const type = inputs[0].type === 'checkbox' ? 'multi' : 'single';

        const options = [];
        const rows = answerArea.querySelectorAll(':scope > div');
        let idx = 0;
        rows.forEach((row) => {
            const input = row.querySelector('input[type=radio], input[type=checkbox]');
            const label = row.querySelector('label');
            if (!input || !label) return;
            const letter = String.fromCharCode(97 + idx);
            const rawText = (label.innerText || '').trim();
            const cleanText = rawText.replace(/^[a-z]\.\s*/i, '').trim();
            options.push({ letter, text: cleanText, inputId: input.id });
            idx++;
        });

        if (options.length === 0) return;
        questions.push({
            id: qNode.id || ('q-' + questions.length),
            text: (qtext.innerText || '').trim(),
            type,
            options,
        });
    });
    return questions;
}

function solveCurrentPage() {
    const questions = parseQuestionsOnPage();
    if (questions.length === 0) {
        console.log('[QuizSolver] no questions found on this page');
        setSolverButtonStatus('➡️ No questions, going to next…');
        setTimeout(advanceAfterPage, 600);
        return;
    }
    console.log('[QuizSolver] page has', questions.length, 'question(s)');
    solveOneQuestion(questions, 0);
}

function solveOneQuestion(questions, idx) {
    if (idx >= questions.length) {
        setSolverButtonStatus('➡️ Page done — clicking Next…');
        setTimeout(advanceAfterPage, 700);
        return;
    }
    const q = questions[idx];
    const label = 'Q' + (idx + 1) + (questions.length > 1 ? '/' + questions.length : '');

    console.log('[QuizSolver] step 1/3 — reading', label, ':', q.text.slice(0, 80));
    setSolverButtonStatus('📖 Reading ' + label + '…');

    setTimeout(() => {
        if (!isExtensionAlive()) {
            handleSolverError('Extension was reloaded. Please refresh this page (F5).');
            return;
        }
        console.log('[QuizSolver] step 2/3 — asking Gemini for', label);
        setSolverButtonStatus('🧠 Asking AI for ' + label + '…');
        try {
            chrome.runtime.sendMessage({ action: 'solveQuestion', q }, (resp) => {
                if (chrome.runtime.lastError) {
                    handleSolverError('Extension error: ' + chrome.runtime.lastError.message);
                    return;
                }
                if (!resp || resp.error) {
                    const msg = resp && resp.error ? resp.error : 'unknown error';
                    console.warn('[QuizSolver]', label, 'AI error:', msg);
                    handleSolverError('Gemini API error: ' + msg);
                    return;
                }
                const correct = resp.correct || [];
                if (correct.length === 0) {
                    console.warn('[QuizSolver]', label, 'no answer returned, skipping');
                    setSolverButtonStatus('⚠️ ' + label + ' skipped');
                    setTimeout(() => solveOneQuestion(questions, idx + 1), 600);
                    return;
                }
                console.log('[QuizSolver] step 3/3 — clicking', correct.join(','), 'for', label);
                setSolverButtonStatus('✅ ' + label + ' → ' + correct.join(',').toUpperCase());
                clickAnswers(q, correct, () => {
                    setTimeout(() => solveOneQuestion(questions, idx + 1), 700);
                });
            });
        } catch (e) {
            handleSolverError('Extension was reloaded. Please refresh this page (F5).');
        }
    }, 400);
}

function clickAnswers(q, letters, done) {
    let i = 0;
    function clickNext() {
        if (i >= letters.length) {
            if (done) done();
            return;
        }
        const letter = letters[i++];
        const opt = q.options.find((o) => o.letter === letter);
        if (opt) {
            const input = document.getElementById(opt.inputId);
            if (input) {
                input.click();
                console.log('[QuizSolver]   ✓ clicked option', letter, 'for', q.id);
            } else {
                console.warn('[QuizSolver]   input not found for', opt.inputId);
            }
        } else {
            console.warn('[QuizSolver]   invalid letter', letter, 'for', q.id);
        }
        setTimeout(clickNext, 250);
    }
    clickNext();
}

function advanceAfterPage() {
    const nextBtn = document.querySelector('input[name="next"]');
    if (nextBtn) {
        console.log('[QuizSolver] clicking Next page button');
        setSolverButtonStatus('➡️ Next page…');
        nextBtn.click();
        return;
    }
    const finishLink = document.querySelector('a[href*="/mod/quiz/summary.php"]');
    if (finishLink) {
        console.log('[QuizSolver] clicking Finish attempt link');
        setSolverButtonStatus('🏁 Going to summary…');
        finishLink.click();
        return;
    }
    console.warn('[QuizSolver] no Next or Finish link found');
    sessionStorage.removeItem(QUIZ_SOLVER_FLAG);
    showQuizNotification('Could not find a Next page button. Solver stopped.', 'error');
}

function handleSolverError(msg) {
    sessionStorage.removeItem(QUIZ_SOLVER_FLAG);
    setSolverButtonStatus('🤖 Solve Quiz with AI');
    const btn = document.getElementById('mitsQuizSolverBtn');
    if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
    showQuizNotification(msg, 'error');
}

function showSummaryStopNotification() {
    sessionStorage.removeItem(QUIZ_SOLVER_FLAG);
    showQuizNotification('All questions answered. Review and click "Submit all and finish" yourself.', 'success');
}

function showQuizNotification(text, kind) {
    const colors = {
        success: { bg: '#10b981', border: '#059669' },
        error:   { bg: '#ef4444', border: '#b91c1c' },
        info:    { bg: '#3b82f6', border: '#1d4ed8' },
    };
    const c = colors[kind] || colors.info;
    const n = document.createElement('div');
    n.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${c.bg};
        color: white;
        padding: 14px 18px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        z-index: 999999;
        max-width: 340px;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        border-left: 4px solid ${c.border};
    `;
    n.innerHTML = '<strong>AI Quiz Solver</strong><br>' + text;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 9000);
}