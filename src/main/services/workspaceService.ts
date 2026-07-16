import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import type { WorkspaceData, WorkspaceIndex, WorkspaceListItem } from '../../shared/types';

const ICONS = ['map-pin', 'home', 'book-open', 'briefcase', 'heart', 'star', 'coffee', 'music', 'camera', 'code'];
const COLORS = ['#EA4335', '#34A853', '#4A90D9', '#9B72CF', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1'];

export function createWorkspaceStore(userDataPath: string) {
  const root = join(userDataPath, 'aether-workspaces');
  const workspaceDir = join(root, 'workspaces');
  const indexPath = join(root, 'workspace-index.json');
  const emptyIndex = (): WorkspaceIndex => ({ workspaces: [], activeWorkspaceId: null });
  const ensure = async () => { await fs.mkdir(workspaceDir, { recursive: true }); };
  const readIndex = async (): Promise<WorkspaceIndex> => {
    await ensure();
    try { return JSON.parse(await fs.readFile(indexPath, 'utf8')) as WorkspaceIndex; } catch { const index = emptyIndex(); await fs.writeFile(indexPath, JSON.stringify(index, null, 2)); return index; }
  };
  const writeIndex = async (index: WorkspaceIndex) => { await ensure(); await fs.writeFile(indexPath, JSON.stringify(index, null, 2)); };
  const filePath = (id: string) => join(workspaceDir, `${id}.json`);
  const writeWorkspace = async (workspace: WorkspaceData) => { await ensure(); await fs.writeFile(filePath(workspace.id), JSON.stringify(workspace, null, 2)); };
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
    async load(id: string) { return JSON.parse(await fs.readFile(filePath(id), 'utf8')) as WorkspaceData; },
    async save(workspace: WorkspaceData) { const next = { ...workspace, updatedAt: new Date().toISOString(), fileCount: workspace.analyzedFiles.length }; await writeWorkspace(next); await updateIndexItem(next); },
    async delete(id: string) { const index = await readIndex(); await fs.rm(filePath(id), { force: true }); index.workspaces = index.workspaces.filter((workspace) => workspace.id !== id); if (index.activeWorkspaceId === id) index.activeWorkspaceId = index.workspaces[0]?.id ?? null; await writeIndex(index); },
    async rename(id: string, name: string) { const workspace = await this.load(id); await this.save({ ...workspace, name: name.trim() || 'Untitled Space' }); },
    async setIcon(id: string, icon: string, iconColor: string) { const workspace = await this.load(id); await this.save({ ...workspace, icon, iconColor }); },
  };
}
