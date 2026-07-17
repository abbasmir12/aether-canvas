import { Maximize2 } from 'lucide-react';
import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useReactFlow, useStore, useViewport, type Edge, type Node } from '@xyflow/react';

import type { RelationshipType } from '../../../shared/types';

const COLORS: Record<RelationshipType, string> = {
  dates: '#4A90D9',
  cost: '#34A853',
  place: '#EA4335',
  tasks: '#9B72CF',
};

function dimensions(node: Node): { width: number; height: number } {
  const measuredWidth = node.measured?.width ?? node.width;
  const measuredHeight = node.measured?.height ?? node.height;
  if (measuredWidth && measuredHeight) return { width: measuredWidth, height: measuredHeight };
  if (node.type === 'summaryCard') return { width: 320, height: 650 };
  if (node.type === 'visualAnswer') return { width: 320, height: 360 };
  if (node.type === 'hub') return { width: 104, height: 44 };
  return { width: 220, height: 150 };
}

function nodeColor(node: Node): string {
  if (node.type === 'summaryCard') return '#FFFFFF';
  if (node.type === 'visualAnswer') return '#F4EDF9';
  if (node.type === 'hub') {
    const type = (node.data as { relationshipType?: RelationshipType })?.relationshipType;
    return type ? COLORS[type] : '#8C8991';
  }
  const mime = String((node.data as { mimeType?: string })?.mimeType ?? '');
  if (/pdf/i.test(mime)) return '#F8D7D3';
  if (/sheet|excel|csv/i.test(mime)) return '#D8EEDD';
  if (/image/i.test(mime)) return '#D7E6F4';
  return '#E5DDF0';
}

export default function CanvasMinimap({ edges, nodes, showConnectors }: { edges: Edge[]; nodes: Node[]; showConnectors: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { fitView, setCenter } = useReactFlow();
  const viewport = useViewport();
  const flowSize = useStore((state) => ({ width: state.width, height: state.height }));
  const geometry = useMemo(() => {
    const entries = nodes.map((node) => ({ node, ...dimensions(node) }));
    if (!entries.length) return null;
    const padding = 90;
    const minX = Math.min(...entries.map(({ node }) => node.position.x)) - padding;
    const minY = Math.min(...entries.map(({ node }) => node.position.y)) - padding;
    const maxX = Math.max(...entries.map(({ node, width }) => node.position.x + width)) + padding;
    const maxY = Math.max(...entries.map(({ node, height }) => node.position.y + height)) + padding;
    return { entries, minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
  }, [nodes]);

  if (!geometry) return null;
  const byId = new Map(geometry.entries.map((entry) => [entry.node.id, entry]));
  const visibleRect = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: flowSize.width / viewport.zoom,
    height: flowSize.height / viewport.zoom,
  };

  const focusAtPointer = (event: ReactPointerEvent<SVGSVGElement>, animate: boolean) => {
    const svg = svgRef.current;
    const transform = svg?.getScreenCTM();
    if (!svg || !transform) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const canvasPoint = point.matrixTransform(transform.inverse());
    void setCenter(canvasPoint.x, canvasPoint.y, { duration: animate ? 280 : 0, zoom: viewport.zoom });
  };

  return (
    <div className="absolute bottom-5 right-5 z-20 h-[126px] w-[192px] overflow-hidden rounded-[14px] border border-[#D8D5DA] bg-white/94 shadow-[0_8px_24px_rgba(30,30,34,.12),inset_0_1px_0_white] backdrop-blur-xl" data-aether-canvas-minimap>
      <div className="pointer-events-none absolute left-2.5 top-2 z-10 rounded-full border border-white/80 bg-white/85 px-2 py-1 text-[7px] font-semibold uppercase tracking-[.13em] text-[#88848C] shadow-sm">Canvas overview</div>
      <button aria-label="Fit canvas to content" className="absolute right-2 top-2 z-20 grid h-6 w-6 place-items-center rounded-[7px] border border-[#E1DEE2] bg-white/90 text-[#77737B] shadow-sm transition hover:bg-white hover:text-[#3D3941]" onClick={() => void fitView({ duration: 350, padding: .22 })} type="button"><Maximize2 size={11} /></button>
      <svg
        className="h-full w-full cursor-crosshair"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); focusAtPointer(event, true); }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) focusAtPointer(event, false); }}
        preserveAspectRatio="xMidYMid meet"
        ref={svgRef}
        viewBox={`${geometry.minX} ${geometry.minY} ${geometry.width} ${geometry.height}`}
      >
        <defs>
          <pattern height="28" id="minimap-dots" patternUnits="userSpaceOnUse" width="28"><circle cx="2" cy="2" fill="#D9D4CA" opacity=".5" r="1.2" /></pattern>
          <filter height="180%" id="minimap-glow" width="180%" x="-40%" y="-40%"><feGaussianBlur stdDeviation="5" /></filter>
          <clipPath id="minimap-clip"><rect height={geometry.height} rx="18" width={geometry.width} x={geometry.minX} y={geometry.minY} /></clipPath>
        </defs>
        <g clipPath="url(#minimap-clip)">
          <rect fill="#F6F3EC" height={geometry.height} width={geometry.width} x={geometry.minX} y={geometry.minY} />
          <rect fill="url(#minimap-dots)" height={geometry.height} width={geometry.width} x={geometry.minX} y={geometry.minY} />
          {showConnectors && edges.map((edge) => {
            const source = byId.get(edge.source);
            const target = byId.get(edge.target);
            if (!source || !target) return null;
            const sx = source.node.position.x + source.width;
            const sy = source.node.position.y + source.height / 2;
            const tx = target.node.position.x;
            const ty = target.node.position.y + target.height / 2;
            const type = (edge.data as { relationshipType?: RelationshipType })?.relationshipType;
            const color = type ? COLORS[type] : String((edge.data as { color?: string })?.color ?? '#9B72CF');
            const dx = Math.max(45, (tx - sx) * .48);
            const path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
            const queryEdge = edge.type === 'visualQuery';
            return <g data-minimap-edge={edge.id} key={edge.id}><path d={path} fill="none" filter="url(#minimap-glow)" opacity=".16" stroke={color} strokeWidth={queryEdge ? 6 : 18} /><path d={path} fill="none" opacity={queryEdge ? .7 : .5} stroke={color} strokeDasharray={queryEdge ? '10 7' : undefined} strokeLinecap="round" strokeWidth={queryEdge ? 3 : 7} /><path d={path} fill="none" opacity=".7" stroke="white" strokeLinecap="round" strokeWidth={queryEdge ? 1 : 1.8} /></g>;
          })}
          {geometry.entries.map(({ node, width, height }) => {
            const fill = nodeColor(node);
            if (node.type === 'hub') return <rect fill={fill} height={height} key={node.id} rx={height / 2} stroke="white" strokeWidth="5" width={width} x={node.position.x} y={node.position.y} />;
            if (node.type === 'summaryCard') return <g key={node.id}><rect fill="#FFFFFF" height={height} rx="22" stroke="#BEB9C0" strokeWidth="5" width={width} x={node.position.x} y={node.position.y} /><rect fill="#EA4335" height="52" rx="14" width="52" x={node.position.x + 22} y={node.position.y + 20} />{[COLORS.dates, COLORS.cost, COLORS.tasks, COLORS.place].map((color, index) => <rect fill={color} height={(height - 125) / 4 - 12} key={color} opacity=".3" rx="10" width={width - 42} x={node.position.x + 21} y={node.position.y + 92 + index * ((height - 125) / 4)} />)}</g>;
            return <g key={node.id}><rect fill={fill} height={height} rx="13" stroke={node.type === 'visualAnswer' ? '#9B72CF' : '#FFFFFF'} strokeWidth="4" width={width} x={node.position.x} y={node.position.y} /><rect fill={node.type === 'visualAnswer' ? '#9B72CF' : '#FFFFFF'} height="12" opacity=".8" rx="6" width={width * .58} x={node.position.x + 16} y={node.position.y + 15} /></g>;
          })}
          <rect fill="#4A90D9" fillOpacity=".045" height={visibleRect.height} rx="18" stroke="#4A90D9" strokeDasharray="12 7" strokeWidth="4" width={visibleRect.width} x={visibleRect.x} y={visibleRect.y} />
        </g>
      </svg>
    </div>
  );
}
