import { motion } from 'framer-motion';
import type { EdgeProps } from '@xyflow/react';

type QueryEdgeData = { color?: string; loading?: boolean; index?: number; pulse?: number };

export default function VisualQueryEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const query = data as QueryEdgeData | undefined;
  const color = query?.loading ? '#AAA7AF' : query?.color ?? '#8B7AA8';
  const dx = Math.max(90, Math.abs(targetX - sourceX) * 0.48);
  const path = `M ${sourceX},${sourceY} C ${sourceX + dx},${sourceY} ${targetX - dx},${targetY} ${targetX},${targetY}`;
  const safeId = String(id).replace(/[^a-z0-9]/gi, '');
  return (
    <g className="visual-query-edge">
      <defs>
        <filter height="180%" id={`query-current-${safeId}`} width="180%" x="-40%" y="-40%"><feGaussianBlur result="blur" stdDeviation="3" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <motion.path
        animate={{ pathLength: 1, opacity: query?.loading ? 0.38 : 0.58, stroke: color }}
        d={path}
        fill="none"
        initial={{ pathLength: 0, opacity: 0, stroke: color }}
        strokeDasharray="6 5"
        strokeLinecap="round"
        strokeWidth={2}
        transition={{ delay: 0.2 + (query?.index ?? 0) * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle animate={{ opacity: 0.85, scale: [1, 1.35, 1] }} cx={sourceX} cy={sourceY} fill="white" initial={{ opacity: 0, scale: 0 }} r={3} stroke={color} strokeWidth={1.5} transition={{ delay: 0.68 + (query?.index ?? 0) * 0.1, duration: 0.35 }} />
      <motion.circle animate={{ opacity: 0.85, scale: [1, 1.35, 1] }} cx={targetX} cy={targetY} fill="white" initial={{ opacity: 0, scale: 0 }} r={3} stroke={color} strokeWidth={1.5} transition={{ delay: 0.72 + (query?.index ?? 0) * 0.1, duration: 0.35 }} />
      {Boolean(query?.pulse) && <circle fill="white" filter={`url(#query-current-${safeId})`} key={query?.pulse} r={4} stroke={color} strokeWidth={1.5}><animateMotion dur="0.4s" fill="freeze" path={path} /></circle>}
    </g>
  );
}
