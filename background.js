chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    // Open the popup programmatically (this will show the extension popup)
    chrome.action.openPopup();
    sendResponse({status: "popup opened"});
  }
});