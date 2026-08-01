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
  document.addEventListener('DOMContentLoaded', loadSavedMedia);
} else {
  loadSavedMedia();
}