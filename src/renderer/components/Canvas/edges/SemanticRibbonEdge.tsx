import { motion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import type { EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';

type RibbonPhase = 'tendril' | 'merged' | 'summary';
type RibbonData = { relationshipType: RelationshipType; phase?: RibbonPhase; index?: number };
type Dot = { x: number; y: number };

const COLORS: Record<RelationshipType, string> = { dates: '#4A90D9', cost: '#34A853', place: '#EA4335', tasks: '#9B72CF' };
const VARIATIONS = [0, 15, -10, 8, -6, 11];

function riverPath(sourceX: number, sourceY: number, targetX: number, targetY: number, variation: number, isArc: boolean): string {
  const dx = targetX - sourceX;
  const controlOneX = sourceX + dx * (isArc ? 0.5 : 0.6);
  const controlTwoX = targetX - dx * (isArc ? 0.5 : 0.3);
  return `M ${sourceX},${sourceY} C ${controlOneX},${sourceY + variation} ${controlTwoX},${targetY - variation} ${targetX},${targetY}`;
}

export default function SemanticRibbonEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const ribbon = data as RibbonData | undefined;
  const phase = ribbon?.phase ?? 'tendril';
  const color = COLORS[ribbon?.relationshipType ?? 'place'];
  const isTendril = phase === 'tendril';
  const isSummary = phase === 'summary';
  const path = riverPath(sourceX, sourceY, targetX, targetY, isTendril ? VARIATIONS[(ribbon?.index ?? 0) % VARIATIONS.length] : 0, isSummary);
  const measurementPath = useRef<SVGPathElement>(null);
  const [dots, setDots] = useState<Dot[]>([]);
  const drawDelay = (isSummary ? 1.5 : isTendril ? 0.5 : 0.85) + (ribbon?.index ?? 0) * (isTendril ? 0.06 : 0.1);
  const filterId = `aether-ribbon-mist-${id.replace(/[^a-z0-9]/gi, '')}`;
  const transition = { delay: drawDelay, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const };

  useLayoutEffect(() => {
    if (isTendril || !measurementPath.current) { setDots([]); return; }
    const length = measurementPath.current.getTotalLength();
    const count = Math.max(2, Math.min(5, Math.floor(length / 92)));
    setDots(Array.from({ length: count }, (_, index) => {
      const point = measurementPath.current!.getPointAtLength(length * ((index + 1) / (count + 1)));
      return { x: point.x, y: point.y };
    }));
  }, [isTendril, path]);

  const animatedPath = (stroke: string, strokeWidth: number, strokeOpacity: number, filter?: string) => (
    <motion.path animate={{ pathLength: 1, opacity: 1 }} d={path} fill="none" filter={filter} initial={{ pathLength: 0, opacity: 0 }} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={strokeOpacity} strokeWidth={strokeWidth} transition={transition} />
  );

  if (isTendril) {
    return <g className="semantic-ribbon semantic-ribbon--tendril"><defs><filter id={filterId} x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="2" /></filter></defs><path ref={measurementPath} d={path} fill="none" stroke="none" />{animatedPath(color, 15, 0.055, `url(#${filterId})`)}{animatedPath(color, 7, 0.16)}<circle cx={sourceX} cy={sourceY} fill={color} fillOpacity={0.28} r={3} stroke={color} strokeOpacity={0.42} strokeWidth={1} /><circle cx={sourceX} cy={sourceY} fill="#FFFFFF" r={1.15} /></g>;
  }

  const outerWidth = isSummary ? 48 : 36;
  const bodyWidth = isSummary ? 22 : 16;
  const coreWidth = isSummary ? 4 : 3;
  const bodyOpacity = isSummary ? 0.2 : 0.18;
  return <g className="semantic-ribbon semantic-ribbon--river"><defs><filter id={filterId} x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="4" /></filter></defs><path ref={measurementPath} d={path} fill="none" stroke="none" />{animatedPath(color, outerWidth, 0.06, `url(#${filterId})`)}{animatedPath(color, bodyWidth, bodyOpacity)}<motion.path animate={{ pathLength: 1, opacity: 1 }} d={path} fill="none" initial={{ pathLength: 0, opacity: 0 }} stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.35} strokeWidth={coreWidth} transition={{ ...transition, delay: drawDelay + 0.1 }} />{dots.map((dot, index) => <motion.circle animate={{ opacity: 0.4 }} cx={dot.x} cy={dot.y} fill="#FFFFFF" initial={{ opacity: 0 }} key={`${id}-dot-${index}`} r={1.7} transition={{ delay: drawDelay + 1 + index * 0.05, duration: 0.18 }} />)}<circle cx={targetX} cy={targetY} fill={color} fillOpacity={0.28} r={3} stroke={color} strokeOpacity={0.42} strokeWidth={1} /><circle cx={targetX} cy={targetY} fill="#FFFFFF" r={1.15} /></g>;
}
