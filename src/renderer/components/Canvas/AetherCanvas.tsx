import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow, useEdgesState, useNodesState, useReactFlow, useViewport, type Edge, type EdgeTypes, type NodeTypes } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minus, Plus } from 'lucide-react';

import type { AnalyzedFile, DashboardAiInsight, DashboardInsightKind, DashboardPlan, DashboardState, FileDeletedEvent, FileSyncChange, FileSyncStatus, RelationshipDiscovery, RelationshipType, SuggestedCluster, WorkspaceData } from '../../../shared/types';
import { calculateAutoLayout, categoriesForFile } from '../../hooks/useAutoLayout';
import { useLiveFileSync } from '../../hooks/useLiveFileSync';
import SmartSuggestion from './SmartSuggestion';
import CanvasContextMenu, { type CanvasMenuTarget } from './CanvasContextMenu';
import FileQuickPreview from './FileQuickPreview';
import SemanticRibbonEdge from './edges/SemanticRibbonEdge';
import { setRibbonInteraction } from './edges/RibbonInteractionContext';
import FileCardNode, { type FileCardNodeType } from './nodes/FileCardNode';
import HubNode, { type HubNodeType } from './nodes/HubNode';
import SummaryCardNode, { type SummaryCardNodeType } from './nodes/SummaryCardNode';
import EmptyCanvasState from './EmptyCanvasState';

type CanvasNode = FileCardNodeType | HubNodeType | SummaryCardNodeType;
type Suggestion = { fileId: string; category: string; clusterName: string };
type ContextMenu = { x: number; y: number; target: CanvasMenuTarget };

const initialNodes: CanvasNode[] = [];
const RIBBON_COLORS: Record<RelationshipType, string> = { dates: '#4A90D9', cost: '#34A853', place: '#EA4335', tasks: '#9B72CF' };

function readableError(error: unknown): string {
  if (!(error instanceof Error)) return 'Aether could not analyze this file.';
  return error.message.replace(/^Error invoking remote method '[^']+':\s*/i, '').replace(/^Error:\s*/i, '').trim() || 'Aether could not analyze this file.';
}

function CanvasControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  const button = 'grid h-7 w-7 place-items-center text-[#4C4C51] transition-colors hover:bg-[#F0EFED]';
  return <Panel className="!bottom-5 !left-4 !m-0" position="bottom-left"><div className="flex h-7 items-stretch overflow-hidden rounded-[8px] border border-[#DEDCD9] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"><button aria-label="Zoom out" className={button} onClick={() => zoomOut({ duration: 180 })} type="button"><Minus size={14} /></button><div className="grid min-w-[52px] place-items-center border-x border-[#E5E3E0] px-2 text-[12px] font-medium tabular-nums text-[#55555A]">{Math.round(zoom * 100)}%</div><button aria-label="Zoom in" className={button} onClick={() => zoomIn({ duration: 180 })} type="button"><Plus size={14} /></button><button aria-label="Fit canvas to content" className={`${button} border-l border-[#E5E3E0]`} onClick={() => fitView({ duration: 300, padding: 0.25 })} type="button"><Maximize2 size={14} /></button></div></Panel>;
}

export default function AetherCanvas({ focusRequest = 0, workspace, onWorkspaceSnapshot }: { focusRequest?: number; workspace: WorkspaceData | null; onWorkspaceSnapshot: (workspace: WorkspaceData) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cluster, setCluster] = useState<SuggestedCluster | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [semanticFocus, setSemanticFocus] = useState<RelationshipType | null>(null);
  const [isCanvasNodeDragging, setIsCanvasNodeDragging] = useState(false);
  const [quickPreview, setQuickPreview] = useState<AnalyzedFile | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const analyzedFiles = useRef(new Map<string, AnalyzedFile>());
  const pendingFiles = useRef(new Map<string, AnalyzedFile>());
  const candidateIds = useRef(new Set<string>());
  const nodesRef = useRef<CanvasNode[]>([]);
  const clusterRef = useRef<SuggestedCluster | null>(null);
  const relationshipRequest = useRef(0);
  const applyDiscoveryRef = useRef<(files?: Map<string, AnalyzedFile>) => Promise<void>>(async () => undefined);
  const workspaceRef = useRef<WorkspaceData | null>(workspace);
  const hydratedWorkspaceId = useRef<string | null>(null);
  const workspaceReady = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { fitView, getViewport, screenToFlowPosition, setCenter, setViewport } = useReactFlow();

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { clusterRef.current = cluster; }, [cluster]);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);
  useEffect(() => {
    if (!workspace || hydratedWorkspaceId.current === workspace.id) return;
    hydratedWorkspaceId.current = workspace.id;
    workspaceReady.current = false;
    analyzedFiles.current = new Map(workspace.analyzedFiles.map((file) => [file.id, file]));
    setNodes(workspace.nodes as CanvasNode[]);
    setEdges(workspace.edges as Edge[]);
    requestAnimationFrame(() => { setViewport(workspace.viewport); workspaceReady.current = true; });
  }, [setEdges, setNodes, setViewport, workspace]);
  useEffect(() => {
    const active = workspaceRef.current;
    if (!active || !workspaceReady.current || hydratedWorkspaceId.current !== active.id) return;
    onWorkspaceSnapshot({ ...active, nodes, edges, analyzedFiles: [...analyzedFiles.current.values()], viewport: getViewport(), fileCount: analyzedFiles.current.size });
  }, [edges, getViewport, nodes, onWorkspaceSnapshot]);
  useEffect(() => {
    if (focusRequest === 0) return;
    const frame = requestAnimationFrame(() => fitView({ duration: 420, padding: 0.2 }));
    return () => cancelAnimationFrame(frame);
  }, [fitView, focusRequest]);
  useEffect(() => {
    if (!dropError) return;
    const timeout = window.setTimeout(() => setDropError(null), 4_500);
    return () => window.clearTimeout(timeout);
  }, [dropError]);
  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 2_000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);
  useEffect(() => {
    setRibbonInteraction({ focus: semanticFocus, isDragging: isCanvasNodeDragging });
  }, [isCanvasNodeDragging, semanticFocus]);
  useEffect(() => {
    const start = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.react-flow__node') && !target.closest('[data-id^="hub:"]')) setIsCanvasNodeDragging(true);
    };
    const stop = () => setIsCanvasNodeDragging(false);
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('pointerup', stop, true);
    window.addEventListener('pointercancel', stop, true);
    return () => { window.removeEventListener('pointerdown', start, true); window.removeEventListener('pointerup', stop, true); window.removeEventListener('pointercancel', stop, true); };
  }, []);

  const nodeTypes = useMemo<NodeTypes>(() => ({ fileCard: FileCardNode, hub: HubNode, summaryCard: SummaryCardNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ semanticRibbon: SemanticRibbonEdge }), []);
  const importPaths = useCallback(async (paths: string[]) => {
    const base = screenToFlowPosition({ x: 460, y: 240 });
    const entries = await Promise.all(paths.map(async (filePath, index) => { const metadata = await window.aether.getFileMetadata(filePath); const id = `file:${crypto.randomUUID()}`; return { id, filePath, node: { id, type: 'fileCard' as const, position: { x: base.x + index * 28, y: base.y + index * 72 }, data: { fileName: metadata.name, mimeType: metadata.type, filePath, status: 'loading' as const, analysis: null, thumbnailUrl: null, errorMessage: null, syncStatus: 'pending' as const, watchEnabled: true } } }; }));
    setNodes((current) => [...current, ...entries.map((entry) => entry.node)]);
    await Promise.all(entries.map(async ({ id, filePath }) => { const [analysis, thumbnailUrl] = await Promise.all([window.aether.analyzeFile(filePath, id), window.aether.getThumbnail(filePath)]); setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'ready', analysis, thumbnailUrl, errorMessage: null, syncStatus: 'synced', syncCheckedAt: Date.now() } } as FileCardNodeType : node)); analyzedFiles.current.set(id, analysis); }));
    await applyDiscoveryRef.current();
  }, [screenToFlowPosition, setNodes]);

  useEffect(() => {
    const open = async () => { const selected = await window.aether.openFileDialog(); if (!selected.canceled && selected.filePaths.length) await importPaths(selected.filePaths); };
    const importSelected = (event: Event) => { const paths = (event as CustomEvent<string[]>).detail; if (Array.isArray(paths) && paths.length) void importPaths(paths); };
    const search = (event: Event) => { const query = String((event as CustomEvent<string>).detail ?? '').toLowerCase(); setNodes((current) => current.map((node) => node.type === 'fileCard' ? { ...node, hidden: Boolean(query) && !node.data.fileName.toLowerCase().includes(query) && !(node.data.analysis?.summary ?? '').toLowerCase().includes(query) } : node)); };
    window.addEventListener('aether:open-dialog', open); window.addEventListener('aether:import-paths', importSelected); window.addEventListener('aether:search', search);
    return () => { window.removeEventListener('aether:open-dialog', open); window.removeEventListener('aether:import-paths', importSelected); window.removeEventListener('aether:search', search); };
  }, [importPaths, setNodes]);

  const applyDiscovery = useCallback(async (files = analyzedFiles.current) => {
    if (files.size < 2) return;
    const requestId = ++relationshipRequest.current;
    const discovery: RelationshipDiscovery = await window.aether.findRelationships([...files.keys()]);
    if (requestId !== relationshipRequest.current) return;
    const allFiles = [...files.values()];
    const firstLocation = allFiles.flatMap((file) => file.entities.locations).find((location) => location.type === 'city')?.name;
    const firstDate = allFiles.flatMap((file) => file.entities.dates)[0]?.display;
    const fallbackCluster: SuggestedCluster = {
      name: firstLocation ? `${firstLocation} Trip` : 'Aether Space',
      dateRange: firstDate || 'Generated workspace',
      icon: '',
      category: allFiles[0]?.category ?? 'personal',
    };
    const activeCluster = discovery.shouldCluster && discovery.suggestedCluster ? discovery.suggestedCluster : fallbackCluster;
    const generatedWorkspaceName = discovery.dashboard?.title || activeCluster.name;
    if (workspace?.name === 'Untitled Space' && allFiles.length >= 2 && generatedWorkspaceName !== 'Untitled Space') {
      onWorkspaceSnapshot({ ...workspace, name: generatedWorkspaceName, icon: activeCluster.category === 'travel' ? 'map-pin' : workspace.icon, iconColor: activeCluster.category === 'travel' ? '#EA4335' : workspace.iconColor });
    }
    const shouldShowSummary = allFiles.length >= 2;
    setCluster(activeCluster);
    const layout = calculateAutoLayout(allFiles);
    const summaryId = 'summary:active';
    requestAnimationFrame(() => setNodes((current) => {
      const fileNodes = current.filter((node): node is FileCardNodeType => node.type === 'fileCard');
      const laidOutFiles = fileNodes.map((node) => ({ ...node, position: layout.filePositions.get(node.id) ?? node.position, style: { ...node.style, willChange: 'transform' } }));
      if (!shouldShowSummary) return laidOutFiles;
      const hubNodes: HubNodeType[] = layout.hubs.map((hub) => ({ id: `hub:${hub.type}`, type: 'hub', draggable: false, position: { x: hub.x, y: hub.y }, data: { relationshipType: hub.type, delay: hub.delay } }));
      const previousSummary = current.find((node): node is SummaryCardNodeType => node.id === summaryId && node.type === 'summaryCard');
      const dashboardPlan: DashboardPlan | undefined = discovery.dashboard ?? previousSummary?.data.dashboardPlan;
      return [...laidOutFiles, ...hubNodes, { id: summaryId, type: 'summaryCard', position: layout.summaryPosition, style: { willChange: 'transform' }, data: { cluster: dashboardPlan ? { ...activeCluster, name: dashboardPlan.title || activeCluster.name, dateRange: dashboardPlan.subtitle || activeCluster.dateRange, category: dashboardPlan.category || activeCluster.category } : previousSummary?.data.cluster ?? activeCluster, files: allFiles, dashboard: previousSummary?.data.dashboard, dashboardPlan, assemblyDelay: 1.2 } }];
    }));
    if (!shouldShowSummary) { setEdges([]); return; }
    const fileToHub: Edge[] = allFiles.flatMap((file) => categoriesForFile(file).map((type, index) => ({ id: `file:${file.id}:hub:${type}`, source: file.id, target: `hub:${type}`, type: 'semanticRibbon', data: { relationshipType: type, phase: 'file', index }, style: { stroke: RIBBON_COLORS[type] } })));
    const hubToSummary: Edge[] = layout.hubs.map((hub, index) => ({ id: `hub:${hub.type}:summary`, source: `hub:${hub.type}`, target: summaryId, targetHandle: `summary-${hub.type}`, type: 'semanticRibbon', data: { relationshipType: hub.type, phase: 'summary', index }, style: { stroke: RIBBON_COLORS[hub.type] } }));
    setEdges([...fileToHub, ...hubToSummary]);
  }, [onWorkspaceSnapshot, setEdges, setNodes, workspace]);
  useEffect(() => { applyDiscoveryRef.current = applyDiscovery; }, [applyDiscovery]);

  const updateSyncStatus = useCallback((fileId: string, syncStatus: FileSyncStatus, syncCheckedAt?: number) => {
    setNodes((current) => current.map((node) => node.id === fileId && node.type === 'fileCard' ? { ...node, data: { ...node.data, syncStatus, syncCheckedAt: syncCheckedAt ?? node.data.syncCheckedAt } } as FileCardNodeType : node));
  }, [setNodes]);
  const acceptLiveAnalysis = useCallback((fileId: string, analysis: AnalyzedFile, thumbnailUrl: string | null, syncChange?: FileSyncChange) => {
    analyzedFiles.current.set(fileId, analysis);
    setQuickPreview((current) => current?.id === fileId ? analysis : current);
    setNodes((current) => current.map((node) => {
      if (node.id === fileId && node.type === 'fileCard') {
        return { ...node, data: { ...node.data, status: 'ready', analysis, thumbnailUrl, errorMessage: null, syncStatus: 'synced', syncCheckedAt: Date.now(), syncChange, syncChangedAt: Date.now() } } as FileCardNodeType;
      }
      // Existing module structure can consume the refreshed grounded values
      // immediately; relationship/dashboard replanning continues as a batch.
      if (node.type === 'summaryCard') {
        return { ...node, data: { ...node.data, files: node.data.files.map((file) => file.id === fileId ? analysis : file) } } as SummaryCardNodeType;
      }
      return node;
    }));
    window.setTimeout(() => setNodes((current) => current.map((node) => node.id === fileId && node.type === 'fileCard' ? { ...node, data: { ...node.data, syncChange: undefined, syncChangedAt: undefined } } as FileCardNodeType : node)), 4_000);
  }, [setNodes]);
  const handleSourceDeleted = useCallback((event: FileDeletedEvent) => {
    setNodes((current) => current.map((node) => node.id === event.fileId && node.type === 'fileCard' ? { ...node, data: { ...node.data, syncStatus: 'deleted', syncCheckedAt: event.timestamp } } as FileCardNodeType : node));
    setToastMessage(`${event.filePath.split(/[\\/]/).pop() ?? 'Source file'} is no longer available`);
  }, [setNodes]);
  const watchedSources = useMemo(() => hydratedWorkspaceId.current === workspace?.id ? nodes.filter((node): node is FileCardNodeType => node.type === 'fileCard' && Boolean(node.data.analysis) && node.data.watchEnabled !== false).map((node) => ({ id: node.id, filePath: node.data.filePath, contentHash: node.data.analysis?.contentHash })) : [], [nodes, workspace?.id]);
  useLiveFileSync({
    workspaceId: workspace?.id,
    sources: watchedSources,
    analyzedFiles: [...analyzedFiles.current.values()],
    getFile: (fileId) => analyzedFiles.current.get(fileId),
    onStatus: updateSyncStatus,
    onAnalysis: acceptLiveAnalysis,
    onDeleted: handleSourceDeleted,
    onBatchComplete: () => applyDiscoveryRef.current(),
    onMessage: setToastMessage,
  });

  const previewFile = useCallback((id: string) => { const file = analyzedFiles.current.get(id); if (file) setQuickPreview(file); }, []);
  const openOriginal = useCallback(async (id: string) => { const file = analyzedFiles.current.get(id); if (!file) return; try { await window.aether.openOriginalFile(file.filePath); } catch (error) { setDropError(readableError(error)); } }, []);
  const revealOriginal = useCallback(async (id: string) => { const file = analyzedFiles.current.get(id); if (!file) return; try { await window.aether.revealFile(file.filePath); } catch (error) { setDropError(readableError(error)); } }, []);
  const reanalyzeFile = useCallback(async (id: string) => {
    const fileNode = nodesRef.current.find((node): node is FileCardNodeType => node.id === id && node.type === 'fileCard');
    if (!fileNode) return;
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'loading', errorMessage: null } } as FileCardNodeType : node));
    try {
      const [analysis, thumbnailUrl] = await Promise.all([window.aether.analyzeFile(fileNode.data.filePath, id), window.aether.getThumbnail(fileNode.data.filePath)]);
      analyzedFiles.current.set(id, analysis); setQuickPreview(analysis);
      setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'ready', analysis, thumbnailUrl, errorMessage: null, syncStatus: 'synced', syncCheckedAt: Date.now() } } as FileCardNodeType : node));
      await applyDiscoveryRef.current();
    } catch (error) { const message = readableError(error); setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'error', errorMessage: message } } as FileCardNodeType : node)); setDropError(message); }
  }, [setNodes]);
  const removeFromCanvas = useCallback(async (id: string) => {
    const file = analyzedFiles.current.get(id);
    if (file && !window.confirm(`Remove “${file.fileName}” from this canvas? The original file stays untouched.`)) return;
    if (file) await window.aether.fileWatcher.unwatch(file.filePath, id);
    analyzedFiles.current.delete(id); pendingFiles.current.delete(id); candidateIds.current.delete(id); setQuickPreview(null);
    if (analyzedFiles.current.size < 2) { setCluster(null); setEdges([]); setNodes((current) => current.filter((node) => node.type === 'fileCard' && node.id !== id)); return; }
    setNodes((current) => current.filter((node) => node.id !== id));
    await applyDiscoveryRef.current();
  }, [setEdges, setNodes]);
  useEffect(() => {
    const relocate = (event: Event) => {
      const oldPath = String((event as CustomEvent<string>).detail ?? '');
      const node = nodesRef.current.find((item): item is FileCardNodeType => item.type === 'fileCard' && item.data.filePath === oldPath);
      if (!node) return;
      void window.aether.openFileDialog().then(async (selection) => {
        const filePath = selection.filePaths[0];
        if (selection.canceled || !filePath) return;
        updateSyncStatus(node.id, 'syncing', Date.now());
        try {
          const metadata = await window.aether.getFileMetadata(filePath);
          const [analysis, thumbnailUrl] = await Promise.all([window.aether.analyzeFile(filePath, node.id), window.aether.getThumbnail(filePath)]);
          await window.aether.fileWatcher.unwatch(oldPath, node.id);
          analyzedFiles.current.set(node.id, analysis);
          setNodes((current) => current.map((item) => item.id === node.id && item.type === 'fileCard' ? { ...item, data: { ...item.data, filePath, fileName: metadata.name, mimeType: metadata.type, analysis, thumbnailUrl, status: 'ready', errorMessage: null, syncStatus: 'synced', syncCheckedAt: Date.now(), watchEnabled: true } } as FileCardNodeType : item));
          await applyDiscoveryRef.current();
          setToastMessage(`${metadata.name} reconnected`);
        } catch (error) { setDropError(readableError(error)); updateSyncStatus(node.id, 'deleted'); }
      });
    };
    const keepCached = (event: Event) => {
      const filePath = String((event as CustomEvent<string>).detail ?? '');
      const node = nodesRef.current.find((item): item is FileCardNodeType => item.type === 'fileCard' && item.data.filePath === filePath);
      if (!node) return;
      void window.aether.fileWatcher.unwatch(filePath, node.id);
      setNodes((current) => current.map((item) => item.id === node.id && item.type === 'fileCard' ? { ...item, data: { ...item.data, syncStatus: 'unwatched', watchEnabled: false } } as FileCardNodeType : item));
      setToastMessage('Cached analysis kept');
    };
    const removeRequested = (event: Event) => {
      const filePath = String((event as CustomEvent<string>).detail ?? '');
      const node = nodesRef.current.find((item): item is FileCardNodeType => item.type === 'fileCard' && item.data.filePath === filePath);
      if (node) void removeFromCanvas(node.id);
    };
    window.addEventListener('aether:file-relocate', relocate);
    window.addEventListener('aether:file-keep-cached', keepCached);
    window.addEventListener('aether:file-remove-request', removeRequested);
    return () => { window.removeEventListener('aether:file-relocate', relocate); window.removeEventListener('aether:file-keep-cached', keepCached); window.removeEventListener('aether:file-remove-request', removeRequested); };
  }, [removeFromCanvas, setNodes, updateSyncStatus]);
  const highlightFlow = useCallback((type: RelationshipType) => setSemanticFocus(type), []);
  const reorganizeCanvas = useCallback(async () => { setSemanticFocus(null); await applyDiscoveryRef.current(); }, []);
  const focusSourceFile = useCallback((id: string) => {
    previewFile(id);
    const node = nodesRef.current.find((item) => item.id === id);
    if (node) setCenter(node.position.x + 110, node.position.y + 80, { duration: 360, zoom: 1.05 });
  }, [previewFile, setCenter]);
  useEffect(() => {
    const focusFile = (event: Event) => focusSourceFile(String((event as CustomEvent<string>).detail ?? ''));
    const focusLocation = (event: Event) => {
      const location = String((event as CustomEvent<string>).detail ?? '');
      const file = [...analyzedFiles.current.values()].find((item) => item.entities.locations.some((entry) => entry.name === location));
      if (file) focusSourceFile(file.id);
    };
    const togglePackingTask = (event: Event) => {
      const detail = (event as CustomEvent<{ fileId?: string; taskIndex?: number }>).detail;
      if (!detail?.fileId || typeof detail.taskIndex !== 'number') return;
      const current = analyzedFiles.current.get(detail.fileId);
      const displayData = current?.smartPreview.displayData;
      const currentItems = Array.isArray(displayData?.items) ? displayData.items as Array<{ text?: string; checked?: boolean }> : [];
      if (!current || !currentItems[detail.taskIndex] || currentItems[detail.taskIndex].checked) return;
      const items = currentItems.map((item, index) => index === detail.taskIndex ? { ...item, checked: true } : item);
      const checkedCount = items.filter((item) => item.checked).length;
      const taskText = items[detail.taskIndex]?.text;
      const next: AnalyzedFile = { ...current, entities: { ...current.entities, tasks: current.entities.tasks.map((task) => task.item === taskText ? { ...task, completed: true } : task) }, smartPreview: { ...current.smartPreview, displayData: { ...current.smartPreview.displayData, items, checkedCount, totalCount: items.length } } };
      analyzedFiles.current.set(next.id, next);
      setNodes((currentNodes) => currentNodes.map((node) => {
        if (node.type === 'fileCard' && node.id === next.id) return { ...node, data: { ...node.data, analysis: next } } as FileCardNodeType;
        if (node.type === 'summaryCard') return { ...node, data: { ...node.data, files: node.data.files.map((file) => file.id === next.id ? next : file) } } as SummaryCardNodeType;
        return node;
      }));
    };
    const patchDashboard = (event: Event) => {
      const detail = (event as CustomEvent<{ summaryId?: string; patch?: Partial<DashboardState> }>).detail;
      if (!detail?.summaryId || !detail.patch) return;
      setNodes((current) => current.map((node) => node.id === detail.summaryId && node.type === 'summaryCard'
        ? { ...node, data: { ...node.data, dashboard: { ...node.data.dashboard, ...detail.patch } } } as SummaryCardNodeType
        : node));
    };
    const requestInsights = (event: Event) => {
      const detail = (event as CustomEvent<{ summaryId?: string; kind?: DashboardInsightKind; context?: string }>).detail;
      if (!detail?.summaryId || !detail.kind || typeof detail.context !== 'string') return;
      const currentSummary = nodesRef.current.find((node): node is SummaryCardNodeType => node.id === detail.summaryId && node.type === 'summaryCard');
      if (currentSummary?.data.dashboard?.aiCacheInputs?.[detail.kind] === detail.context && currentSummary.data.dashboard.aiCache?.[detail.kind]?.length) {
        setToastMessage('Showing saved AI insights');
        return;
      }
      setNodes((current) => current.map((node) => node.id === detail.summaryId && node.type === 'summaryCard'
        ? { ...node, data: { ...node.data, dashboard: { ...node.data.dashboard, aiLoading: detail.kind } } } as SummaryCardNodeType
        : node));
      void window.aether.getDashboardInsights(detail.kind, detail.context).then((insights) => {
        setNodes((current) => current.map((node) => node.id === detail.summaryId && node.type === 'summaryCard'
          ? { ...node, data: { ...node.data, dashboard: { ...node.data.dashboard, aiLoading: undefined, aiCache: { ...node.data.dashboard?.aiCache, [detail.kind as DashboardInsightKind]: insights as DashboardAiInsight[] }, aiCacheInputs: { ...node.data.dashboard?.aiCacheInputs, [detail.kind as DashboardInsightKind]: detail.context } } } } as SummaryCardNodeType
          : node));
      }).catch(() => {
        setNodes((current) => current.map((node) => node.id === detail.summaryId && node.type === 'summaryCard'
          ? { ...node, data: { ...node.data, dashboard: { ...node.data.dashboard, aiLoading: undefined } } } as SummaryCardNodeType
          : node));
        setToastMessage('Couldn’t load insights right now');
      });
    };
    const renameCluster = (event: Event) => {
      const detail = (event as CustomEvent<{ summaryId?: string; name?: string }>).detail;
      const name = detail?.name?.trim();
      if (!detail?.summaryId || !name) return;
      setNodes((current) => current.map((node) => node.id === detail.summaryId && node.type === 'summaryCard'
        ? { ...node, data: { ...node.data, cluster: { ...node.data.cluster, name } } } as SummaryCardNodeType
        : node));
      setCluster((current) => current ? { ...current, name } : current);
      const active = workspaceRef.current;
      if (active) onWorkspaceSnapshot({ ...active, name });
      setToastMessage('Workspace renamed');
    };
    const removeCluster = (event: Event) => {
      const summaryId = String((event as CustomEvent<string>).detail ?? 'summary:active');
      if (!window.confirm('Remove this generated dashboard? Your original file cards will remain on the canvas.')) return;
      setNodes((current) => current.filter((node) => node.id !== summaryId && node.type !== 'hub'));
      setEdges([]);
      setCluster(null);
      setToastMessage('Dashboard removed');
    };
    const exportBudget = (event: Event) => {
      const detail = (event as CustomEvent<{ currency?: string; rows?: Array<{ category: string; estimate: number; actual?: number }> }>).detail;
      if (!detail?.rows) return;
      const escape = (input: string | number) => `"${String(input).replaceAll('"', '""')}"`;
      const contents = ['Category,Estimate,Actual,Status', ...detail.rows.map((row) => [escape(row.category), row.estimate, row.actual ?? '', row.actual === undefined ? 'Upcoming' : row.actual > row.estimate ? 'Over budget' : 'Paid'].join(','))].join('\n');
      void window.aether.saveTextFile(`${(clusterRef.current?.name ?? 'aether-space').replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()}-budget.csv`, contents).then((saved) => setToastMessage(saved ? 'Budget exported' : 'Export canceled'));
    };
    const exportSummary = (event: Event) => {
      const detail = (event as CustomEvent<{ cluster?: SuggestedCluster; files?: AnalyzedFile[]; budgetRows?: Array<{ category: string; estimate: number; actual?: number }>; packingItems?: Array<{ text: string; checked: boolean }>; locations?: Array<{ name: string }> }>).detail;
      if (!detail?.cluster) return;
      const checked = detail.packingItems?.filter((item) => item.checked).map((item) => `✅ ${item.text}`) ?? [];
      const unchecked = detail.packingItems?.filter((item) => !item.checked).map((item) => `⬜ ${item.text}`) ?? [];
      const contents = [`# ${detail.cluster.name}${detail.cluster.dateRange ? ` (${detail.cluster.dateRange})` : ''}`, '', '## Source files', ...(detail.files?.map((file) => `- ${file.title}: ${file.summary}`) ?? []), '', '## Budget', ...(detail.budgetRows?.map((row) => `- ${row.category}: ${row.actual ?? row.estimate}`) ?? ['No budget details']), '', `## Checklist (${checked.length}/${detail.packingItems?.length ?? 0} complete)`, ...checked, ...unchecked, '', '## Locations', ...(detail.locations?.map((location) => `- ${location.name}`) ?? ['No locations identified'])].join('\n');
      void window.aether.saveTextFile(`${detail.cluster.name.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()}-summary.md`, contents).then((saved) => setToastMessage(saved ? 'Summary exported' : 'Export canceled'));
    };
    const summaryFocus = (event: Event) => setSemanticFocus((event as CustomEvent<RelationshipType | null>).detail ?? null);
    const highlightSources = (event: Event) => {
      const ids = (event as CustomEvent<string[]>).detail;
      if (!Array.isArray(ids) || !ids.length) return;
      focusSourceFile(ids[0]);
      setToastMessage(`${ids.length} source files connected to this dashboard`);
    };
    const showToast = (event: Event) => setToastMessage(String((event as CustomEvent<string>).detail ?? 'Saved'));
    const revealSummaryDetail = (event: Event) => {
      const summaryId = String((event as CustomEvent<string>).detail ?? '');
      const node = nodesRef.current.find((item) => item.id === summaryId);
      if (!node) return;
      const currentZoom = getViewport().zoom;
      setCenter(node.position.x + 390, node.position.y + 420, { duration: 380, zoom: Math.min(currentZoom, 0.95) });
    };
    window.addEventListener('aether:focus-source-file', focusFile); window.addEventListener('aether:focus-source-location', focusLocation); window.addEventListener('aether:toggle-packing-task', togglePackingTask); window.addEventListener('aether:dashboard-state', patchDashboard); window.addEventListener('aether:dashboard-insights', requestInsights); window.addEventListener('aether:rename-cluster', renameCluster); window.addEventListener('aether:remove-cluster', removeCluster); window.addEventListener('aether:export-budget', exportBudget); window.addEventListener('aether:export-summary', exportSummary); window.addEventListener('aether:summary-section-focus', summaryFocus); window.addEventListener('aether:highlight-sources', highlightSources); window.addEventListener('aether:toast', showToast); window.addEventListener('aether:reveal-summary-detail', revealSummaryDetail);
    return () => { window.removeEventListener('aether:focus-source-file', focusFile); window.removeEventListener('aether:focus-source-location', focusLocation); window.removeEventListener('aether:toggle-packing-task', togglePackingTask); window.removeEventListener('aether:dashboard-state', patchDashboard); window.removeEventListener('aether:dashboard-insights', requestInsights); window.removeEventListener('aether:rename-cluster', renameCluster); window.removeEventListener('aether:remove-cluster', removeCluster); window.removeEventListener('aether:export-budget', exportBudget); window.removeEventListener('aether:export-summary', exportSummary); window.removeEventListener('aether:summary-section-focus', summaryFocus); window.removeEventListener('aether:highlight-sources', highlightSources); window.removeEventListener('aether:toast', showToast); window.removeEventListener('aether:reveal-summary-detail', revealSummaryDetail); };
  }, [focusSourceFile, getViewport, onWorkspaceSnapshot, setCenter, setEdges, setNodes]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsDragActive(true); }, []);
  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => { if (event.currentTarget.contains(event.relatedTarget as globalThis.Node | null)) return; setIsDragActive(false); }, []);

  const onDrop = useCallback(async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); setIsDragActive(false); setDropError(null);
    const pinnedFilePath = event.dataTransfer.getData('application/x-aether-file-path');
    if (pinnedFilePath) { await importPaths([pinnedFilePath]); return; }
    const droppedFiles = Array.from(event.dataTransfer.files); if (!droppedFiles.length) return;
    const basePosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const clusterFileNodes = nodesRef.current.filter((node): node is FileCardNodeType => node.type === 'fileCard' && analyzedFiles.current.has(node.id));
    const nearCluster = Boolean(clusterRef.current && clusterFileNodes.some((node) => Math.hypot(node.position.x - basePosition.x, node.position.y - basePosition.y) < 240));
    const registrations = await Promise.allSettled(droppedFiles.map(async (file, index) => {
      const filePath = await window.aether.getDroppedFilePath(file); const metadata = await window.aether.getFileMetadata(filePath); const id = `file:${crypto.randomUUID()}`;
      return { id, filePath, nearCluster, node: { id, type: 'fileCard' as const, position: { x: basePosition.x + index * 24, y: basePosition.y + index * 64 }, style: { willChange: 'transform' }, data: { fileName: metadata.name, mimeType: metadata.type, filePath: metadata.path, status: 'loading' as const, analysis: null, thumbnailUrl: null, errorMessage: null, syncStatus: 'pending' as const, watchEnabled: true } } };
    }));
    const accepted = registrations.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    if (accepted.length) setNodes((current) => [...current, ...accepted.map(({ node }) => node)]);
    const failed = registrations.find((result): result is PromiseRejectedResult => result.status === 'rejected'); if (failed) setDropError(readableError(failed.reason));
    await Promise.allSettled(accepted.map(async ({ filePath, id, nearCluster: candidate }) => {
      try {
        const [analysis, thumbnailUrl] = await Promise.all([window.aether.analyzeFile(filePath, id), window.aether.getThumbnail(filePath)]);
        setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'ready', analysis, thumbnailUrl, errorMessage: null, syncStatus: 'synced', syncCheckedAt: Date.now() } } as FileCardNodeType : node));
        if (candidate && clusterRef.current) { pendingFiles.current.set(id, analysis); candidateIds.current.add(id); setSuggestion({ fileId: id, category: analysis.category, clusterName: clusterRef.current.name }); return; }
        analyzedFiles.current.set(id, analysis); await applyDiscovery();
      } catch (error) { const message = readableError(error); setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'error', errorMessage: message } } as FileCardNodeType : node)); setDropError(message); }
    }));
  }, [applyDiscovery, importPaths, screenToFlowPosition, setNodes]);

  const connectSuggestion = useCallback(async () => { if (!suggestion) return; const file = pendingFiles.current.get(suggestion.fileId); if (file) { analyzedFiles.current.set(file.id, file); pendingFiles.current.delete(file.id); candidateIds.current.delete(file.id); await applyDiscovery(); } setSuggestion(null); }, [applyDiscovery, suggestion]);
  const keepSeparate = useCallback(() => { if (suggestion) { pendingFiles.current.delete(suggestion.fileId); candidateIds.current.delete(suggestion.fileId); } setSuggestion(null); }, [suggestion]);

  return <div className="relative h-full w-full bg-[#F4F1E9]" onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} ref={canvasRef}>
    <ReactFlow colorMode="light" defaultViewport={{ x: 70, y: 45, zoom: 1 }} deleteKeyCode={['Backspace', 'Delete']} edgeTypes={edgeTypes} edges={edges} fitViewOptions={{ padding: 0.25 }} maxZoom={2.2} minZoom={0.25} nodeTypes={nodeTypes} nodes={nodes} onNodeClick={(_event, node) => { if (node.type === 'hub') highlightFlow((node as HubNodeType).data.relationshipType); }} onNodeContextMenu={(event, node) => { event.preventDefault(); const bounds = canvasRef.current?.getBoundingClientRect(); const analysis = node.type === 'fileCard' ? (node as FileCardNodeType).data.analysis : null; const relationshipType = node.type === 'hub' ? (node as HubNodeType).data.relationshipType : analysis ? categoriesForFile(analysis)[0] : undefined; setContextMenu({ x: event.clientX - (bounds?.left ?? 0), y: event.clientY - (bounds?.top ?? 0), target: { id: node.id, type: node.type as CanvasMenuTarget['type'], relationshipType } }); }} onNodeDoubleClick={(_event, node) => { if (node.type === 'fileCard') previewFile(node.id); if (node.type === 'hub') highlightFlow((node as HubNodeType).data.relationshipType); }} onPaneClick={() => { setContextMenu(null); setSemanticFocus(null); }} onEdgesChange={onEdgesChange} onNodesChange={onNodesChange} panOnDrag panOnScroll proOptions={{ hideAttribution: true }} selectionOnDrag={false} zoomOnDoubleClick={false}>
      <Background bgColor="#F4F1E9" color="#DBD5C6" gap={18} size={1} variant={BackgroundVariant.Dots} />
      <MiniMap className="!bottom-5 !right-5 !m-0 !h-[112px] !w-[176px] !rounded-[13px] !border !border-[#D3D3D8] !bg-white/90 !shadow-[0_3px_14px_rgba(33,33,36,0.08)]" maskColor="rgba(242, 242, 245, 0.58)" nodeBorderRadius={5} nodeColor={(node) => node.type === 'summaryCard' ? '#E7A271' : '#8AB99A'} pannable zoomable />
      <CanvasControls />
      {nodes.length === 0 && !isDragActive && <EmptyCanvasState />}
      <AnimatePresence>{suggestion && <Panel className="!bottom-[145px] !right-5 !m-0" position="bottom-right"><SmartSuggestion category={suggestion.category} clusterName={suggestion.clusterName} onConnect={() => void connectSuggestion()} onKeepSeparate={keepSeparate} /></Panel>}</AnimatePresence>
    </ReactFlow>
    <AnimatePresence>{quickPreview && <div className="absolute right-5 top-5 z-40"><FileQuickPreview file={quickPreview} onClose={() => setQuickPreview(null)} onOpen={() => void openOriginal(quickPreview.id)} onReanalyze={() => void reanalyzeFile(quickPreview.id)} onReveal={() => void revealOriginal(quickPreview.id)} onTrace={() => highlightFlow(categoriesForFile(quickPreview)[0])} /></div>}</AnimatePresence>
    {contextMenu && <CanvasContextMenu onClose={() => setContextMenu(null)} onHighlight={highlightFlow} onOpen={() => void openOriginal(contextMenu.target.id)} onPreview={() => { if (contextMenu.target.type === 'summaryCard') setSemanticFocus(null); else previewFile(contextMenu.target.id); }} onReanalyze={() => void reanalyzeFile(contextMenu.target.id)} onReorganize={() => void reorganizeCanvas()} onRemove={() => void removeFromCanvas(contextMenu.target.id)} onReveal={() => void revealOriginal(contextMenu.target.id)} position={{ x: Math.min(contextMenu.x, 940), y: Math.min(contextMenu.y, 600) }} target={contextMenu.target} />}
    <AnimatePresence>{isDragActive && <motion.div animate={{ opacity: 1 }} className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[18px] border-2 border-dashed border-[#4A90D9]/55 bg-[#EAF3FC]/50 backdrop-blur-[2px]" exit={{ opacity: 0 }} initial={{ opacity: 0 }}><motion.div animate={{ scale: 1, y: 0 }} className="rounded-[16px] border border-white/90 bg-white/90 px-7 py-5 text-center shadow-[0_12px_38px_rgba(42,91,137,0.14)]" initial={{ scale: 0.97, y: 4 }}><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-[12px] bg-[#4A90D9] text-white shadow-[0_4px_12px_rgba(74,144,217,0.28)]"><Plus size={22} /></div><p className="text-[14px] font-semibold text-[#2B2B2E]">Place files in this space</p><p className="mt-1 text-[11px] text-[#7D7D83]">Release to add them at this position</p></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{dropError && <motion.div animate={{ opacity: 1, y: 0 }} className="absolute left-1/2 top-5 z-40 -translate-x-1/2 rounded-[11px] border border-[#EA4335]/20 bg-white px-4 py-2.5 text-[12px] font-medium text-[#9A322A] shadow-[0_5px_18px_rgba(0,0,0,0.09)]" exit={{ opacity: 0, y: -4 }} initial={{ opacity: 0, y: -4 }}>{dropError}</motion.div>}</AnimatePresence>
    <AnimatePresence>{toastMessage && <motion.div animate={{ opacity: 1, y: 0 }} className="pointer-events-none absolute bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#E2E0DE] bg-[#2F2F33] px-4 py-2 text-[11px] font-medium text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)]" exit={{ opacity: 0, y: 6 }} initial={{ opacity: 0, y: 8 }}>{toastMessage}</motion.div>}</AnimatePresence>
  </div>;
}
