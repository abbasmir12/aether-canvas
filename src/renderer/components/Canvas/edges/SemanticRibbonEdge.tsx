import { motion } from 'framer-motion';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';

type RibbonData = { relationshipType: RelationshipType; phase?: 'file' | 'summary'; index?: number };
const COLORS: Record<RelationshipType, string> = { dates: '#4A90D9', cost: '#34A853', place: '#EA4335', tasks: '#9B72CF' };

export default function SemanticRibbonEdge({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data }: EdgeProps) {
  const ribbon = data as RibbonData | undefined;
  const color = COLORS[ribbon?.relationshipType ?? 'place'];
  const phaseDelay = ribbon?.phase === 'summary' ? 1.5 : 0.5;
  const delay = phaseDelay + (ribbon?.index ?? 0) * 0.1;
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.42 });
  const filterId = `ribbon-${id.replace(/[^a-z0-9]/gi, '')}`;
  return <>
    <defs><filter id={filterId} x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="5" /></filter></defs>
    <BaseEdge path={path} style={{ stroke: color, strokeOpacity: 0.15, strokeWidth: 20, filter: `url(#${filterId})` }} />
    <motion.path animate={{ pathLength: 1, opacity: 0.35 }} d={path} fill="none" initial={{ pathLength: 0, opacity: 0 }} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={10} transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }} />
    <motion.path animate={{ pathLength: 1, opacity: 0.72 }} d={path} fill="none" initial={{ pathLength: 0, opacity: 0 }} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }} />
    <circle cx={sourceX} cy={sourceY} fill="#FFFFFF" r={4.5} stroke={color} strokeWidth={2} />
  </>;
}
