import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow, useEdgesState, useNodesState, useReactFlow, useViewport, type Edge, type EdgeTypes, type NodeTypes } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minus, Plus } from 'lucide-react';

import type { AnalyzedFile, RelationshipDiscovery, RelationshipType, SuggestedCluster, WorkspaceData } from '../../../shared/types';
import { calculateAutoLayout, categoriesForFile } from '../../hooks/useAutoLayout';
import SmartSuggestion from './SmartSuggestion';
import SemanticRibbonEdge from './edges/SemanticRibbonEdge';
import FileCardNode, { type FileCardNodeType } from './nodes/FileCardNode';
import HubNode, { type HubNodeType } from './nodes/HubNode';
import SummaryCardNode, { type SummaryCardNodeType } from './nodes/SummaryCardNode';
import EmptyCanvasState from './EmptyCanvasState';

type CanvasNode = FileCardNodeType | HubNodeType | SummaryCardNodeType;
type Suggestion = { fileId: string; category: string; clusterName: string };

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
  const [cluster, setCluster] = useState<SuggestedCluster | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
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
  const { fitView, getViewport, screenToFlowPosition, setViewport } = useReactFlow();

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

  const nodeTypes = useMemo<NodeTypes>(() => ({ fileCard: FileCardNode, hub: HubNode, summaryCard: SummaryCardNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ semanticRibbon: SemanticRibbonEdge }), []);
  const importPaths = useCallback(async (paths: string[]) => {
    const base = screenToFlowPosition({ x: 460, y: 240 });
    const entries = await Promise.all(paths.map(async (filePath, index) => { const metadata = await window.aether.getFileMetadata(filePath); const id = `file:${crypto.randomUUID()}`; return { id, filePath, node: { id, type: 'fileCard' as const, position: { x: base.x + index * 28, y: base.y + index * 72 }, data: { fileName: metadata.name, mimeType: metadata.type, filePath, status: 'loading' as const, analysis: null, thumbnailUrl: null, errorMessage: null } } }; }));
    setNodes((current) => [...current, ...entries.map((entry) => entry.node)]);
    await Promise.all(entries.map(async ({ id, filePath }) => { const [analysis, thumbnailUrl] = await Promise.all([window.aether.analyzeFile(filePath, id), window.aether.getThumbnail(filePath)]); setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'ready', analysis, thumbnailUrl, errorMessage: null } } as FileCardNodeType : node)); analyzedFiles.current.set(id, analysis); }));
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
    if (workspace?.name === 'Untitled Space' && allFiles.length >= 2 && activeCluster.name !== 'Untitled Space') {
      onWorkspaceSnapshot({ ...workspace, name: activeCluster.name, icon: activeCluster.category === 'travel' ? 'map-pin' : workspace.icon, iconColor: activeCluster.category === 'travel' ? '#EA4335' : workspace.iconColor });
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
      return [...laidOutFiles, ...hubNodes, { id: summaryId, type: 'summaryCard', position: layout.summaryPosition, style: { willChange: 'transform' }, data: { cluster: activeCluster, files: allFiles, assemblyDelay: 1.2 } }];
    }));
    if (!shouldShowSummary) { setEdges([]); return; }
    const fileToHub: Edge[] = allFiles.flatMap((file) => categoriesForFile(file).map((type, index) => ({ id: `file:${file.id}:hub:${type}`, source: file.id, target: `hub:${type}`, type: 'semanticRibbon', data: { relationshipType: type, phase: 'file', index }, style: { stroke: RIBBON_COLORS[type] } })));
    const hubToSummary: Edge[] = layout.hubs.map((hub, index) => ({ id: `hub:${hub.type}:summary`, source: `hub:${hub.type}`, target: summaryId, targetHandle: `summary-${hub.type}`, type: 'semanticRibbon', data: { relationshipType: hub.type, phase: 'summary', index }, style: { stroke: RIBBON_COLORS[hub.type] } }));
    setEdges([...fileToHub, ...hubToSummary]);
  }, [onWorkspaceSnapshot, setEdges, setNodes, workspace]);
  useEffect(() => { applyDiscoveryRef.current = applyDiscovery; }, [applyDiscovery]);

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
      return { id, filePath, nearCluster, node: { id, type: 'fileCard' as const, position: { x: basePosition.x + index * 24, y: basePosition.y + index * 64 }, style: { willChange: 'transform' }, data: { fileName: metadata.name, mimeType: metadata.type, filePath: metadata.path, status: 'loading' as const, analysis: null, thumbnailUrl: null, errorMessage: null } } };
    }));
    const accepted = registrations.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    if (accepted.length) setNodes((current) => [...current, ...accepted.map(({ node }) => node)]);
    const failed = registrations.find((result): result is PromiseRejectedResult => result.status === 'rejected'); if (failed) setDropError(readableError(failed.reason));
    await Promise.allSettled(accepted.map(async ({ filePath, id, nearCluster: candidate }) => {
      try {
        const [analysis, thumbnailUrl] = await Promise.all([window.aether.analyzeFile(filePath, id), window.aether.getThumbnail(filePath)]);
        setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'ready', analysis, thumbnailUrl, errorMessage: null } } as FileCardNodeType : node));
        if (candidate && clusterRef.current) { pendingFiles.current.set(id, analysis); candidateIds.current.add(id); setSuggestion({ fileId: id, category: analysis.category, clusterName: clusterRef.current.name }); return; }
        analyzedFiles.current.set(id, analysis); await applyDiscovery();
      } catch (error) { const message = readableError(error); setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, status: 'error', errorMessage: message } } as FileCardNodeType : node)); setDropError(message); }
    }));
  }, [applyDiscovery, importPaths, screenToFlowPosition, setNodes]);

  const connectSuggestion = useCallback(async () => { if (!suggestion) return; const file = pendingFiles.current.get(suggestion.fileId); if (file) { analyzedFiles.current.set(file.id, file); pendingFiles.current.delete(file.id); candidateIds.current.delete(file.id); await applyDiscovery(); } setSuggestion(null); }, [applyDiscovery, suggestion]);
  const keepSeparate = useCallback(() => { if (suggestion) { pendingFiles.current.delete(suggestion.fileId); candidateIds.current.delete(suggestion.fileId); } setSuggestion(null); }, [suggestion]);

  return <div className="relative h-full w-full bg-[#F4F1E9]" onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
    <ReactFlow colorMode="light" defaultViewport={{ x: 70, y: 45, zoom: 1 }} deleteKeyCode={['Backspace', 'Delete']} edgeTypes={edgeTypes} edges={edges} fitViewOptions={{ padding: 0.25 }} maxZoom={2.2} minZoom={0.25} nodeTypes={nodeTypes} nodes={nodes} onEdgesChange={onEdgesChange} onNodesChange={onNodesChange} panOnDrag panOnScroll proOptions={{ hideAttribution: true }} selectionOnDrag={false} zoomOnDoubleClick={false}>
      <Background bgColor="#F4F1E9" color="#DBD5C6" gap={18} size={1} variant={BackgroundVariant.Dots} />
      <MiniMap className="!bottom-5 !right-5 !m-0 !h-[112px] !w-[176px] !rounded-[13px] !border !border-[#D3D3D8] !bg-white/90 !shadow-[0_3px_14px_rgba(33,33,36,0.08)]" maskColor="rgba(242, 242, 245, 0.58)" nodeBorderRadius={5} nodeColor={(node) => node.type === 'summaryCard' ? '#E7A271' : '#8AB99A'} pannable zoomable />
      <CanvasControls />
      {nodes.length === 0 && !isDragActive && <EmptyCanvasState />}
      <AnimatePresence>{suggestion && <Panel className="!bottom-[145px] !right-5 !m-0" position="bottom-right"><SmartSuggestion category={suggestion.category} clusterName={suggestion.clusterName} onConnect={() => void connectSuggestion()} onKeepSeparate={keepSeparate} /></Panel>}</AnimatePresence>
    </ReactFlow>
    <AnimatePresence>{isDragActive && <motion.div animate={{ opacity: 1 }} className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[18px] border-2 border-dashed border-[#4A90D9]/55 bg-[#EAF3FC]/50 backdrop-blur-[2px]" exit={{ opacity: 0 }} initial={{ opacity: 0 }}><motion.div animate={{ scale: 1, y: 0 }} className="rounded-[16px] border border-white/90 bg-white/90 px-7 py-5 text-center shadow-[0_12px_38px_rgba(42,91,137,0.14)]" initial={{ scale: 0.97, y: 4 }}><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-[12px] bg-[#4A90D9] text-white shadow-[0_4px_12px_rgba(74,144,217,0.28)]"><Plus size={22} /></div><p className="text-[14px] font-semibold text-[#2B2B2E]">Place files in this space</p><p className="mt-1 text-[11px] text-[#7D7D83]">Release to add them at this position</p></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{dropError && <motion.div animate={{ opacity: 1, y: 0 }} className="absolute left-1/2 top-5 z-40 -translate-x-1/2 rounded-[11px] border border-[#EA4335]/20 bg-white px-4 py-2.5 text-[12px] font-medium text-[#9A322A] shadow-[0_5px_18px_rgba(0,0,0,0.09)]" exit={{ opacity: 0, y: -4 }} initial={{ opacity: 0, y: -4 }}>{dropError}</motion.div>}</AnimatePresence>
  </div>;
}
