import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { HelpCircle, Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import type { WorkspaceData, WorkspaceIndex } from '../shared/types';
import AetherCanvas from './components/Canvas/AetherCanvas';
import Sidebar, { type NavItem } from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import { LocalFilesView, RecentView, SpacesView } from './components/Views/WorkspaceViews';

const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 360;
const SIDEBAR_COLLAPSE_POINT = 190;

function savedSidebarWidth(): number {
  const stored = Number(window.localStorage.getItem('aether:sidebar-width'));
  return Number.isFinite(stored) ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, stored)) : SIDEBAR_MIN;
}

function Panel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="absolute inset-0 z-50 grid place-items-center bg-[#252529]/15 p-5 backdrop-blur-sm"><section className="w-full max-w-[440px] rounded-[16px] border border-[#E6E4E1] bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,0.16)]"><header className="mb-5 flex items-center justify-between"><h2 className="text-[18px] font-semibold">{title}</h2><button className="grid h-8 w-8 place-items-center rounded-lg text-[#77777D] hover:bg-[#F3F2F0]" onClick={onClose} type="button"><X size={18} /></button></header>{children}</section></div>;
}

export default function App() {
  const [activeNavItem, setActiveNavItem] = useState<NavItem>('canvas');
  const [focusRequest, setFocusRequest] = useState(0);
  const [workspaceIndex, setWorkspaceIndex] = useState<WorkspaceIndex>({ workspaces: [], activeWorkspaceId: null });
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [panel, setPanel] = useState<'settings' | 'help' | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(savedSidebarWidth);
  const [sidebarPinned, setSidebarPinned] = useState(() => window.localStorage.getItem('aether:sidebar-open') !== 'false');
  const [sidebarPreview, setSidebarPreview] = useState(false);
  const [sidebarDragHidden, setSidebarDragHidden] = useState(false);
  const dirty = useRef(false);
  const workspaceRef = useRef<WorkspaceData | null>(null);

  const refreshIndex = useCallback(async () => setWorkspaceIndex(await window.aether.workspace.list()), []);
  const saveCurrent = useCallback(async () => { if (!workspaceRef.current || !dirty.current) return; await window.aether.workspace.save(workspaceRef.current); dirty.current = false; await refreshIndex(); }, [refreshIndex]);
  const selectWorkspace = useCallback(async (id: string) => { await saveCurrent(); const loaded = await window.aether.workspace.load(id); workspaceRef.current = loaded; setWorkspace(loaded); setActiveNavItem('canvas'); await refreshIndex(); }, [refreshIndex, saveCurrent]);
  const createWorkspace = useCallback(async () => { await saveCurrent(); const created = await window.aether.workspace.create(); workspaceRef.current = created; setWorkspace(created); setActiveNavItem('canvas'); await refreshIndex(); }, [refreshIndex, saveCurrent]);
  const snapshotWorkspace = useCallback((snapshot: WorkspaceData) => { workspaceRef.current = snapshot; setWorkspace(snapshot); dirty.current = true; }, []);
  const importPinnedFiles = useCallback((filePaths: string[]) => {
    if (!filePaths.length) return;
    setActiveNavItem('canvas');
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('aether:import-paths', { detail: filePaths })));
  }, []);

  useEffect(() => { void (async () => { const index = await window.aether.workspace.list(); setWorkspaceIndex(index); const first = index.activeWorkspaceId ?? index.workspaces[0]?.id; if (first) await selectWorkspace(first); else await createWorkspace(); })(); }, [createWorkspace, selectWorkspace]);
  useEffect(() => { const timer = window.setInterval(() => void saveCurrent(), 10_000); const flush = () => void saveCurrent(); window.addEventListener('beforeunload', flush); return () => { window.clearInterval(timer); window.removeEventListener('beforeunload', flush); void saveCurrent(); }; }, [saveCurrent]);
  useEffect(() => { window.localStorage.setItem('aether:sidebar-width', String(sidebarWidth)); }, [sidebarWidth]);
  useEffect(() => { window.localStorage.setItem('aether:sidebar-open', String(sidebarPinned)); }, [sidebarPinned]);

  const beginSidebarResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSidebarPinned(true);
    setSidebarPreview(false);
    let latestX = event.clientX;
    const resize = (pointerEvent: PointerEvent) => {
      latestX = pointerEvent.clientX;
      if (latestX < SIDEBAR_COLLAPSE_POINT) {
        setSidebarDragHidden(true);
        return;
      }
      setSidebarDragHidden(false);
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, latestX)));
    };
    const finish = () => {
      window.removeEventListener('pointermove', resize);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      if (latestX < SIDEBAR_COLLAPSE_POINT) {
        setSidebarPinned(false);
        setSidebarPreview(false);
      }
      setSidebarDragHidden(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, []);

  const content = activeNavItem === 'canvas'
    ? <ReactFlowProvider><AetherCanvas focusRequest={focusRequest} onWorkspaceSnapshot={snapshotWorkspace} workspace={workspace} /></ReactFlowProvider>
    : activeNavItem === 'spaces'
      ? <SpacesView onCreate={() => void createWorkspace()} onSelect={(id) => void selectWorkspace(id)} workspaces={workspaceIndex.workspaces} />
      : activeNavItem === 'recent'
        ? <RecentView onSelect={(id) => void selectWorkspace(id)} workspaces={workspaceIndex.workspaces} />
        : <LocalFilesView onAddFiles={importPinnedFiles} />;

  const sidebarVisible = (sidebarPinned || sidebarPreview) && !sidebarDragHidden;
  const occupiedSidebarWidth = sidebarPinned && !sidebarDragHidden ? sidebarWidth : 0;

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F8FA] text-aether-ink">
      <TopBar navigationWidth={sidebarPinned && !sidebarDragHidden ? sidebarWidth : 180} />
      <div className="relative flex min-h-0 flex-1">
        <motion.div
          animate={{ width: occupiedSidebarWidth }}
          className="relative z-30 h-full shrink-0"
          data-aether-sidebar-shell
          data-pinned={sidebarPinned}
          initial={false}
          transition={{ duration: sidebarDragHidden ? 0.18 : 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          <AnimatePresence initial={false}>
            {sidebarVisible && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className={sidebarPinned ? 'h-full' : 'absolute inset-y-0 left-0 z-40 h-full shadow-[12px_0_35px_rgba(35,32,40,.12)]'}
                exit={{ opacity: 0, x: -28 }}
                initial={{ opacity: 0, x: -28 }}
                onMouseLeave={() => { if (!sidebarPinned) setSidebarPreview(false); }}
                style={{ width: sidebarWidth }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Sidebar
                  activeNavItem={activeNavItem}
                  activeWorkspaceId={workspace?.id ?? null}
                  onCollapse={() => { setSidebarPinned(false); setSidebarPreview(false); }}
                  onCreateWorkspace={() => void createWorkspace()}
                  onDeleteWorkspace={(id) => void (async () => { await window.aether.workspace.delete(id); await refreshIndex(); const index = await window.aether.workspace.list(); const next = index.activeWorkspaceId ?? index.workspaces[0]?.id; if (next) await selectWorkspace(next); })()}
                  onFocusTokyoTrip={() => { setActiveNavItem('canvas'); setFocusRequest((request) => request + 1); }}
                  onHelp={() => setPanel('help')}
                  onNavChange={setActiveNavItem}
                  onPin={() => { setSidebarPinned(true); setSidebarPreview(false); }}
                  onRenameWorkspace={(id, name) => { if (workspace?.id === id) snapshotWorkspace({ ...workspace, name }); void window.aether.workspace.rename(id, name).then(refreshIndex); }}
                  onResizeStart={beginSidebarResize}
                  onSelectWorkspace={(id) => void selectWorkspace(id)}
                  onSettings={() => setPanel('settings')}
                  preview={!sidebarPinned}
                  width={sidebarWidth}
                  workspaces={workspaceIndex.workspaces}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!sidebarPinned && !sidebarPreview && !sidebarDragHidden && (
          <div
            aria-label="Reveal sidebar"
            className="group absolute inset-y-0 left-0 z-40 w-3 cursor-e-resize"
            onFocus={() => setSidebarPreview(true)}
            onMouseEnter={() => setSidebarPreview(true)}
            role="button"
            tabIndex={0}
          >
            <span className="absolute left-0 top-1/2 h-16 w-[3px] -translate-y-1/2 rounded-r-full bg-[#9B72CF]/25 transition group-hover:bg-[#9B72CF]/50" />
          </div>
        )}

        <section className="relative min-w-0 flex-1 bg-[#F8F8FA]">
          {content}
          {panel === 'settings' && <Panel onClose={() => setPanel(null)} title="Settings"><div className="space-y-5 text-[13px]"><section><h3 className="mb-2 font-semibold">General</h3><p className="text-[#77777D]">Light theme · Canvas background · Default zoom</p></section><section><h3 className="mb-2 font-semibold">AI configuration</h3><p className="text-[#77777D]">Runtime model: GPT-5.6 · Auto-analyze on drop enabled</p></section></div></Panel>}
        </section>
      </div>
    </main>
  );
}
