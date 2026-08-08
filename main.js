const addNewMediaButton = document.getElementById("addNewMediaButton");
const mediaItemContainer = document.getElementById("mediaItemContainer");

/**
 * Format time in seconds to MM:SS string
 */
function formatDuration(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract duration from audio or video file
 */
function getMediaDuration(file, type) {
  return new Promise((resolve) => {
    const element = document.createElement(type === 'video' ? 'video' : 'audio');
    element.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    
    element.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(element.duration);
    };
    
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    element.src = objectUrl;
  });
}

/**
 * Universal File Picker: 100% cross-browser support and 
 * natively allows selecting completely mixed file types at once.
 */
function pickFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true; // Enables multiple file selection
    
    // Leaving `accept` blank allows absolutely ANY file ("etc").
    // If you want to restrict it, uncomment the line below:
    // input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
    
    input.onchange = (e) => {
      resolve(Array.from(e.target.files));
    };
    
    input.click();
  });
}

/**
 * Creates and returns the media card DOM element (detached)
 */
async function createMediaItemElement(file, dbRecord = null) {
  const fileType = file.type ? file.type.split('/')[0] : 'unknown';
  const objectUrl = URL.createObjectURL(file);
  
  let iconName = 'file';
  let durationText = '';
  let previewElementHtml = '';

  if (fileType === 'image') {
    iconName = 'image';
    previewElementHtml = `<img src="${objectUrl}" alt="${file.name}" class="w-full h-full object-cover rounded pointer-events-none" />`;
  } else if (fileType === 'video') {
    iconName = 'film';
    const duration = await getMediaDuration(file, 'video');
    durationText = formatDuration(duration);
    previewElementHtml = `<video src="${objectUrl}#t=0.5" class="w-full h-full object-cover rounded pointer-events-none" preload="media"></video>`;
  } else if (fileType === 'audio') {
    iconName = 'music';
    const duration = await getMediaDuration(file, 'audio');
    durationText = formatDuration(duration);
    previewElementHtml = `<div class="w-full h-full bg-[#242424] flex items-center justify-center p-2 rounded text-xs text-[#777] text-center overflow-hidden"><span class="truncate w-full">${file.name}</span></div>`;
  } else {
    // Fallback for "etc" (PDFs, Documents, Zips, unknown types)
    iconName = 'file-text';
    previewElementHtml = `<div class="w-full h-full bg-[#242424] flex items-center justify-center p-2 rounded text-xs text-[#777] text-center overflow-hidden"><span class="line-clamp-2 w-full break-all">${file.name}</span></div>`;
  }

  // Create card container
  const card = document.createElement('div');
  card.className = "h-20 bg-[#2e2e2e] rounded border border-[#333333] relative group cursor-pointer hover:border-[#a3a3a3] overflow-hidden select-none";

  // Build inner HTML structure including a delete button if stored in DB
  card.innerHTML = `
    ${previewElementHtml}${durationText ? `<div class="absolute bottom-1 right-1 text-[10px] bg-[#1a1a1a]/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-white z-10">${durationText}</div>` : ''}
    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150 flex items-center justify-center pointer-events-none z-10">
      <i data-lucide="${iconName}" class="text-white w-6 h-6"></i>
    </div>
    ${dbRecord ? `
      <button class="delete-media-btn absolute top-1 right-1 bg-[#242424] hover:bg-[#1a1a1a] text-red-500 p-1 rounded border border-[#333333] opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20" title="Delete media">
        <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i>
      </button>
    ` : ''}
  `;

  if (dbRecord) {
    const deleteBtn = card.querySelector('.delete-media-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteFileFromDB(dbRecord.id, dbRecord.blobId);
        URL.revokeObjectURL(objectUrl);
        card.remove();
      });
    }
  }

  return card;
}

// Event Listener
document.addEventListener("click", (event) => {
  const target = event.target ? event.target.closest('#addNewMediaButton') : null;
  if (target) {
    handleMediaSelection();
  }
});

async function handleMediaSelection() {
  const files = await pickFile();
  if (!files || files.length === 0) return;
  
  const container = document.getElementById("mediaItemContainer") || mediaItemContainer;
  
  for (const file of files) {
    try {
      // Save file into Dexie DB
      const dbRecord = await saveFileToDB(file);
      const card = await createMediaItemElement(file, dbRecord);
      if (container) {
        container.appendChild(card);
      }
    } catch (err) {
      console.error("Failed to save media item:", err);
    }
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Load all saved media items from Dexie IndexedDB when the page opens
 */
async function loadSavedMedia() {
  try {
    const savedItems = await getAllFilesFromDB();
    const container = document.getElementById("mediaItemContainer") || mediaItemContainer;
    if (!container) return;

    for (const item of savedItems) {
      const card = await createMediaItemElement(item.file, { id: item.id, blobId: item.blobId });
      container.appendChild(card);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error("Error loading saved media from Dexie DB:", err);
  }
}

// Auto-load saved files when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedMedia();
    initSettingsModal();
    getSettingsFromDB().then(settings => window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings })));
  });
} else {
  loadSavedMedia();
  initSettingsModal();
  getSettingsFromDB().then(settings => window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings })));
}

// ==========================================
// Settings Modal Logic & Dexie Storage
// ==========================================

let activeResolutionPreset = '1080p';

function initSettingsModal() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsModal = document.getElementById('close-settings-modal');
  const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');

  const widthInput = document.getElementById('setting-width');
  const heightInput = document.getElementById('setting-height');
  const fpsSelect = document.getElementById('setting-fps');
  const canvasBgPicker = document.getElementById('setting-canvasBg');
  const canvasBgHex = document.getElementById('setting-canvasBg-hex');

  const exportFormatSelect = document.getElementById('setting-exportFormat');
  const videoCodecSelect = document.getElementById('setting-videoCodec');
  const videoBitrateRange = document.getElementById('setting-videoBitrate');
  const bitrateValDisplay = document.getElementById('bitrate-val-display');

  const exportAudioCheckbox = document.getElementById('setting-exportAudio');
  const audioResolutionSelect = document.getElementById('setting-audioResolution');
  const audioSampleRateSelect = document.getElementById('setting-audioSampleRate');
  const fastStartCheckbox = document.getElementById('setting-fastStart');

  const presetButtons = document.querySelectorAll('.preset-btn');
  const navTabs = document.querySelectorAll('.settings-nav-tab');
  const tabPanels = document.querySelectorAll('.settings-tab-panel');

  if (!settingsModal) return;

  // Open Modal
  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      settingsModal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
      await loadSettingsIntoUI();
    });
  }

  // Close Modal
  const closeModal = () => {
    settingsModal.classList.add('hidden');
  };

  if (closeSettingsModal) closeSettingsModal.addEventListener('click', closeModal);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeModal();
    }
  });

  // Navigation Tabs
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanelId = tab.getAttribute('data-tab');
      
      navTabs.forEach(t => {
        t.classList.remove('bg-[#2e2e2e]', 'text-[#f5f5f5]', 'border', 'border-[#333333]');
        t.classList.add('text-[#a3a3a3]');
      });
      tab.classList.add('bg-[#2e2e2e]', 'text-[#f5f5f5]', 'border', 'border-[#333333]');
      tab.classList.remove('text-[#a3a3a3]');

      tabPanels.forEach(panel => {
        if (panel.id === targetPanelId) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    });
  });

  // Preset Buttons
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      const w = btn.getAttribute('data-w');
      const h = btn.getAttribute('data-h');

      activeResolutionPreset = preset;
      if (preset !== 'custom') {
        if (widthInput) widthInput.value = w;
        if (heightInput) heightInput.value = h;
      }
      updatePresetButtonStyles();
    });
  });

  // Manual Width / Height inputs change
  [widthInput, heightInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        checkPresetMatch();
      });
    }
  });

  function updatePresetButtonStyles() {
    presetButtons.forEach(btn => {
      const preset = btn.getAttribute('data-preset');
      if (preset === activeResolutionPreset) {
        btn.classList.add('border-[#f5f5f5]');
        btn.classList.remove('border-[#333333]');
      } else {
        btn.classList.remove('border-[#f5f5f5]');
        btn.classList.add('border-[#333333]');
      }
    });
  }

  function checkPresetMatch() {
    const w = widthInput ? widthInput.value : '';
    const h = heightInput ? heightInput.value : '';
    let matched = 'custom';

    presetButtons.forEach(btn => {
      const presetW = btn.getAttribute('data-w');
      const presetH = btn.getAttribute('data-h');
      const presetKey = btn.getAttribute('data-preset');
      if (presetKey !== 'custom' && presetW === w && presetH === h) {
        matched = presetKey;
      }
    });

    activeResolutionPreset = matched;
    updatePresetButtonStyles();
  }

  // Bitrate Slider Live Update
  if (videoBitrateRange && bitrateValDisplay) {
    videoBitrateRange.addEventListener('input', () => {
      bitrateValDisplay.textContent = `${videoBitrateRange.value} Mbps`;
    });
  }

  // Canvas BG sync
  if (canvasBgPicker && canvasBgHex) {
    canvasBgPicker.addEventListener('input', () => {
      canvasBgHex.value = canvasBgPicker.value;
    });
    canvasBgHex.addEventListener('input', () => {
      if (/^#[0-9A-F]{6}$/i.test(canvasBgHex.value)) {
        canvasBgPicker.value = canvasBgHex.value;
      }
    });
  }

  // Populate UI from Dexie DB
  async function loadSettingsIntoUI() {
    const settings = await getSettingsFromDB();

    activeResolutionPreset = settings.resolutionPreset || '1080p';
    if (widthInput) widthInput.value = settings.width || 1920;
    if (heightInput) heightInput.value = settings.height || 1080;
    if (fpsSelect) fpsSelect.value = settings.fps || 30;
    if (canvasBgPicker) canvasBgPicker.value = settings.canvasBg || '#000000';
    if (canvasBgHex) canvasBgHex.value = settings.canvasBg || '#000000';

    if (exportFormatSelect) exportFormatSelect.value = settings.exportFormat || 'mp4';
    if (videoCodecSelect) videoCodecSelect.value = settings.videoCodec || 'h264';
    
    // Compression radio
    const compRadio = document.querySelector(`input[name="compression"][value="${settings.compression || 'medium'}"]`);
    if (compRadio) compRadio.checked = true;

    if (videoBitrateRange) {
      videoBitrateRange.value = settings.videoBitrate || 12;
      if (bitrateValDisplay) bitrateValDisplay.textContent = `${videoBitrateRange.value} Mbps`;
    }

    if (exportAudioCheckbox) exportAudioCheckbox.checked = settings.exportAudio !== false;
    if (audioResolutionSelect) audioResolutionSelect.value = settings.audioResolution || '192';
    if (audioSampleRateSelect) audioSampleRateSelect.value = settings.audioSampleRate || '48000';
    if (fastStartCheckbox) fastStartCheckbox.checked = settings.fastStart !== false;

    updatePresetButtonStyles();
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  }

  // Save Settings
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const selectedCompressionRadio = document.querySelector('input[name="compression"]:checked');
      
      const settingsToSave = {
        resolutionPreset: activeResolutionPreset,
        width: widthInput ? parseInt(widthInput.value, 10) || 1920 : 1920,
        height: heightInput ? parseInt(heightInput.value, 10) || 1080 : 1080,
        fps: fpsSelect ? parseFloat(fpsSelect.value) || 30 : 30,
        canvasBg: canvasBgPicker ? canvasBgPicker.value : '#000000',
        exportFormat: exportFormatSelect ? exportFormatSelect.value : 'mp4',
        videoCodec: videoCodecSelect ? videoCodecSelect.value : 'h264',
        compression: selectedCompressionRadio ? selectedCompressionRadio.value : 'medium',
        videoBitrate: videoBitrateRange ? parseInt(videoBitrateRange.value, 10) || 12 : 12,
        exportAudio: exportAudioCheckbox ? exportAudioCheckbox.checked : true,
        audioResolution: audioResolutionSelect ? audioResolutionSelect.value : '192',
        audioSampleRate: audioSampleRateSelect ? audioSampleRateSelect.value : '48000',
        fastStart: fastStartCheckbox ? fastStartCheckbox.checked : true
      };

      try {
        await saveSettingsToDB(settingsToSave);
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settingsToSave }));
        const saveBtnText = document.getElementById('save-btn-text');
        if (saveBtnText) saveBtnText.textContent = 'Saved!';
        setTimeout(() => {
          if (saveBtnText) saveBtnText.textContent = 'Save Settings';
          closeModal();
        }, 300);
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
    });
  }

  // Reset Defaults
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', async () => {
      const resetData = await saveSettingsToDB(DEFAULT_SETTINGS);
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: resetData }));
      await loadSettingsIntoUI();
    });
  }
}