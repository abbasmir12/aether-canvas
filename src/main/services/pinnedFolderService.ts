import { promises as fs } from 'node:fs';
import type { Dirent } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

import type { PinnedFolder, PinnedFolderContents, PinnedFolderFile } from '../../shared/types';
import { mimeTypeForPath } from './fileReader';

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.xlsx', '.xls', '.csv', '.txt', '.md', '.png', '.jpg', '.jpeg', '.docx']);

function isSupported(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.has(extname(filePath).toLowerCase());
}

export function createPinnedFolderStore(userDataPath: string, authorize: (filePath: string) => Promise<string>) {
  const storagePath = join(userDataPath, 'pinned-folders.json');

  const read = async (): Promise<PinnedFolder[]> => {
    try {
      const parsed = JSON.parse(await fs.readFile(storagePath, 'utf8')) as { pinnedFolders?: PinnedFolder[] };
      return Array.isArray(parsed.pinnedFolders) ? parsed.pinnedFolders : [];
    } catch {
      await write([]);
      return [];
    }
  };

  const write = async (pinnedFolders: PinnedFolder[]) => {
    await fs.mkdir(userDataPath, { recursive: true });
    await fs.writeFile(storagePath, JSON.stringify({ pinnedFolders }, null, 2));
  };

  const ensurePinned = async (folderPath: string): Promise<PinnedFolder> => {
    const normalized = resolve(folderPath);
    const folders = await read();
    const folder = folders.find((item) => item.path === normalized);
    if (!folder) throw new Error('That folder is not pinned in Aether.');
    return folder;
  };

  const readFolder = async (folder: PinnedFolder): Promise<PinnedFolderContents> => {
    let entries: Dirent<string>[];
    try {
      entries = await fs.readdir(folder.path, { withFileTypes: true });
    } catch {
      return { ...folder, files: [] };
    }

    const files = await Promise.all(entries.filter((entry) => entry.isFile() && isSupported(entry.name)).map(async (entry) => {
      const filePath = join(folder.path, entry.name);
      const stats = await fs.stat(filePath);
      const authorizedPath = await authorize(filePath);
      const file: PinnedFolderFile = { name: basename(authorizedPath), path: authorizedPath, size: stats.size, modifiedAt: stats.mtime.toISOString(), type: mimeTypeForPath(authorizedPath) };
      return file;
    }));

    files.sort((left, right) => new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime());
    return { ...folder, files };
  };

  return {
    async add(folderPath: string): Promise<PinnedFolder> {
      const normalized = resolve(folderPath);
      const stats = await fs.stat(normalized);
      if (!stats.isDirectory()) throw new Error('Aether can only pin folders.');
      const folders = await read();
      const existing = folders.find((folder) => folder.path === normalized);
      if (existing) return existing;
      const folder = { path: normalized, addedAt: new Date().toISOString() };
      await write([...folders, folder]);
      return folder;
    },
    async remove(folderPath: string): Promise<void> {
      const normalized = resolve(folderPath);
      await write((await read()).filter((folder) => folder.path !== normalized));
    },
    async list(): Promise<PinnedFolderContents[]> {
      return Promise.all((await read()).map(readFolder));
    },
    async read(folderPath: string): Promise<PinnedFolderContents> {
      return readFolder(await ensurePinned(folderPath));
    },
  };
}
