import { promises as fs } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type OpenDialogOptions,
} from 'electron';

import type { AnalyzedFile, LocalFileMetadata } from '../shared/types';
import { analyzeFile, findRelationships } from './services/aiService';
import {
  generateThumbnail,
  mimeTypeForPath,
  prepareFileForAPI,
} from './services/fileReader';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const authorizedFilePaths = new Set<string>();
const analyzedFiles = new Map<string, AnalyzedFile>();

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

  if (!capturePath || smokeFilePaths.length === 0) return;

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
      await new Promise((done) => setTimeout(done, 9000));

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
      const normalized = requireAuthorizedFile(filePath);
      const preparedFile = prepareFileForAPI(normalized);
      const analysis = await analyzeFile(preparedFile, fileId, normalized);
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
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Aether Canvas',
    backgroundColor: '#F8F8FA',
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
