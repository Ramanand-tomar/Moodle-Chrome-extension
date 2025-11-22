# MITS Moodle Auto Login Chrome Extension

## Overview
MITS Moodle Auto Login is a Chrome extension designed to automate the login process for the Moodle portal of MITS Gwalior. With this extension, students can save their credentials securely and enjoy seamless, one-click access to their Moodle dashboard without repeatedly entering their username and password.

## Features
- **Automatic Login:** Fills in your credentials and logs you in automatically when you visit the Moodle site.
- **Credential Storage:** Securely saves your username and password in Chrome's sync storage.
- **Quick Setup:** Simple popup interface to save, update, or remove your credentials.
- **One-Click Access:** Directly opens the login page and logs you in, saving time every day.
- **Privacy:** Credentials are stored only in your browser and are never sent to any third-party server.

## Benefits for Students
- **Saves Time:** No need to type your username and password every time you access Moodle.
- **Reduces Hassle:** Avoids the frustration of forgotten passwords or repeated logins.
- **Focus on Learning:** Lets you get to your courses and assignments faster.
- **Easy to Use:** Simple interface for setup and management.

## How It Works
1. **Install the Extension:** Load the extension in Chrome (see below).
2. **Save Your Credentials:** Open the extension popup, enter your Moodle username and password, and save.
3. **Automatic Login:** When you visit [MITS Moodle](https://moodle.mitsgwalior.in/), the extension will automatically navigate to the login page, fill in your credentials, and log you in.
4. **Logout or Update:** You can update or remove your credentials anytime from the popup.

## Installation (Developer Mode)
1. Download or clone this repository to your computer.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the extension folder.
5. The extension icon will appear in your Chrome toolbar.

## Usage
- Click the extension icon to open the popup.
- Enter your Moodle username and password, then click **Save & Continue**.
- Visit [https://moodle.mitsgwalior.in/](https://moodle.mitsgwalior.in/). The extension will handle the login process automatically.
- To logout or change credentials, open the popup and click **Logout**.

## Security & Privacy
- Your credentials are stored using Chrome's `storage.sync` API, which keeps them private and only accessible to your browser.
- The extension does not transmit your credentials to any external server.

## Support
For issues or suggestions, please contact the developer or open an issue in the repository.

---
**Disclaimer:** This extension is intended for educational use by MITS Gwalior students. Use at your own risk. The developer is not responsible for any misuse or changes in the Moodle login process that may affect the extension's functionality.
