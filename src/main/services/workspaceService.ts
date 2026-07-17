import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import type { WorkspaceData, WorkspaceIndex, WorkspaceListItem } from '../../shared/types';

const ICONS = ['map-pin', 'home', 'book-open', 'briefcase', 'heart', 'star', 'coffee', 'music', 'camera', 'code'];
const COLORS = ['#EA4335', '#34A853', '#4A90D9', '#9B72CF', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1'];

export function createWorkspaceStore(userDataPath: string) {
  const root = join(userDataPath, 'aether-workspaces');
  const workspaceDir = join(root, 'workspaces');
  const indexPath = join(root, 'workspace-index.json');
  let writeQueue: Promise<void> = Promise.resolve();
  const emptyIndex = (): WorkspaceIndex => ({ workspaces: [], activeWorkspaceId: null });
  const initialization = (async () => {
    await fs.mkdir(workspaceDir, { recursive: true });
    const directories = [root, workspaceDir];
    await Promise.all(directories.map(async (directory) => {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      await Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith('.tmp')).map((entry) => fs.rm(join(directory, entry.name), { force: true })));
    }));
  })();
  const ensure = async () => initialization;
  const backupPath = (targetPath: string) => `${targetPath}.backup`;
  const writeJson = async (targetPath: string, value: unknown): Promise<void> => {
    const contents = JSON.stringify(value, null, 2);
    const temporaryPath = `${targetPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    const operation = writeQueue.then(async () => {
      await ensure();
      try {
        // Keep only a parseable previous version as recovery evidence.
        const previous = await fs.readFile(targetPath, 'utf8');
        JSON.parse(previous);
        await fs.copyFile(targetPath, backupPath(targetPath));
      } catch {
        // A missing or partial primary must never overwrite a valid backup.
      }
      try {
        await fs.writeFile(temporaryPath, contents, 'utf8');
        await fs.rename(temporaryPath, targetPath);
      } finally {
        await fs.rm(temporaryPath, { force: true });
      }
    });
    writeQueue = operation.catch(() => undefined);
    await operation;
  };
  const readJson = async <T>(targetPath: string): Promise<T> => {
    try {
      return JSON.parse(await fs.readFile(targetPath, 'utf8')) as T;
    } catch (primaryError) {
      try {
        const recovered = JSON.parse(await fs.readFile(backupPath(targetPath), 'utf8')) as T;
        await writeJson(targetPath, recovered);
        return recovered;
      } catch {
        throw primaryError;
      }
    }
  };
  const readIndex = async (): Promise<WorkspaceIndex> => {
    await ensure();
    try { return await readJson<WorkspaceIndex>(indexPath); } catch { const index = emptyIndex(); await writeJson(indexPath, index); return index; }
  };
  const writeIndex = async (index: WorkspaceIndex) => writeJson(indexPath, index);
  const filePath = (id: string) => join(workspaceDir, `${id}.json`);
  const writeWorkspace = async (workspace: WorkspaceData) => writeJson(filePath(workspace.id), workspace);
  const updateIndexItem = async (workspace: WorkspaceData) => {
    const index = await readIndex();
    const item: WorkspaceListItem = { id: workspace.id, name: workspace.name, icon: workspace.icon, iconColor: workspace.iconColor, createdAt: workspace.createdAt, updatedAt: workspace.updatedAt, fileCount: workspace.analyzedFiles.length };
    const position = index.workspaces.findIndex((entry) => entry.id === workspace.id);
    if (position >= 0) index.workspaces[position] = item; else index.workspaces.unshift(item);
    index.activeWorkspaceId = workspace.id;
    await writeIndex(index);
  };
  return {
    list: readIndex,
    async create(name = 'Untitled Space') {
      const now = new Date().toISOString(); const id = `ws_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`; const pick = Math.floor(Math.random() * ICONS.length);
      const workspace: WorkspaceData = { id, name, icon: ICONS[pick], iconColor: COLORS[pick % COLORS.length], nodes: [], edges: [], analyzedFiles: [], relationships: [], viewport: { x: 0, y: 0, zoom: 1 }, createdAt: now, updatedAt: now, fileCount: 0 };
      await writeWorkspace(workspace); await updateIndexItem(workspace); return workspace;
    },
    async load(id: string) { return readJson<WorkspaceData>(filePath(id)); },
    async save(workspace: WorkspaceData) { const next = { ...workspace, updatedAt: new Date().toISOString(), fileCount: workspace.analyzedFiles.length }; await writeWorkspace(next); await updateIndexItem(next); },
    async delete(id: string) { const index = await readIndex(); await Promise.all([fs.rm(filePath(id), { force: true }), fs.rm(backupPath(filePath(id)), { force: true })]); index.workspaces = index.workspaces.filter((workspace) => workspace.id !== id); if (index.activeWorkspaceId === id) index.activeWorkspaceId = index.workspaces[0]?.id ?? null; await writeIndex(index); },
    async rename(id: string, name: string) { const workspace = await this.load(id); await this.save({ ...workspace, name: name.trim() || 'Untitled Space' }); },
    async setIcon(id: string, icon: string, iconColor: string) { const workspace = await this.load(id); await this.save({ ...workspace, icon, iconColor }); },
  };
}
