import { motion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import type { EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';

type RibbonData = { relationshipType: RelationshipType; phase?: 'file' | 'summary'; index?: number };
type Dot = { x: number; y: number };

const COLORS: Record<RelationshipType, string> = {
  dates: '#4A90D9',
  cost: '#34A853',
  place: '#EA4335',
  tasks: '#9B72CF',
};

function organicHorizontalPath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
  const horizontalDistance = targetX - sourceX;
  const bend = Math.max(88, Math.abs(horizontalDistance) * 0.5) * Math.sign(horizontalDistance || 1);
  return `M ${sourceX},${sourceY} C ${sourceX + bend},${sourceY} ${targetX - bend},${targetY} ${targetX},${targetY}`;
}

export default function SemanticRibbonEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const ribbon = data as RibbonData | undefined;
  const color = COLORS[ribbon?.relationshipType ?? 'place'];
  const isTrunk = ribbon?.phase === 'summary';
  const scale = isTrunk ? 1.3 : 1;
  const opacityScale = isTrunk ? 1.2 : 1;
  const drawDelay = (isTrunk ? 1.5 : 0.5) + (ribbon?.index ?? 0) * 0.1;
  const path = organicHorizontalPath(sourceX, sourceY, targetX, targetY);
  const measurementPath = useRef<SVGPathElement>(null);
  const [dots, setDots] = useState<Dot[]>([]);
  const filterId = `aether-ribbon-blur-${id.replace(/[^a-z0-9]/gi, '')}`;
  const coloredTransition = { delay: drawDelay, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const };

  useLayoutEffect(() => {
    const element = measurementPath.current;
    if (!element) return;
    const length = element.getTotalLength();
    const count = Math.max(4, Math.min(10, Math.floor(length / 68)));
    setDots(Array.from({ length: count }, (_, index) => {
      const point = element.getPointAtLength(length * ((index + 1) / (count + 1)));
      return { x: point.x, y: point.y };
    }));
  }, [path]);

  const layer = (width: number, opacity: number, extra: Record<string, unknown> = {}) => ({
    d: path,
    fill: 'none',
    stroke: color,
    strokeWidth: width * scale,
    strokeOpacity: Math.min(1, opacity * opacityScale),
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: coloredTransition,
    ...extra,
  });

  return (
    <g className="semantic-ribbon">
      <defs>
        <filter id={filterId} x="-40%" y="-50%" width="180%" height="200%"><feGaussianBlur stdDeviation="2.7" /></filter>
      </defs>
      <path ref={measurementPath} d={path} fill="none" stroke="none" />
      <motion.path {...layer(46, 0.09, { filter: `url(#${filterId})` })} />
      <motion.path {...layer(28, 0.18)} />
      <motion.path {...layer(16, 0.28)} />
      <motion.path {...layer(5, 0.46)} />
      <motion.path
        animate={{ pathLength: 1, opacity: 0.36 * opacityScale }}
        d={path}
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.25 * scale}
        transition={{ delay: drawDelay + 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {dots.map((dot, index) => (
        <motion.circle
          animate={{ opacity: 0.65, scale: 1 }}
          cx={dot.x}
          cy={dot.y}
          fill="#FFFFFF"
          initial={{ opacity: 0, scale: 0.6 }}
          key={`${id}-dot-${index}`}
          r={2.5 * scale}
          transition={{ delay: drawDelay + 1 + index * 0.05, duration: 0.18 }}
        />
      ))}
      <circle cx={sourceX} cy={sourceY} fill={color} fillOpacity={0.3} r={5.5} stroke={color} strokeOpacity={0.65} strokeWidth={2} />
      <circle cx={sourceX} cy={sourceY} fill="#FFFFFF" r={2} />
      <circle cx={targetX} cy={targetY} fill={color} fillOpacity={0.3} r={5.5} stroke={color} strokeOpacity={0.65} strokeWidth={2} />
      <circle cx={targetX} cy={targetY} fill="#FFFFFF" r={2} />
    </g>
  );
}
