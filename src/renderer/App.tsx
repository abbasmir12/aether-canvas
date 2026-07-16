import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { HelpCircle, Settings, X } from 'lucide-react';

import type { WorkspaceData, WorkspaceIndex } from '../shared/types';
import AetherCanvas from './components/Canvas/AetherCanvas';
import Sidebar, { type NavItem } from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import WorkspacePlaceholder from './components/WorkspacePlaceholder';

function Panel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="absolute inset-0 z-50 grid place-items-center bg-[#252529]/15 p-5 backdrop-blur-sm"><section className="w-full max-w-[440px] rounded-[16px] border border-[#E6E4E1] bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,0.16)]"><header className="mb-5 flex items-center justify-between"><h2 className="text-[18px] font-semibold">{title}</h2><button className="grid h-8 w-8 place-items-center rounded-lg text-[#77777D] hover:bg-[#F3F2F0]" onClick={onClose} type="button"><X size={18} /></button></header>{children}</section></div>;
}

export default function App() {
  const [activeNavItem, setActiveNavItem] = useState<NavItem>('canvas');
  const [focusRequest, setFocusRequest] = useState(0);
  const [workspaceIndex, setWorkspaceIndex] = useState<WorkspaceIndex>({ workspaces: [], activeWorkspaceId: null });
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [panel, setPanel] = useState<'settings' | 'help' | null>(null);
  const dirty = useRef(false);
  const workspaceRef = useRef<WorkspaceData | null>(null);

  const refreshIndex = useCallback(async () => setWorkspaceIndex(await window.aether.workspace.list()), []);
  const saveCurrent = useCallback(async () => { if (!workspaceRef.current || !dirty.current) return; await window.aether.workspace.save(workspaceRef.current); dirty.current = false; await refreshIndex(); }, [refreshIndex]);
  const selectWorkspace = useCallback(async (id: string) => { await saveCurrent(); const loaded = await window.aether.workspace.load(id); workspaceRef.current = loaded; setWorkspace(loaded); setActiveNavItem('canvas'); await refreshIndex(); }, [refreshIndex, saveCurrent]);
  const createWorkspace = useCallback(async () => { await saveCurrent(); const created = await window.aether.workspace.create(); workspaceRef.current = created; setWorkspace(created); setActiveNavItem('canvas'); await refreshIndex(); }, [refreshIndex, saveCurrent]);
  const snapshotWorkspace = useCallback((snapshot: WorkspaceData) => { workspaceRef.current = snapshot; setWorkspace(snapshot); dirty.current = true; }, []);

  useEffect(() => { void (async () => { const index = await window.aether.workspace.list(); setWorkspaceIndex(index); const first = index.activeWorkspaceId ?? index.workspaces[0]?.id; if (first) await selectWorkspace(first); else await createWorkspace(); })(); }, [createWorkspace, selectWorkspace]);
  useEffect(() => { const timer = window.setInterval(() => void saveCurrent(), 10_000); const flush = () => void saveCurrent(); window.addEventListener('beforeunload', flush); return () => { window.clearInterval(timer); window.removeEventListener('beforeunload', flush); void saveCurrent(); }; }, [saveCurrent]);

  return <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F8FA] text-aether-ink"><TopBar /><div className="flex min-h-0 flex-1"><Sidebar activeNavItem={activeNavItem} activeWorkspaceId={workspace?.id ?? null} onCreateWorkspace={() => void createWorkspace()} onFocusTokyoTrip={() => { setActiveNavItem('canvas'); setFocusRequest((request) => request + 1); }} onHelp={() => setPanel('help')} onNavChange={setActiveNavItem} onRenameWorkspace={(id, name) => { if (workspace?.id === id) snapshotWorkspace({ ...workspace, name }); void window.aether.workspace.rename(id, name).then(refreshIndex); }} onSelectWorkspace={(id) => void selectWorkspace(id)} onSettings={() => setPanel('settings')} workspaces={workspaceIndex.workspaces} /><section className="relative min-w-0 flex-1 bg-[#F8F8FA]">{activeNavItem === 'canvas' ? <ReactFlowProvider><AetherCanvas focusRequest={focusRequest} onWorkspaceSnapshot={snapshotWorkspace} workspace={workspace} /></ReactFlowProvider> : <WorkspacePlaceholder view={activeNavItem} />}{panel === 'settings' && <Panel onClose={() => setPanel(null)} title="Settings"><div className="space-y-5 text-[13px]"><section><h3 className="mb-2 font-semibold">General</h3><p className="text-[#77777D]">Light theme · Canvas background · Default zoom</p></section><section><h3 className="mb-2 font-semibold">AI configuration</h3><p className="text-[#77777D]">Runtime model: GPT-5.6 · Auto-analyze on drop enabled</p></section><section><h3 className="mb-2 font-semibold">Storage</h3><p className="text-[#77777D]">Workspaces are stored locally in your Aether app data directory.</p></section></div></Panel>}{panel === 'help' && <Panel onClose={() => setPanel(null)} title="Getting started"><div className="space-y-3 text-[13px] text-[#66666B]"><p className="flex gap-2"><HelpCircle className="shrink-0 text-[#4A90D9]" size={17} />Drop local files onto the canvas.</p><p>GPT-5.6 reads related files, reveals semantic connections, and assembles a useful dashboard.</p><p><b className="text-[#333337]">Shortcuts:</b> ⌘/Ctrl K search · ⌘/Ctrl N new space · Delete remove selected</p></div></Panel>}</section></div></main>;
}
