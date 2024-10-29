document.addEventListener("DOMContentLoaded", async () => {
  const saveButton = document.getElementById("save-bookmark");
  const bookmarksList = document.getElementById("bookmarks");
  const myLink = document.getElementById('myLink');
  loadBookmarks();

  myLink.addEventListener('click', function (event) {
    event.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/Hritik-Singh067' });
  });
  

  saveButton.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.includes("youtube.com/watch")) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            function: getCurrentTimeAndBookmark
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.error("Script execution error:", chrome.runtime.lastError.message);
              alert("Error saving bookmark. Check console for details.");
              return;
            }

            const bookmark = results[0]?.result;
            if (bookmark) {
              chrome.runtime.sendMessage({ action: "addBookmark", bookmark }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error("Message sending error:", chrome.runtime.lastError.message);
                } else if (response && response.status === "Bookmark added") {
                  loadBookmarks();
                }
              });
            }
          }
        );
      } else {
        alert("Not a YouTube video!");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  });

  function loadBookmarks() {
    chrome.storage.sync.get("ytBookmarks", (data) => {
      bookmarksList.innerHTML = "";
      const bookmarks = data.ytBookmarks || [];

      bookmarks.forEach((bookmark, index) => {
        const li = document.createElement("li");

        if (bookmark.thumbnail) {
          const img = document.createElement("img");
          img.src = bookmark.thumbnail;
          img.alt = bookmark.title;
          img.classList.add("bookmark-img");
          li.appendChild(img);
        }

        const titleText = document.createElement("span");
        titleText.textContent = `${bookmark.title} - ${bookmark.time}`;
        titleText.classList.add("bookmark-title")
        li.appendChild(titleText);
        li.addEventListener("click", () => {
          chrome.tabs.create({ url: `${bookmark.url}&t=${bookmark.seconds}s` });
        });

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "<i class='fa-regular fa-trash-can'></i> Delete";
        deleteButton.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteBookmark(index);
        });

        li.appendChild(deleteButton);
        li.classList.add("bookmark-item");
        bookmarksList.appendChild(li);
      });
    });
  }


  function deleteBookmark(index) {
    chrome.storage.sync.get("ytBookmarks", (data) => {
      const bookmarks = data.ytBookmarks || [];
      bookmarks.splice(index, 1);
      chrome.storage.sync.set({ ytBookmarks: bookmarks }, loadBookmarks);
    });
  }
});


function getCurrentTimeAndBookmark() {
  const videoTitle = document.title.replace(/^\(\d+\)\s*/, ""); 
  const videoUrl = window.location.href;

  const videoID = new URLSearchParams(new URL(videoUrl).search).get("v");
  const thumbnailUrl = videoID ? `https://img.youtube.com/vi/${videoID}/hqdefault.jpg` : "";

  const video = document.querySelector("video");
  const currentTime = video ? Math.floor(video.currentTime) : 0;
  
  function formatTime(seconds) {
    const day = Math.floor(seconds / (3600 * 24));
    const hour = Math.floor(seconds / 3600) % 24;
    const min = Math.floor(seconds / 60) % 60;
    const sec = seconds % 60;
    return `${day}:${hour}:${min}:${sec < 10 ? "0" : ""}${sec}`;
  }

  return {
    title: videoTitle,
    url: videoUrl,
    time: formatTime(currentTime),
    seconds: currentTime,
    thumbnail: thumbnailUrl
  };
}