import { promises as fs } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type OpenDialogOptions,
} from 'electron';
import sharp from 'sharp';

import type { LocalFileMetadata } from '../shared/types';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const authorizedFilePaths = new Set<string>();

const MIME_TYPES: Record<string, string> = {
  '.csv': 'text/csv',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const TEXT_EXTENSIONS = new Set(['.csv', '.json', '.md', '.txt']);
const IMAGE_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.webp']);

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
  const extension = extname(normalized).toLowerCase();

  return {
    name: basename(normalized),
    path: normalized,
    type: MIME_TYPES[extension] ?? 'application/octet-stream',
    size: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

async function runSmokeCapture(window: BrowserWindow): Promise<void> {
  const capturePath = process.env.AETHER_SMOKE_CAPTURE;
  const smokeFilePath = process.env.AETHER_SMOKE_FILE;

  if (!capturePath || !smokeFilePath) return;

  window.webContents.once('did-finish-load', async () => {
    try {
      window.webContents.debugger.attach('1.3');
      const dragData = {
        items: [],
        files: [resolve(smokeFilePath)],
        dragOperationsMask: 1,
      };

      await window.webContents.debugger.sendCommand('Input.dispatchDragEvent', {
        type: 'dragEnter',
        x: 520,
        y: 340,
        data: dragData,
      });
      await window.webContents.debugger.sendCommand('Input.dispatchDragEvent', {
        type: 'drop',
        x: 520,
        y: 340,
        data: dragData,
      });
      await new Promise((done) => setTimeout(done, 800));

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

  ipcMain.handle('aether:parse-file', async (_event, filePath: string) => {
    const normalized = requireAuthorizedFile(filePath);
    const extension = extname(normalized).toLowerCase();

    if (TEXT_EXTENSIONS.has(extension)) {
      return fs.readFile(normalized, 'utf8');
    }

    return '';
  });

  ipcMain.handle('aether:get-thumbnail', async (_event, filePath: string) => {
    const normalized = requireAuthorizedFile(filePath);
    const extension = extname(normalized).toLowerCase();

    if (!IMAGE_EXTENSIONS.has(extension)) {
      return null;
    }

    const thumbnail = await sharp(normalized)
      .rotate()
      .resize(360, 240, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    return `data:image/jpeg;base64,${thumbnail.toString('base64')}`;
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
