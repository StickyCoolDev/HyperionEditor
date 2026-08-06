var db = new Dexie('hyper');
db.version(1).stores({
  videoFiles: '++id, name, blobId',
  fileBlobs: '++id, fileType, blob'
});

db.version(2).stores({
  videoFiles: '++id, name, blobId',
  fileBlobs: '++id, fileType, blob',
  settings: 'id'
});

const DEFAULT_SETTINGS = {
  id: 'projectSettings',
  resolutionPreset: '1080p',
  width: 1920,
  height: 1080,
  fps: 30,
  canvasBg: '#000000',
  exportFormat: 'mp4',
  videoCodec: 'h264',
  compression: 'medium',
  videoBitrate: 12,
  audioResolution: '192',
  audioSampleRate: '48000',
  exportAudio: true,
  fastStart: true
};

/**
 * Get project & export settings from Dexie IndexedDB
 */
async function getSettingsFromDB() {
  try {
    const saved = await db.settings.get('projectSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
  } catch (err) {
    console.error("Error fetching settings from Dexie DB:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save project & export settings to Dexie IndexedDB
 */
async function saveSettingsToDB(settingsObj) {
  try {
    const dataToSave = { ...DEFAULT_SETTINGS, ...settingsObj, id: 'projectSettings' };
    await db.settings.put(dataToSave);
    return dataToSave;
  } catch (err) {
    console.error("Error saving settings to Dexie DB:", err);
    throw err;
  }
}

/**
 * Save an imported File/Blob into Dexie IndexedDB
 */
async function saveFileToDB(file) {
  try {
    const blobId = await db.fileBlobs.add({
      fileType: file.type || 'application/octet-stream',
      blob: file
    });
    const videoFileId = await db.videoFiles.add({
      name: file.name,
      blobId: blobId,
      type: file.type || '',
      size: file.size || 0
    });
    return {
      id: videoFileId,
      blobId: blobId,
      name: file.name,
      file: file
    };
  } catch (err) {
    console.error("Error saving file to Dexie DB:", err);
    throw err;
  }
}

/**
 * Retrieve all saved media files from Dexie IndexedDB
 */
async function getAllFilesFromDB() {
  try {
    const records = await db.videoFiles.toArray();
    const mediaItems = [];
    for (const record of records) {
      const blobRecord = await db.fileBlobs.get(record.blobId);
      if (blobRecord && blobRecord.blob) {
        const fileObj = new File([blobRecord.blob], record.name, {
          type: blobRecord.fileType || record.type || ''
        });
        mediaItems.push({
          id: record.id,
          blobId: record.blobId,
          name: record.name,
          file: fileObj
        });
      }
    }
    return mediaItems;
  } catch (err) {
    console.error("Error fetching files from Dexie DB:", err);
    return [];
  }
}

/**
 * Delete a media record and its associated blob from Dexie IndexedDB
 */
async function deleteFileFromDB(id, blobId) {
  try {
    if (id) await db.videoFiles.delete(id);
    if (blobId) await db.fileBlobs.delete(blobId);
  } catch (err) {
    console.error("Error deleting file from Dexie DB:", err);
  }
}

