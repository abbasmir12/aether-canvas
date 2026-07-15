import { contextBridge, ipcRenderer, webUtils } from 'electron';

import type { AetherBridge } from '../shared/types';

const aetherBridge: AetherBridge = {
  readFile: (filePath) => ipcRenderer.invoke('aether:read-file', filePath),
  getFileMetadata: (filePath) =>
    ipcRenderer.invoke('aether:get-file-metadata', filePath),
  getThumbnail: (filePath) =>
    ipcRenderer.invoke('aether:get-thumbnail', filePath),
  openFileDialog: () => ipcRenderer.invoke('aether:open-file-dialog'),
  analyzeFile: (filePath, fileId) =>
    ipcRenderer.invoke('aether:analyze-file', filePath, fileId),
  findRelationships: (fileIds) =>
    ipcRenderer.invoke('aether:find-relationships', fileIds),
  getDroppedFilePath: async (file) => {
    const filePath = webUtils.getPathForFile(file);

    if (!filePath) {
      throw new Error('The dropped item is not backed by a local file.');
    }

    return ipcRenderer.invoke('aether:get-dropped-file-path', filePath);
  },
};

contextBridge.exposeInMainWorld('aether', aetherBridge);
