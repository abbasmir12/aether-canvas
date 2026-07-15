import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow, useEdgesState, useNodesState, useReactFlow, useViewport, type Edge, type EdgeTypes, type NodeTypes } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minus, Plus } from 'lucide-react';

import type { AnalyzedFile, RelationshipDiscovery, RelationshipType, SuggestedCluster } from '../../../shared/types';
import { calculateAutoLayout, categoriesForFile } from '../../hooks/useAutoLayout';
import SmartSuggestion from './SmartSuggestion';
import SemanticRibbonEdge from './edges/SemanticRibbonEdge';
import FileCardNode, { type FileCardNodeType } from './nodes/FileCardNode';
import HubNode, { type HubNodeType } from './nodes/HubNode';
import MergeNode, { type MergeNodeType } from './nodes/MergeNode';
import SummaryCardNode, { type SummaryCardNodeType } from './nodes/SummaryCardNode';

type CanvasNode = FileCardNodeType | HubNodeType | MergeNodeType | SummaryCardNodeType;
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
  const button = 'grid w-11 place-items-center text-[#4C4C51] transition-colors hover:bg-[#F4F4F6]';
  return <Panel className="!bottom-5 !left-4 !m-0" position="bottom-left"><div className="flex h-11 items-stretch overflow-hidden rounded-[11px] border border-[#D7D7DC] bg-white/95 shadow-[0_3px_12px_rgba(32,32,35,0.08)] backdrop-blur-md"><button aria-label="Zoom out" className={button} onClick={() => zoomOut({ duration: 180 })} type="button"><Minus size={18} /></button><div className="grid min-w-[58px] place-items-center border-x border-[#E3E3E6] px-2 text-[11px] font-medium tabular-nums text-[#4E4E53]">{Math.round(zoom * 100)}%</div><button aria-label="Zoom in" className={button} onClick={() => zoomIn({ duration: 180 })} type="button"><Plus size={18} /></button><button aria-label="Fit canvas to content" className={`${button} border-l border-[#E3E3E6]`} onClick={() => fitView({ duration: 300, padding: 0.25 })} type="button"><Maximize2 size={17} /></button></div></Panel>;
}

export default function AetherCanvas() {
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
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { clusterRef.current = cluster; }, [cluster]);

  const nodeTypes = useMemo<NodeTypes>(() => ({ fileCard: FileCardNode, hub: HubNode, merge: MergeNode, summaryCard: SummaryCardNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ semanticRibbon: SemanticRibbonEdge }), []);

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
    const shouldShowSummary = allFiles.length >= 2;
    setCluster(activeCluster);
    const layout = calculateAutoLayout(allFiles);
    const summaryId = 'summary:active';
    setNodes((current) => {
      const fileNodes = current.filter((node): node is FileCardNodeType => node.type === 'fileCard');
      const laidOutFiles = fileNodes.map((node) => ({ ...node, position: layout.filePositions.get(node.id) ?? node.position }));
      if (!shouldShowSummary) return laidOutFiles;
      const hubNodes: HubNodeType[] = layout.hubs.map((hub) => ({ id: `hub:${hub.type}`, type: 'hub', position: { x: hub.x, y: hub.y }, data: { relationshipType: hub.type, delay: hub.delay } }));
      const mergeNodes: MergeNodeType[] = layout.hubs.map((hub) => ({ id: `merge:${hub.type}`, type: 'merge', position: { x: hub.x - 84, y: hub.y + 22 }, data: {} }));
      return [...laidOutFiles, ...mergeNodes, ...hubNodes, { id: summaryId, type: 'summaryCard', position: layout.summaryPosition, data: { cluster: activeCluster, files: allFiles, assemblyDelay: 1.2 } }];
    });
    if (!shouldShowSummary) { setEdges([]); return; }
    const fileToMerge: Edge[] = layout.hubs.flatMap((hub) => allFiles.filter((file) => categoriesForFile(file).includes(hub.type)).map((file, index) => ({ id: `file:${file.id}:merge:${hub.type}`, source: file.id, target: `merge:${hub.type}`, type: 'semanticRibbon', data: { relationshipType: hub.type, phase: 'tendril', index }, style: { stroke: RIBBON_COLORS[hub.type] } })));
    const mergeToHub: Edge[] = layout.hubs.map((hub, index) => ({ id: `merge:${hub.type}:hub`, source: `merge:${hub.type}`, target: `hub:${hub.type}`, type: 'semanticRibbon', data: { relationshipType: hub.type, phase: 'merged', index }, style: { stroke: RIBBON_COLORS[hub.type] } }));
    const hubToSummary: Edge[] = layout.hubs.map((hub, index) => ({ id: `hub:${hub.type}:summary`, source: `hub:${hub.type}`, target: summaryId, targetHandle: `summary-${hub.type}`, type: 'semanticRibbon', data: { relationshipType: hub.type, phase: 'summary', index }, style: { stroke: RIBBON_COLORS[hub.type] } }));
    setEdges([...fileToMerge, ...mergeToHub, ...hubToSummary]);
  }, [setEdges, setNodes]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsDragActive(true); }, []);
  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => { if (event.currentTarget.contains(event.relatedTarget as globalThis.Node | null)) return; setIsDragActive(false); }, []);

  const onDrop = useCallback(async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); setIsDragActive(false); setDropError(null);
    const droppedFiles = Array.from(event.dataTransfer.files); if (!droppedFiles.length) return;
    const basePosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const clusterFileNodes = nodesRef.current.filter((node): node is FileCardNodeType => node.type === 'fileCard' && analyzedFiles.current.has(node.id));
    const nearCluster = Boolean(clusterRef.current && clusterFileNodes.some((node) => Math.hypot(node.position.x - basePosition.x, node.position.y - basePosition.y) < 240));
    const registrations = await Promise.allSettled(droppedFiles.map(async (file, index) => {
      const filePath = await window.aether.getDroppedFilePath(file); const metadata = await window.aether.getFileMetadata(filePath); const id = `file:${crypto.randomUUID()}`;
      return { id, filePath, nearCluster, node: { id, type: 'fileCard' as const, position: { x: basePosition.x + index * 24, y: basePosition.y + index * 64 }, data: { fileName: metadata.name, mimeType: metadata.type, filePath: metadata.path, status: 'loading' as const, analysis: null, thumbnailUrl: null, errorMessage: null } } };
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
  }, [applyDiscovery, screenToFlowPosition, setNodes]);

  const connectSuggestion = useCallback(async () => { if (!suggestion) return; const file = pendingFiles.current.get(suggestion.fileId); if (file) { analyzedFiles.current.set(file.id, file); pendingFiles.current.delete(file.id); candidateIds.current.delete(file.id); await applyDiscovery(); } setSuggestion(null); }, [applyDiscovery, suggestion]);
  const keepSeparate = useCallback(() => { if (suggestion) { pendingFiles.current.delete(suggestion.fileId); candidateIds.current.delete(suggestion.fileId); } setSuggestion(null); }, [suggestion]);

  return <div className="relative h-full w-full bg-[#F8F8FA]" onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
    <ReactFlow colorMode="light" defaultViewport={{ x: 70, y: 45, zoom: 1 }} deleteKeyCode={['Backspace', 'Delete']} edgeTypes={edgeTypes} edges={edges} fitViewOptions={{ padding: 0.25 }} maxZoom={2.2} minZoom={0.25} nodeTypes={nodeTypes} nodes={nodes} onEdgesChange={onEdgesChange} onNodesChange={onNodesChange} panOnDrag panOnScroll proOptions={{ hideAttribution: true }} selectionOnDrag={false} zoomOnDoubleClick={false}>
      <Background bgColor="#F8F8FA" color="#D8D6D1" gap={18} size={1} variant={BackgroundVariant.Dots} />
      <MiniMap className="!bottom-5 !right-5 !m-0 !h-[112px] !w-[176px] !rounded-[13px] !border !border-[#D3D3D8] !bg-white/90 !shadow-[0_3px_14px_rgba(33,33,36,0.08)]" maskColor="rgba(242, 242, 245, 0.58)" nodeBorderRadius={5} nodeColor={(node) => node.type === 'summaryCard' ? '#E7A271' : '#8AB99A'} pannable zoomable />
      <CanvasControls />
      {nodes.length === 0 && !isDragActive && <Panel className="!m-0" position="top-center"><motion.div animate={{ opacity: 1, y: 0 }} className="mt-7 flex items-center gap-2 rounded-full border border-[#E1E0DD] bg-white/70 px-4 py-2 text-[12px] font-medium text-[#77777D] shadow-[0_2px_10px_rgba(0,0,0,0.035)] backdrop-blur-md" initial={{ opacity: 0, y: -4 }}><span className="h-1.5 w-1.5 rounded-full bg-[#4A90D9]" />Drop local files anywhere on the canvas</motion.div></Panel>}
      <AnimatePresence>{suggestion && <Panel className="!bottom-[145px] !right-5 !m-0" position="bottom-right"><SmartSuggestion category={suggestion.category} clusterName={suggestion.clusterName} onConnect={() => void connectSuggestion()} onKeepSeparate={keepSeparate} /></Panel>}</AnimatePresence>
    </ReactFlow>
    <AnimatePresence>{isDragActive && <motion.div animate={{ opacity: 1 }} className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[18px] border-2 border-dashed border-[#4A90D9]/55 bg-[#EAF3FC]/50 backdrop-blur-[2px]" exit={{ opacity: 0 }} initial={{ opacity: 0 }}><motion.div animate={{ scale: 1, y: 0 }} className="rounded-[16px] border border-white/90 bg-white/90 px-7 py-5 text-center shadow-[0_12px_38px_rgba(42,91,137,0.14)]" initial={{ scale: 0.97, y: 4 }}><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-[12px] bg-[#4A90D9] text-white shadow-[0_4px_12px_rgba(74,144,217,0.28)]"><Plus size={22} /></div><p className="text-[14px] font-semibold text-[#2B2B2E]">Place files in this space</p><p className="mt-1 text-[11px] text-[#7D7D83]">Release to add them at this position</p></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{dropError && <motion.div animate={{ opacity: 1, y: 0 }} className="absolute left-1/2 top-5 z-40 -translate-x-1/2 rounded-[11px] border border-[#EA4335]/20 bg-white px-4 py-2.5 text-[12px] font-medium text-[#9A322A] shadow-[0_5px_18px_rgba(0,0,0,0.09)]" exit={{ opacity: 0, y: -4 }} initial={{ opacity: 0, y: -4 }}>{dropError}</motion.div>}</AnimatePresence>
  </div>;
}
