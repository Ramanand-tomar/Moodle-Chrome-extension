// Helper to show/hide screens
function showScreen(firstTime) {
  document.getElementById('firstTimeForm').classList.toggle('hidden', !firstTime);
  document.getElementById('mainScreen').classList.toggle('hidden', firstTime);
}

// On load, check if user is first time
document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get(['username', 'password'], (data) => {
    if (data.username && data.password) {
      // User already saved, show main screen
      showScreen(false);
      document.getElementById('loginStatus').textContent = `Logged in as ${data.username}`;
    } else {
      // First time user, show setup form
      showScreen(true);
    }
  });

  // Save button handler
  document.getElementById('save').onclick = function () {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }
    
    // Show saving state
    const saveBtn = document.getElementById('save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    chrome.storage.sync.set({ username, password }, () => {
      // Show main screen after saving
      showScreen(false);
      document.getElementById('loginStatus').textContent = `Credentials saved for ${username}`;
      
      // Reset button
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      
      // Optional: Inform user to refresh the Moodle page
      setTimeout(() => {
        alert('Credentials saved! Please refresh the Moodle login page for auto-login to work.');
      }, 300);
    });
  };

  // Logout button handler
  document.getElementById('logout').onclick = function () {
    if (confirm('Are you sure you want to remove your saved credentials?')) {
      chrome.storage.sync.remove(['username', 'password'], () => {
        showScreen(true);
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
      });
    }
  };
});