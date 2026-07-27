/**
 * GetRidOfThem - Extension Popup UI Controller
 * Manages storage state, settings synchronization, emoji tag management,
 * font selection, and popup language toggle (Persian/English).
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  targetEmojis: ['🎒'],
  language: 'fa',
  customText: 'برای سلامت روان نبین',
  allowReveal: true,
  totalShieldedCount: 0,
  uiLanguage: 'fa',
  persianFont: 'Vazirmatn',
  englishFont: 'Inter'
};

// UI Translations dictionary for Popup Interface
const UI_TRANSLATIONS = {
  fa: {
    title: 'GetRidOfThem',
    subtitle: 'محافظ سلامت روان توییتر',
    masterLabel: 'وضعیت فیلتر:',
    activeBadge: 'فعال 🛡️',
    inactiveBadge: 'غیرفعال ❌',
    overlayLangTitle: 'زبان متن هشدار روی توییت:',
    customTextLabel: 'متن هشدار سفارشی خود را بنویسید:',
    fontTitle: 'تنظیمات فونت اکستنشن (Font Settings):',
    persianFontLabel: 'فونت فارسی:',
    englishFontLabel: 'فونت انگلیسی:',
    targetTitle: 'ایموجی‌ها و کلمات کلیدی بلاک‌شده:',
    inputPlaceholder: 'افزودن ایموجی یا آیدی...',
    addBtnText: 'افزودن',
    allowRevealLabel: 'اجازه کلیک برای مشاهده توییت:',
    statsText: 'توییت تا کنون بلور و مخفی شده است',
    footerText: 'ساخته شده برای آرامش روان شما 💙',
    langSwitchLabel: 'EN',
    exportBtnText: '📤 خروجی (Export)',
    importBtnText: '📥 ورود (Import)',
    dir: 'rtl'
  },
  en: {
    title: 'GetRidOfThem',
    subtitle: 'Twitter Mental Health Shield',
    masterLabel: 'Filter Status:',
    activeBadge: 'Active 🛡️',
    inactiveBadge: 'Disabled ❌',
    overlayLangTitle: 'Overlay Warning Message Language:',
    customTextLabel: 'Write your custom warning message:',
    fontTitle: 'Extension Font Settings:',
    persianFontLabel: 'Persian Font:',
    englishFontLabel: 'English Font:',
    targetTitle: 'Blocked Emojis & Keywords:',
    inputPlaceholder: 'Add emoji or handle...',
    addBtnText: 'Add',
    allowRevealLabel: 'Allow click to reveal tweet:',
    statsText: 'tweets shielded & hidden so far',
    footerText: 'Built for your mental peace & health 💙',
    langSwitchLabel: 'FA',
    exportBtnText: '📤 Export List',
    importBtnText: '📥 Import List',
    dir: 'ltr'
  }
};

let currentSettings = { ...DEFAULT_SETTINGS };

// DOM Elements
const masterToggle = document.getElementById('master-toggle');
const statusBadge = document.getElementById('status-badge');
const overlayLangSelect = document.getElementById('overlay-lang-select');
const customTextContainer = document.getElementById('custom-text-container');
const customTextInput = document.getElementById('custom-text-input');
const persianFontSelect = document.getElementById('persian-font-select');
const englishFontSelect = document.getElementById('english-font-select');
const newEmojiInput = document.getElementById('new-emoji-input');
const addEmojiBtn = document.getElementById('add-emoji-btn');
const emojiTagsContainer = document.getElementById('emoji-tags-container');
const allowRevealToggle = document.getElementById('allow-reveal-toggle');
const statsCountEl = document.getElementById('stats-count');
const toggleUiLangBtn = document.getElementById('toggle-ui-lang-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// UI Translatable DOM Elements
const uiTitle = document.getElementById('ui-title');
const uiSubtitle = document.getElementById('ui-subtitle');
const uiMasterLabel = document.getElementById('ui-master-label');
const uiOverlayLangTitle = document.getElementById('ui-overlay-lang-title');
const uiCustomTextLabel = document.getElementById('ui-custom-text-label');
const uiFontTitle = document.getElementById('ui-font-title');
const uiPersianFontLabel = document.getElementById('ui-persian-font-label');
const uiEnglishFontLabel = document.getElementById('ui-english-font-label');
const uiTargetTitle = document.getElementById('ui-target-title');
const uiAddBtn = document.getElementById('add-emoji-btn');
const uiAllowRevealLabel = document.getElementById('ui-allow-reveal-label');
const uiStatsText = document.getElementById('ui-stats-text');
const uiFooterText = document.getElementById('ui-footer-text');
const uiLangLabel = document.getElementById('ui-lang-label');

/**
 * Updates the Popup UI text elements based on selected UI language (fa/en)
 */
function applyUiTranslations() {
  const lang = currentSettings.uiLanguage || 'fa';
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.fa;

  document.documentElement.setAttribute('dir', t.dir);
  document.documentElement.setAttribute('lang', lang);

  uiTitle.textContent = t.title;
  uiSubtitle.textContent = t.subtitle;
  uiMasterLabel.textContent = t.masterLabel;
  uiOverlayLangTitle.textContent = t.overlayLangTitle;
  uiCustomTextLabel.textContent = t.customTextLabel;
  uiFontTitle.textContent = t.fontTitle;
  uiPersianFontLabel.textContent = t.persianFontLabel;
  uiEnglishFontLabel.textContent = t.englishFontLabel;
  uiTargetTitle.textContent = t.targetTitle;
  uiAddBtn.textContent = t.addBtnText;
  uiAllowRevealLabel.textContent = t.allowRevealLabel;
  uiStatsText.textContent = t.statsText;
  uiFooterText.textContent = t.footerText;
  uiLangLabel.textContent = t.langSwitchLabel;
  newEmojiInput.placeholder = t.inputPlaceholder;

  if (exportBtn) exportBtn.textContent = t.exportBtnText;
  if (importBtn) importBtn.textContent = t.importBtnText;

  updateStatusBadge(masterToggle.checked);
}

/**
 * Updates status badge text and color based on enabled toggle state
 */
function updateStatusBadge(isEnabled) {
  const lang = currentSettings.uiLanguage || 'fa';
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.fa;

  if (isEnabled) {
    statusBadge.textContent = t.activeBadge;
    statusBadge.className = 'badge badge-active';
  } else {
    statusBadge.textContent = t.inactiveBadge;
    statusBadge.className = 'badge badge-inactive';
  }
}

/**
 * Renders target emoji/keyword tag elements in the tags container
 */
function renderEmojiTags() {
  emojiTagsContainer.innerHTML = '';
  if (!currentSettings.targetEmojis || currentSettings.targetEmojis.length === 0) {
    const emptyMsg = document.createElement('span');
    emptyMsg.style.fontSize = '12px';
    emptyMsg.style.color = '#94a3b8';
    emptyMsg.textContent = currentSettings.uiLanguage === 'en' ? 'No items added' : 'هیچ موردی اضافه نشده است';
    emojiTagsContainer.appendChild(emptyMsg);
    return;
  }

  currentSettings.targetEmojis.forEach((emoji, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag-item';

    const text = document.createElement('span');
    text.textContent = emoji;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'tag-remove';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', () => removeTag(index));

    tag.appendChild(text);
    tag.appendChild(removeBtn);
    emojiTagsContainer.appendChild(tag);
  });
}

/**
 * Adds a new emoji or keyword tag to storage
 */
async function addTag() {
  const val = newEmojiInput.value.trim();
  if (!val) return;

  if (!currentSettings.targetEmojis.includes(val)) {
    currentSettings.targetEmojis.push(val);
    await saveSettings({ targetEmojis: currentSettings.targetEmojis });
    renderEmojiTags();
  }
  newEmojiInput.value = '';
}

/**
 * Removes a tag by index from storage
 */
async function removeTag(index) {
  currentSettings.targetEmojis.splice(index, 1);
  await saveSettings({ targetEmojis: currentSettings.targetEmojis });
  renderEmojiTags();
}

/**
 * Saves setting mutations to chrome.storage.local
 */
async function saveSettings(updatedFields) {
  try {
    currentSettings = { ...currentSettings, ...updatedFields };
    await chrome.storage.local.set(updatedFields);
  } catch (err) {
    console.error('GetRidOfThem: Failed to save settings to storage', err);
  }
}

/**
 * Loads extension configuration settings from storage into popup inputs
 */
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(DEFAULT_SETTINGS);
    currentSettings = { ...DEFAULT_SETTINGS, ...data };

    // Master enable toggle
    masterToggle.checked = currentSettings.enabled;

    // Overlay language select
    overlayLangSelect.value = currentSettings.language || 'fa';
    if (currentSettings.language === 'custom') {
      customTextContainer.style.display = 'flex';
    } else {
      customTextContainer.style.display = 'none';
    }
    customTextInput.value = currentSettings.customText || '';

    // Fonts select
    persianFontSelect.value = currentSettings.persianFont || 'Vazirmatn';
    englishFontSelect.value = currentSettings.englishFont || 'Inter';

    // Allow reveal toggle
    allowRevealToggle.checked = currentSettings.allowReveal;

    // Stats counter
    statsCountEl.textContent = (currentSettings.totalShieldedCount || 0).toLocaleString();

    // Apply UI translation
    applyUiTranslations();

    // Render emoji tags
    renderEmojiTags();
  } catch (err) {
    console.error('GetRidOfThem: Failed to load popup settings', err);
  }
}

// Event Listeners
masterToggle.addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  updateStatusBadge(enabled);
  await saveSettings({ enabled });
});

overlayLangSelect.addEventListener('change', async (e) => {
  const language = e.target.value;
  if (language === 'custom') {
    customTextContainer.style.display = 'flex';
  } else {
    customTextContainer.style.display = 'none';
  }
  await saveSettings({ language });
});

customTextInput.addEventListener('input', async (e) => {
  const customText = e.target.value;
  await saveSettings({ customText });
});

persianFontSelect.addEventListener('change', async (e) => {
  const persianFont = e.target.value;
  await saveSettings({ persianFont });
});

englishFontSelect.addEventListener('change', async (e) => {
  const englishFont = e.target.value;
  await saveSettings({ englishFont });
});

allowRevealToggle.addEventListener('change', async (e) => {
  const allowReveal = e.target.checked;
  await saveSettings({ allowReveal });
});

addEmojiBtn.addEventListener('click', addTag);
newEmojiInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTag();
});

toggleUiLangBtn.addEventListener('click', async () => {
  const newUiLang = currentSettings.uiLanguage === 'fa' ? 'en' : 'fa';
  await saveSettings({ uiLanguage: newUiLang });
  applyUiTranslations();
  renderEmojiTags();
});

// ==========================================
// Import / Export Logic
// ==========================================

if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(currentSettings.targetEmojis, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grot_filters.json';
    a.click();
    
    URL.revokeObjectURL(url);
  });
}

if (importBtn && importFile) {
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          // Merge with existing and remove duplicates
          const currentSet = new Set(currentSettings.targetEmojis);
          importedData.forEach(item => {
            if (typeof item === 'string' && item.trim() !== '') {
              currentSet.add(item.trim());
            }
          });
          
          currentSettings.targetEmojis = Array.from(currentSet);
          await saveSettings({ targetEmojis: currentSettings.targetEmojis });
          renderEmojiTags();
          
          // Reset file input
          importFile.value = '';
        } else {
          alert(currentSettings.uiLanguage === 'fa' ? 'فرمت فایل نامعتبر است.' : 'Invalid file format.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert(currentSettings.uiLanguage === 'fa' ? 'خطا در خواندن فایل.' : 'Error reading file.');
      }
    };
    reader.readAsText(file);
  });
}

// Initialize on Popup Load
document.addEventListener('DOMContentLoaded', loadSettings);
