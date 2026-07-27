/**
 * GetRidOfThem - Background Service Worker
 * Handles context menu integration to allow quick additions to the filter list.
 */

// Create the context menu when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "grot-add-to-filter",
    title: "افزودن به فیلتر GetRidOfThem",
    contexts: ["selection"]
  });
});

// Handle clicks on the context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "grot-add-to-filter" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    if (!selectedText) return;

    try {
      // Fetch current target emojis/keywords
      const result = await chrome.storage.local.get("targetEmojis");
      const currentList = result.targetEmojis || ['🎒'];
      
      // Prevent duplicates
      if (!currentList.includes(selectedText)) {
        currentList.push(selectedText);
        
        // Save back to storage
        await chrome.storage.local.set({ targetEmojis: currentList });
        
        // Optional: Could send a message to content script here if needed, 
        // but content script already listens to chrome.storage.onChanged!
      }
    } catch (error) {
      console.error("GetRidOfThem Context Menu Error:", error);
    }
  }
});
