/**
 * GetRidOfThem - Twitter/X Mental Health Shield Content Script
 * Scans Twitter feed for specific targeted emojis/keywords (e.g., 🎒) in user display names or handles
 * and overlays a glassmorphic mental health protection shield.
 */

// Default extension settings configuration
const DEFAULT_SETTINGS = {
  enabled: true,
  targetEmojis: ['🎒'],
  language: 'fa',
  customText: 'برای سلامت روان نبین',
  allowReveal: true,
  totalShieldedCount: 0,
  persianFont: 'Vazirmatn',
  englishFont: 'Inter'
};

// Preset warning message translations - Clean & Minimal
const MESSAGES = {
  fa: 'برای سلامت روان نبین',
  en: 'Hidden for Mental Health',
  ar: 'محجوب لصحتك النفسية',
  es: 'Oculto por tu salud mental'
};

// Preset reveal button translations
const REVEAL_TEXT = {
  fa: 'نمایش 👁️',
  en: 'Show 👁️',
  ar: 'عرض 👁️',
  es: 'Ver 👁️'
};

const REHIDE_TEXT = {
  fa: 'مخفی‌سازی 🛡️',
  en: 'Re-shield 🛡️',
  ar: 'إعادة الحجب 🛡️',
  es: 'Ocultar 🛡️'
};

let currentSettings = { ...DEFAULT_SETTINGS };
let processedTweets = new WeakSet();

/**
 * Safely checks if Chrome/Extension context is valid (prevents "Extension context invalidated" error on reload)
 */
function isExtensionContextValid() {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

/**
 * Loads extension configuration settings from chrome.storage.local safely
 */
async function loadSettings() {
  if (!isExtensionContextValid()) return;
  try {
    const data = await chrome.storage.local.get(DEFAULT_SETTINGS);
    currentSettings = { ...DEFAULT_SETTINGS, ...data };
  } catch (error) {
    // Ignore invalid context errors gracefully during dev reload
  }
}

/**
 * Resolves the warning text based on current language settings
 */
function getWarningText() {
  if (currentSettings.language === 'custom' && currentSettings.customText) {
    return currentSettings.customText;
  }
  return MESSAGES[currentSettings.language] || MESSAGES.fa;
}

/**
 * Resolves the reveal button text based on current language settings
 */
function getRevealBtnText() {
  return REVEAL_TEXT[currentSettings.language] || REVEAL_TEXT.fa;
}

/**
 * Resolves the re-hide button text based on current language settings
 */
function getRehideBtnText() {
  return REHIDE_TEXT[currentSettings.language] || REHIDE_TEXT.fa;
}

/**
 * Applies configured font family to overlay element
 */
function applyFontFamily(overlayEl) {
  const faFont = currentSettings.persianFont || 'Vazirmatn';
  const enFont = currentSettings.englishFont || 'Inter';
  overlayEl.style.fontFamily = `"${faFont}", "${enFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
}

/**
 * Extracts all readable text, image alt attributes, titles, and image src URLs
 * from Twitter's User-Name element (since Twitter renders emojis as <img> tags!)
 */
function getUserInfoText(userInfoEl) {
  let combinedText = userInfoEl.textContent || '';

  // Extract alt, title, aria-label, and src from embedded emoji <img> tags
  const images = userInfoEl.querySelectorAll('img');
  images.forEach((img) => {
    const alt = img.getAttribute('alt') || '';
    const title = img.getAttribute('title') || '';
    const ariaLabel = img.getAttribute('aria-label') || '';
    const src = img.getAttribute('src') || '';
    combinedText += ` ${alt} ${title} ${ariaLabel} ${src}`;
  });

  return combinedText;
}

/**
 * Checks whether a user display name or handle contains any of the target emojis/keywords
 */
function containsTargetEmoji(text) {
  if (!text || !currentSettings.targetEmojis || currentSettings.targetEmojis.length === 0) {
    return false;
  }

  return currentSettings.targetEmojis.some((emoji) => {
    const cleanedEmoji = emoji.trim();
    if (!cleanedEmoji) return false;

    // 1. Direct text match
    if (text.includes(cleanedEmoji)) return true;

    // 2. Match without variation selectors (e.g., \uFE0F)
    const normalizedText = text.replace(/[\uFE00-\uFE0F]/g, '');
    const normalizedEmoji = cleanedEmoji.replace(/[\uFE00-\uFE0F]/g, '');
    if (normalizedText.includes(normalizedEmoji)) return true;

    // 3. Match emoji hex codepoints in Twitter <img> src URLs (e.g. 1f392.svg)
    try {
      const codePoints = Array.from(cleanedEmoji).map((char) => char.codePointAt(0).toString(16));
      const hexPattern = codePoints.join('-').toLowerCase();
      const hexPatternUnderscore = codePoints.join('_').toLowerCase();

      if (hexPattern && text.toLowerCase().includes(hexPattern)) return true;
      if (hexPatternUnderscore && text.toLowerCase().includes(hexPatternUnderscore)) return true;

      // Check codepoint individually for multi-character emojis
      for (const cp of codePoints) {
        if (cp.length >= 4 && text.toLowerCase().includes(cp)) return true;
      }
    } catch (e) {
      // Ignore conversion errors
    }

    return false;
  });
}

/**
 * Increments the total count of shielded tweets in chrome.storage.local safely
 */
async function incrementShieldedCount() {
  if (!isExtensionContextValid()) return;
  try {
    currentSettings.totalShieldedCount = (currentSettings.totalShieldedCount || 0) + 1;
    await chrome.storage.local.set({ totalShieldedCount: currentSettings.totalShieldedCount });
  } catch (err) {
    // Ignore invalid context errors gracefully during reload
  }
}

/**
 * Unblurs a target element DOM container when user clicks reveal
 */
function revealTargetElement(targetEl, overlay, rehideBtn) {
  if (!targetEl) return;
  targetEl.dataset.grotUserRevealed = 'true';
  targetEl.classList.add('grot-is-revealed');

  if (overlay) {
    overlay.style.setProperty('display', 'none', 'important');
    overlay.classList.add('grot-revealed');
  }

  // Clear blur filter and restore full interactivity on all descendant elements
  const children = targetEl.querySelectorAll('div, span, p, img, a, article');
  children.forEach((child) => {
    if (!child.classList.contains('grot-overlay-shield') && !child.classList.contains('grot-rehide-btn') && !child.closest('.grot-overlay-shield')) {
      child.style.setProperty('filter', 'none', 'important');
      child.style.setProperty('opacity', '1', 'important');
      child.style.setProperty('pointer-events', 'auto', 'important');
      child.style.setProperty('user-select', 'auto', 'important');
    }
  });

  if (rehideBtn) {
    rehideBtn.style.setProperty('display', 'block', 'important');
  }
}

/**
 * Re-shields a target element DOM container when user clicks re-hide
 */
function rehideTargetElement(targetEl, overlay, rehideBtn) {
  if (!targetEl) return;
  delete targetEl.dataset.grotUserRevealed;
  targetEl.classList.remove('grot-is-revealed');

  if (overlay) {
    overlay.style.setProperty('display', 'flex', 'important');
    overlay.classList.remove('grot-revealed');
  }

  // Restore blur filter on child elements
  const children = targetEl.querySelectorAll('div, span, p, img, a, article');
  children.forEach((child) => {
    if (!child.classList.contains('grot-overlay-shield') && !child.classList.contains('grot-rehide-btn') && !child.closest('.grot-overlay-shield')) {
      child.style.removeProperty('filter');
      child.style.removeProperty('opacity');
      child.style.removeProperty('pointer-events');
      child.style.removeProperty('user-select');
    }
  });

  if (rehideBtn) {
    rehideBtn.style.setProperty('display', 'none', 'important');
  }
}

/**
 * Global capture event listener on window.
 * Intercepts ALL mouse, pointer, and touch events at Step 1 (window capture level)
 * BEFORE Twitter's React router can ever receive them.
 */
function setupGlobalWindowInterceptor() {
  const targetEventTypes = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'];

  targetEventTypes.forEach((eventType) => {
    window.addEventListener(
      eventType,
      (e) => {
        if (!e || !e.target) return;

        // Check if event originated inside an overlay shield or reveal button
        const overlayShield = e.target.closest ? e.target.closest('.grot-overlay-shield') : null;
        const rehideBtn = e.target.closest ? e.target.closest('.grot-rehide-btn') : null;

        if (overlayShield) {
          // Kill event at Step 1 window capture level so Twitter React router receives ZERO notifications!
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const targetEl = overlayShield.closest('.grot-shielded-tweet') || overlayShield.parentElement;
          if (targetEl && currentSettings.allowReveal) {
            const rehideBtnEl = targetEl.querySelector('.grot-rehide-btn');
            revealTargetElement(targetEl, overlayShield, rehideBtnEl);
          }

          return false;
        }

        if (rehideBtn) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const targetEl = rehideBtn.closest('.grot-shielded-tweet') || rehideBtn.parentElement;
          if (targetEl) {
            const overlayEl = targetEl.querySelector('.grot-overlay-shield');
            rehideTargetElement(targetEl, overlayEl, rehideBtn);
          }

          return false;
        }
      },
      { capture: true, passive: false }
    );
  });
}

/**
 * Applies the mental health shield overlay onto a target DOM element (main tweet or inner quote tweet box)
 */
function shieldElement(targetEl) {
  if (!targetEl) return;

  // If user explicitly revealed this element, keep it revealed!
  if (targetEl.dataset.grotUserRevealed === 'true') {
    return;
  }

  // Clean up any stale or existing overlays first on this container to prevent duplicates
  const existingOverlays = targetEl.querySelectorAll(':scope > .grot-overlay-shield');
  if (existingOverlays.length > 0) {
    existingOverlays.forEach((el) => el.remove());
  }

  targetEl.classList.add('grot-shielded-tweet');

  // Create overlay shield container
  const overlay = document.createElement('div');
  overlay.className = 'grot-overlay-shield';
  applyFontFamily(overlay);

  // Create clean minimalist floating glass card
  const card = document.createElement('div');
  card.className = 'grot-shield-card';

  // Warning text element
  const messageEl = document.createElement('span');
  messageEl.className = 'grot-shield-message';
  messageEl.textContent = getWarningText();

  card.appendChild(messageEl);

  // Re-hide button (floating on top right when revealed)
  let rehideBtn = targetEl.querySelector(':scope > .grot-rehide-btn');
  if (!rehideBtn) {
    rehideBtn = document.createElement('button');
    rehideBtn.type = 'button';
    rehideBtn.className = 'grot-rehide-btn';
    rehideBtn.textContent = getRehideBtnText();
    rehideBtn.style.display = 'none';
    targetEl.appendChild(rehideBtn);
  }

  // Reveal button inside floating glass card if allowed
  if (currentSettings.allowReveal) {
    const revealBtn = document.createElement('button');
    revealBtn.type = 'button';
    revealBtn.className = 'grot-reveal-btn';
    revealBtn.textContent = getRevealBtnText();
    card.appendChild(revealBtn);
  }

  overlay.appendChild(card);
  targetEl.appendChild(overlay);

  // Record stats
  if (!processedTweets.has(targetEl)) {
    processedTweets.add(targetEl);
    incrementShieldedCount();
  }
}

/**
 * Removes shield overlay from a target element
 */
function unshieldElement(targetEl) {
  if (!targetEl) return;
  delete targetEl.dataset.grotUserRevealed;

  const overlays = targetEl.querySelectorAll(':scope > .grot-overlay-shield');
  overlays.forEach((overlay) => overlay.remove());

  const rehideBtns = targetEl.querySelectorAll(':scope > .grot-rehide-btn');
  rehideBtns.forEach((btn) => btn.remove());

  targetEl.classList.remove('grot-shielded-tweet');
  targetEl.classList.remove('grot-is-revealed');

  const children = targetEl.querySelectorAll('div, span, p, img, a, article');
  children.forEach((child) => {
    child.style.removeProperty('filter');
    child.style.removeProperty('opacity');
    child.style.removeProperty('pointer-events');
    child.style.removeProperty('user-select');
  });
}

/**
 * Inspects individual tweet DOM elements for matching criteria.
 * - If the primary author has the target emoji -> Shields the outer tweet.
 * - If a healthy person quotes a target user -> Keeps outer tweet clean & shields ONLY the inner quoted box!
 */
function processTweet(tweetElement) {
  if (!currentSettings.enabled) {
    unshieldElement(tweetElement);
    return;
  }

  const userInfoElements = tweetElement.querySelectorAll('[data-testid="User-Name"]');
  if (!userInfoElements || userInfoElements.length === 0) return;

  // 1. Check Primary Author of the tweet
  const mainAuthorEl = userInfoElements[0];
  const mainAuthorText = getUserInfoText(mainAuthorEl);

  if (containsTargetEmoji(mainAuthorText)) {
    // Primary author has target emoji -> Shield the entire outer tweet
    shieldElement(tweetElement);
    return;
  } else {
    // Primary author is healthy -> Ensure outer tweet itself is NOT shielded
    unshieldElement(tweetElement);
  }

  // 2. Check Quoted Tweets / Mentions inside this tweet (if any)
  const quotedAuthorEls = Array.from(userInfoElements).slice(1);
  quotedAuthorEls.forEach((quotedAuthorEl) => {
    const quotedText = getUserInfoText(quotedAuthorEl);

    // Find the inner quote tweet container block in Twitter DOM
    const quoteContainer = quotedAuthorEl.closest('div[role="link"]') ||
                           quotedAuthorEl.closest('div[tabindex="0"]') ||
                           quotedAuthorEl.closest('div[aria-labelledby]');

    if (quoteContainer && quoteContainer !== tweetElement) {
      if (containsTargetEmoji(quotedText)) {
        shieldElement(quoteContainer);
      } else {
        unshieldElement(quoteContainer);
      }
    }
  });
}

/**
 * Scans all visible tweet elements on the page in batched animation frames
 */
function scanPageTweets() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  if (tweets.length === 0) return;

  // Process DOM elements in batches using requestAnimationFrame for zero thread lag
  const BATCH_SIZE = 15;
  const tweetArray = Array.from(tweets);

  for (let i = 0; i < tweetArray.length; i += BATCH_SIZE) {
    const batch = tweetArray.slice(i, i + BATCH_SIZE);
    requestAnimationFrame(() => {
      batch.forEach((tweet) => processTweet(tweet));
    });
  }
}

/**
 * Updates text and visibility of existing overlays when storage settings change live
 */
function refreshExistingShields() {
  const shieldedElements = document.querySelectorAll('.grot-shielded-tweet');
  shieldedElements.forEach((el) => {
    if (!currentSettings.enabled) {
      unshieldElement(el);
    } else {
      const existingOverlays = el.querySelectorAll(':scope > .grot-overlay-shield');
      if (existingOverlays.length > 0) {
        existingOverlays.forEach((overlay) => {
          applyFontFamily(overlay);
          const messageEl = overlay.querySelector('.grot-shield-message');
          if (messageEl) {
            messageEl.textContent = getWarningText();
          }
          const revealBtn = overlay.querySelector('.grot-reveal-btn');
          if (revealBtn) {
            revealBtn.textContent = getRevealBtnText();
            revealBtn.style.display = currentSettings.allowReveal ? 'inline-flex' : 'none';
          }
        });
      }
    }
  });
  scanPageTweets();
}

/**
 * Initializes MutationObserver to detect new tweets as user scrolls Twitter/X feed
 */
function observeFeed() {
  const observer = new MutationObserver(() => {
    scanPageTweets();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Main initialization routine
 */
async function init() {
  await loadSettings();
  setupGlobalWindowInterceptor();
  scanPageTweets();
  observeFeed();

  // Listen for storage changes from the popup UI in real-time
  if (isExtensionContextValid()) {
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (!isExtensionContextValid()) return;
        if (areaName === 'local') {
          for (const [key, { newValue }] of Object.entries(changes)) {
            currentSettings[key] = newValue;
          }
          refreshExistingShields();
        }
      });
    } catch (e) {
      // Ignore storage listener registration errors if context invalidated
    }
  }
}

// Start content script execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
