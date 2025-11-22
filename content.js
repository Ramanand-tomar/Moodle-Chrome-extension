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