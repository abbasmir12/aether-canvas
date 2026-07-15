import { motion } from 'framer-motion';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { Calendar, CheckSquare, DollarSign, MapPin } from 'lucide-react';

import type { RelationshipType } from '../../../../shared/types';

type SemanticRibbonData = {
  relationshipType: RelationshipType;
  label?: string;
};

const RIBBONS: Record<RelationshipType, { color: string; label: string; Icon: typeof Calendar }> = {
  dates: { color: '#4A90D9', label: 'DATES', Icon: Calendar },
  cost: { color: '#34A853', label: 'COST', Icon: DollarSign },
  place: { color: '#EA4335', label: 'PLACE', Icon: MapPin },
  tasks: { color: '#9B72CF', label: 'TASKS', Icon: CheckSquare },
};

export default function SemanticRibbonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const ribbon = RIBBONS[(data as SemanticRibbonData | undefined)?.relationshipType ?? 'place'];
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.38,
  });
  const Icon = ribbon.Icon;
  const filterId = `ribbon-glow-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <>
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <BaseEdge path={path} style={{ stroke: ribbon.color, strokeOpacity: 0.28, strokeWidth: 9, filter: `url(#${filterId})` }} />
      <motion.path
        animate={{ pathLength: 1, opacity: 1 }}
        d={path}
        fill="none"
        initial={{ pathLength: 0, opacity: 0.55 }}
        stroke={ribbon.color}
        strokeLinecap="round"
        strokeWidth={3}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <circle cx={sourceX} cy={sourceY} fill={ribbon.color} r={5} stroke="#FFFFFF" strokeWidth={2} />
      <circle cx={targetX} cy={targetY} fill={ribbon.color} r={5} stroke="#FFFFFF" strokeWidth={2} />
      <EdgeLabelRenderer>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="nodrag nopan pointer-events-auto absolute rounded-full border border-white/70 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-white shadow-[0_3px_9px_rgba(35,35,38,0.18)]"
          initial={{ opacity: 0, scale: 0.92 }}
          style={{
            backgroundColor: ribbon.color,
            left: labelX,
            top: labelY,
            transform: 'translate(-50%, -50%)',
          }}
          title={(data as SemanticRibbonData | undefined)?.label ?? ribbon.label}
          transition={{ delay: 0.8, duration: 0.2 }}
        >
          <span className="flex items-center gap-1.5"><Icon size={14} strokeWidth={2.2} />{ribbon.label}</span>
        </motion.div>
      </EdgeLabelRenderer>
    </>
  );
}
