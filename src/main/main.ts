import { promises as fs } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  type OpenDialogOptions,
} from 'electron';

import type { AnalyzedFile, LocalFileMetadata } from '../shared/types';
import { analyzeFile, findRelationships, generateDashboardInsights } from './services/aiService';
import {
  generateThumbnail,
  mimeTypeForPath,
  prepareFileForAPI,
} from './services/fileReader';
import { createWorkspaceStore } from './services/workspaceService';
import { createPinnedFolderStore } from './services/pinnedFolderService';
import { FileWatcherService, hashFile } from './services/fileWatcher';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const authorizedFilePaths = new Set<string>();
const analyzedFiles = new Map<string, AnalyzedFile>();
let smokeAnalyzeCalls = 0;
const broadcast = (channel: string, payload: unknown) => {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload);
  }
};
const fileWatcher = new FileWatcherService({
  changed: (event) => broadcast('aether:file-changed', event),
  deleted: (event) => broadcast('aether:file-deleted', event),
});

function normalizedPath(filePath: string): string {
  if (typeof filePath !== 'string' || !isAbsolute(filePath)) {
    throw new Error('Aether only accepts absolute local file paths.');
  }

  return resolve(filePath);
}

async function authorizeFile(filePath: string): Promise<string> {
  const normalized = normalizedPath(filePath);
  const stats = await fs.stat(normalized);

  if (!stats.isFile()) {
    throw new Error('The selected path is not a file.');
  }

  authorizedFilePaths.add(normalized);
  return normalized;
}

function requireAuthorizedFile(filePath: string): string {
  const normalized = normalizedPath(filePath);

  if (!authorizedFilePaths.has(normalized)) {
    throw new Error('File access was not authorized by a drop or picker action.');
  }

  return normalized;
}

async function metadataFor(filePath: string): Promise<LocalFileMetadata> {
  const normalized = requireAuthorizedFile(filePath);
  const stats = await fs.stat(normalized);
  return {
    name: basename(normalized),
    path: normalized,
    type: mimeTypeForPath(normalized),
    size: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

async function runSmokeCapture(window: BrowserWindow): Promise<void> {
  const capturePath = process.env.AETHER_SMOKE_CAPTURE;
  const smokeFilePaths = (process.env.AETHER_SMOKE_FILES ?? process.env.AETHER_SMOKE_FILE ?? '')
    .split(',')
    .map((filePath) => filePath.trim())
    .filter(Boolean);

  if (!capturePath) return;

  window.webContents.once('did-finish-load', async () => {
    try {
      window.webContents.debugger.attach('1.3');
      for (const [index, smokeFilePath] of smokeFilePaths.entries()) {
        const dragData = { items: [], files: [resolve(smokeFilePath)], dragOperationsMask: 1 };
        const x = 440 + (index % 2) * 80;
        const y = 220 + index * 85;
        await window.webContents.debugger.sendCommand('Input.dispatchDragEvent', { type: 'dragEnter', x, y, data: dragData });
        await window.webContents.debugger.sendCommand('Input.dispatchDragEvent', { type: 'drop', x, y, data: dragData });
        await new Promise((done) => setTimeout(done, 900));
      }
      await new Promise((done) => setTimeout(done, Number(process.env.AETHER_SMOKE_WAIT_MS) || 9000));

      if (process.env.AETHER_SMOKE_LIVE_EDIT_FILE) {
        const editPath = resolve(process.env.AETHER_SMOKE_LIVE_EDIT_FILE);
        const before = process.env.AETHER_SMOKE_LIVE_EDIT_FROM ?? '820';
        const after = process.env.AETHER_SMOKE_LIVE_EDIT_TO ?? '950';
        const contents = await fs.readFile(editPath, 'utf8');
        if (!contents.includes(before)) throw new Error(`Live-edit smoke value "${before}" was not found.`);
        const nextContents = contents.replace(before, after).replace(process.env.AETHER_SMOKE_LIVE_EDIT_FROM_2 ?? '__no_secondary_replacement__', process.env.AETHER_SMOKE_LIVE_EDIT_TO_2 ?? '__no_secondary_replacement__');
        if (process.env.AETHER_SMOKE_LIVE_RAPID) {
          for (let index = 1; index <= 5; index += 1) {
            await fs.writeFile(editPath, index === 5 ? nextContents : `${nextContents}${'\n'.repeat(index)}`, 'utf8');
            await new Promise((done) => setTimeout(done, 120));
          }
        } else {
          await fs.writeFile(editPath, nextContents, 'utf8');
        }
        await new Promise((done) => setTimeout(done, Number(process.env.AETHER_SMOKE_LIVE_WAIT_MS) || 15_000));
        const liveState = await window.webContents.executeJavaScript(`JSON.stringify({
          sync: Array.from(document.querySelectorAll('[data-sync-status]')).map((node) => node.getAttribute('data-sync-status')),
          budgetCard: Array.from(document.querySelectorAll('.react-flow__node-fileCard')).find((node) => /budget/i.test(node.textContent || ''))?.textContent || '',
          summary: document.querySelector('.react-flow__node-summaryCard')?.textContent || ''
        })`);
        console.log(`AETHER_SMOKE_LIVE_SYNC calls=${smokeAnalyzeCalls} ${liveState}`);
      }

      if (process.env.AETHER_SMOKE_LIVE_DELETE_FILE) {
        await fs.unlink(resolve(process.env.AETHER_SMOKE_LIVE_DELETE_FILE));
        await new Promise((done) => setTimeout(done, 2_200));
        const deletedState = await window.webContents.executeJavaScript(`JSON.stringify({ deleted: document.querySelectorAll('[data-sync-status="deleted"]').length, actions: Array.from(document.querySelectorAll('.react-flow__node-fileCard button')).map((button) => (button.textContent || button.getAttribute('aria-label') || '').trim()).filter(Boolean) })`);
        console.log(`AETHER_SMOKE_LIVE_DELETE ${deletedState}`);
      }

      if (process.env.AETHER_SMOKE_PREVIEW) {
        const target = await window.webContents.executeJavaScript(`(() => {
          const node = document.querySelector('.react-flow__node-fileCard');
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })()`);
        if (target) {
          await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 2 });
          await window.webContents.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 2 });
          await new Promise((done) => setTimeout(done, 700));
        }
      }

      if (process.env.AETHER_SMOKE_SUMMARY_MAP) {
        const fitted = await window.webContents.executeJavaScript(`(() => {
          const button = document.querySelector('button[aria-label="Fit canvas to content"]');
          if (!button) return false;
          button.click();
          return true;
        })()`);
        if (fitted) await new Promise((done) => setTimeout(done, 500));
        const opened = await window.webContents.executeJavaScript(`(() => {
          const button = Array.from(document.querySelectorAll('.react-flow__node-summaryCard button')).find((item) => /^(map|places)/i.test((item.textContent || '').trim()));
          if (!button) return false;
          button.click();
          return true;
        })()`);
        if (opened) await new Promise((done) => setTimeout(done, 900));
      }

      if (process.env.AETHER_SMOKE_SUMMARY_BUDGET) {
        const fitted = await window.webContents.executeJavaScript(`(() => {
          const button = document.querySelector('button[aria-label="Fit canvas to content"]');
          if (!button) return false;
          button.click();
          return true;
        })()`);
        if (fitted) await new Promise((done) => setTimeout(done, 500));
        const opened = await window.webContents.executeJavaScript(`(() => {
          const button = Array.from(document.querySelectorAll('.react-flow__node-summaryCard button')).find((item) => /^budget/i.test((item.textContent || '').trim()));
          if (!button) return false;
          if (button.getAttribute('aria-expanded') !== 'true') button.click();
          return true;
        })()`);
        if (opened) await new Promise((done) => setTimeout(done, 900));
      }

      if (process.env.AETHER_SMOKE_MAP_INTERACTION) {
        await window.webContents.executeJavaScript(`(() => {
          const button = document.querySelector('.aether-map .leaflet-control-zoom-in');
          button?.click();
          const marker = document.querySelector('.aether-map-marker-shell');
          marker?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        })()`);
        await new Promise((done) => setTimeout(done, 900));
        const firstState = await window.webContents.executeJavaScript(`JSON.stringify({ zoom: document.querySelector('.aether-map .leaflet-tile-loaded')?.src.match(/light_all\\/(\\d+)\\//)?.[1] || '', popup: Boolean(document.querySelector('.aether-map-popup')), directions: Boolean(Array.from(document.querySelectorAll('.aether-map-popup button')).find((button) => /directions|nearby/i.test(button.textContent || ''))) })`);
        await new Promise((done) => setTimeout(done, 900));
        const secondState = await window.webContents.executeJavaScript(`JSON.stringify({ zoom: document.querySelector('.aether-map .leaflet-tile-loaded')?.src.match(/light_all\\/(\\d+)\\//)?.[1] || '', popup: Boolean(document.querySelector('.aether-map-popup')), directions: Boolean(Array.from(document.querySelectorAll('.aether-map-popup button')).find((button) => /directions|nearby/i.test(button.textContent || ''))) })`);
        console.log(`AETHER_SMOKE_MAP_INTERACTION ${firstState} ${secondState}`);
      }

      if (process.env.AETHER_SMOKE_DEBUG) {
        const edgeDebug = await window.webContents.executeJavaScript(`JSON.stringify({
          ribbons: document.querySelectorAll('.semantic-ribbon').length,
          paths: Array.from(document.querySelectorAll('.semantic-ribbon path')).map((path) => ({ d: path.getAttribute('d'), stroke: path.getAttribute('stroke'), opacity: path.getAttribute('stroke-opacity') }))
        })`);
        console.log(`AETHER_SMOKE_EDGE_DEBUG ${edgeDebug}`);
      }

      const screenshot = await window.webContents.capturePage();
      await fs.writeFile(resolve(capturePath), screenshot.toPNG());
    } finally {
      if (window.webContents.debugger.isAttached()) {
        window.webContents.debugger.detach();
      }
      app.quit();
    }
  });
}

function registerIpcHandlers(): void {
  const workspaces = () => createWorkspaceStore(app.getPath('userData'));
  const pinnedFolders = () => createPinnedFolderStore(app.getPath('userData'), authorizeFile);
  ipcMain.handle('aether:get-dropped-file-path', (_event, filePath: string) =>
    authorizeFile(filePath),
  );

  ipcMain.handle('aether:open-file-dialog', async () => {
    const options: OpenDialogOptions = {
      title: 'Add files to Aether Canvas',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Documents and images',
          extensions: [
            'pdf',
            'png',
            'jpg',
            'jpeg',
            'webp',
            'xlsx',
            'xls',
            'csv',
            'txt',
            'md',
            'tsv',
            'docx',
            'pptx',
          ],
        },
      ],
    };
    const result = await dialog.showOpenDialog(options);

    if (!result.canceled) {
      await Promise.all(result.filePaths.map(authorizeFile));
    }

    return result;
  });

  ipcMain.handle('aether:get-file-metadata', (_event, filePath: string) =>
    metadataFor(filePath),
  );

  ipcMain.handle('aether:read-file', async (_event, filePath: string) => {
    const normalized = requireAuthorizedFile(filePath);
    return fs.readFile(normalized, 'utf8');
  });

  ipcMain.handle('aether:get-thumbnail', async (_event, filePath: string) => {
    const normalized = requireAuthorizedFile(filePath);
    const thumbnail = await generateThumbnail(normalized);
    return thumbnail ? `data:image/jpeg;base64,${thumbnail}` : null;
  });

  ipcMain.handle(
    'aether:analyze-file',
    async (_event, filePath: string, fileId: string) => {
      if (process.env.AETHER_SMOKE_LIVE_EDIT_FILE) smokeAnalyzeCalls += 1;
      const normalized = requireAuthorizedFile(filePath);
      const preparedFile = prepareFileForAPI(normalized);
      const [analysisResult, contentHash] = await Promise.all([
        analyzeFile(preparedFile, fileId, normalized),
        hashFile(normalized),
      ]);
      const analysis = { ...analysisResult, contentHash };
      analyzedFiles.set(fileId, analysis);
      return analysis;
    },
  );

  ipcMain.handle('aether:find-relationships', async (_event, fileIds: string[]) => {
    if (!Array.isArray(fileIds)) {
      throw new Error('Relationship discovery requires a list of file IDs.');
    }

    const files = fileIds.flatMap((id) => {
      const file = analyzedFiles.get(id);
      return file ? [file] : [];
    });

    return findRelationships(files);
  });

  ipcMain.handle('aether:hydrate-analyzed-files', async (_event, files: AnalyzedFile[]) => {
    if (!Array.isArray(files)) throw new Error('Aether expected analyzed workspace files.');
    analyzedFiles.clear();
    await Promise.all(files.map(async (file) => {
      if (!file?.id || !file.filePath) return;
      analyzedFiles.set(file.id, file);
      try { await authorizeFile(file.filePath); } catch { /* Cached analysis remains available for missing sources. */ }
    }));
  });

  ipcMain.handle('aether:file-watcher-watch', async (_event, filePath: string, fileId: string, contentHash?: string) => {
    try {
      const normalized = await authorizeFile(filePath);
      return fileWatcher.watch(normalized, fileId, contentHash);
    } catch {
      return null;
    }
  });
  ipcMain.handle('aether:file-watcher-unwatch', (_event, filePath: string, fileId?: string) => fileWatcher.unwatch(normalizedPath(filePath), fileId));

  ipcMain.handle('aether:window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle('aether:window-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  });

  ipcMain.handle('aether:window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle('aether:open-original-file', async (_event, filePath: string) => {
    const normalized = requireAuthorizedFile(filePath);
    const error = await shell.openPath(normalized);
    if (error) throw new Error(error);
  });
  ipcMain.handle('aether:reveal-file', (_event, filePath: string) => {
    shell.showItemInFolder(requireAuthorizedFile(filePath));
  });
  ipcMain.handle('aether:open-external', async (_event, url: string) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Aether only opens secure web links.');
    await shell.openExternal(parsed.toString());
  });
  ipcMain.handle('aether:save-text-file', async (_event, defaultName: string, contents: string) => {
    const result = await dialog.showSaveDialog({ title: 'Export from Aether Canvas', defaultPath: defaultName, filters: [{ name: 'Text files', extensions: ['txt', 'md', 'csv'] }] });
    if (result.canceled || !result.filePath) return false;
    await fs.writeFile(result.filePath, contents, 'utf8');
    return true;
  });
  ipcMain.handle('aether:get-dashboard-insights', async (_event, kind: 'journey' | 'budget' | 'packing' | 'map', context: string) => {
    if (!['journey', 'budget', 'packing', 'map'].includes(kind) || typeof context !== 'string') throw new Error('Invalid dashboard insight request.');
    return generateDashboardInsights(kind, context);
  });

  ipcMain.handle('aether:workspace-list', () => workspaces().list());
  ipcMain.handle('aether:workspace-create', (_event, name?: string) => workspaces().create(name));
  ipcMain.handle('aether:workspace-load', (_event, id: string) => workspaces().load(id));
  ipcMain.handle('aether:workspace-save', (_event, workspace) => workspaces().save(workspace));
  ipcMain.handle('aether:workspace-delete', (_event, id: string) => workspaces().delete(id));
  ipcMain.handle('aether:workspace-rename', (_event, id: string, name: string) => workspaces().rename(id, name));
  ipcMain.handle('aether:workspace-set-icon', (_event, id: string, icon: string, color: string) => workspaces().setIcon(id, icon, color));
  ipcMain.handle('aether:pinned-folder-add', async () => {
    const result = await dialog.showOpenDialog({ title: 'Pin a folder in Aether', properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return null;
    return pinnedFolders().add(result.filePaths[0]);
  });
  ipcMain.handle('aether:pinned-folder-remove', (_event, folderPath: string) => pinnedFolders().remove(folderPath));
  ipcMain.handle('aether:pinned-folder-list', () => pinnedFolders().list());
  ipcMain.handle('aether:pinned-folder-read', (_event, folderPath: string) => pinnedFolders().read(folderPath));
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Aether Canvas',
    backgroundColor: '#F4F1E9',
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(currentDirectory, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(join(currentDirectory, '../dist/index.html'));
  }

  void runSmokeCapture(window);

  return window;
}

registerIpcHandlers();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  void fileWatcher.stopAll();
});
