chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get("ytBookmarks", (data) => {
      if (!data.ytBookmarks) {
        chrome.storage.sync.set({ ytBookmarks: [] });
      }
    });
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addBookmark") {
      chrome.storage.sync.get("ytBookmarks", (data) => {
        const bookmarks = data.ytBookmarks || [];
        bookmarks.push(message.bookmark);
        chrome.storage.sync.set({ ytBookmarks: bookmarks }, () => {
          if (chrome.runtime.lastError) {
            console.error("Storage error:", chrome.runtime.lastError.message);
          } else {
            sendResponse({ status: "Bookmark added" });
          }
        });
      });
      return true;
    }
  });
  
