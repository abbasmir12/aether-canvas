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
  minimizeWindow: () => ipcRenderer.invoke('aether:window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('aether:window-maximize'),
  closeWindow: () => ipcRenderer.invoke('aether:window-close'),
  openOriginalFile: (filePath) => ipcRenderer.invoke('aether:open-original-file', filePath),
  revealFile: (filePath) => ipcRenderer.invoke('aether:reveal-file', filePath),
  openExternal: (url) => ipcRenderer.invoke('aether:open-external', url),
  saveTextFile: (defaultName, contents) => ipcRenderer.invoke('aether:save-text-file', defaultName, contents),
  getDashboardInsights: (kind, context) => ipcRenderer.invoke('aether:get-dashboard-insights', kind, context),
  askWorkspace: (question, fileIds, dashboard) => ipcRenderer.invoke('aether:ask-workspace', question, fileIds, dashboard),
  hydrateAnalyzedFiles: (files) => ipcRenderer.invoke('aether:hydrate-analyzed-files', files),
  settings: {
    get: () => ipcRenderer.invoke('aether:settings-get'),
    update: (update) => ipcRenderer.invoke('aether:settings-update', update),
    testAI: () => ipcRenderer.invoke('aether:settings-test-ai'),
  },
  fileWatcher: {
    watch: (filePath, fileId, contentHash) => ipcRenderer.invoke('aether:file-watcher-watch', filePath, fileId, contentHash),
    unwatch: (filePath, fileId) => ipcRenderer.invoke('aether:file-watcher-unwatch', filePath, fileId),
    onFileChanged: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof callback>[0]) => callback(payload);
      ipcRenderer.on('aether:file-changed', listener);
      return () => ipcRenderer.removeListener('aether:file-changed', listener);
    },
    onFileDeleted: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof callback>[0]) => callback(payload);
      ipcRenderer.on('aether:file-deleted', listener);
      return () => ipcRenderer.removeListener('aether:file-deleted', listener);
    },
  },
  fs: {
    addPinnedFolder: () => ipcRenderer.invoke('aether:pinned-folder-add'),
    removePinnedFolder: (folderPath) => ipcRenderer.invoke('aether:pinned-folder-remove', folderPath),
    getPinnedFolders: () => ipcRenderer.invoke('aether:pinned-folder-list'),
    readPinnedFolder: (folderPath) => ipcRenderer.invoke('aether:pinned-folder-read', folderPath),
  },
  workspace: {
    list: () => ipcRenderer.invoke('aether:workspace-list'),
    create: (name) => ipcRenderer.invoke('aether:workspace-create', name),
    load: (id) => ipcRenderer.invoke('aether:workspace-load', id),
    save: (workspace) => ipcRenderer.invoke('aether:workspace-save', workspace),
    delete: (id) => ipcRenderer.invoke('aether:workspace-delete', id),
    rename: (id, name) => ipcRenderer.invoke('aether:workspace-rename', id, name),
    setIcon: (id, icon, color) => ipcRenderer.invoke('aether:workspace-set-icon', id, icon, color),
  },
  getDroppedFilePath: async (file) => {
    const filePath = webUtils.getPathForFile(file);

    if (!filePath) {
      throw new Error('The dropped item is not backed by a local file.');
    }

    return ipcRenderer.invoke('aether:get-dropped-file-path', filePath);
  },
};

contextBridge.exposeInMainWorld('aether', aetherBridge);
