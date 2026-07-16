import { useEffect, useMemo, useState } from 'react';
import type { EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';

type Point = { x: number; y: number };
type Cubic = { start: Point; controlA: Point; controlB: Point; end: Point };
type RibbonData = { relationshipType: RelationshipType; phase?: 'file' | 'summary'; index?: number; isDragging?: boolean };

const COLORS: Record<RelationshipType, string> = {
  dates: '#4A90D9',
  cost: '#34A853',
  place: '#EA4335',
  tasks: '#9B72CF',
};

function pathFor({ start, controlA, controlB, end }: Cubic): string {
  return `M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`;
}

function reverse(curve: Cubic): Cubic {
  return { start: curve.end, controlA: curve.controlB, controlB: curve.controlA, end: curve.start };
}

function enclosedPath(top: Cubic, bottom: Cubic): string {
  const reversedBottom = reverse(bottom);
  return `${pathFor(top)} L ${reversedBottom.start.x} ${reversedBottom.start.y} C ${reversedBottom.controlA.x} ${reversedBottom.controlA.y}, ${reversedBottom.controlB.x} ${reversedBottom.controlB.y}, ${reversedBottom.end.x} ${reversedBottom.end.y} Z`;
}

function tangent(curve: Cubic, position: 'start' | 'a' | 'b' | 'end'): Point {
  if (position === 'start') return { x: curve.controlA.x - curve.start.x, y: curve.controlA.y - curve.start.y };
  if (position === 'a') return { x: curve.controlB.x - curve.start.x, y: curve.controlB.y - curve.start.y };
  if (position === 'b') return { x: curve.end.x - curve.controlA.x, y: curve.end.y - curve.controlA.y };
  return { x: curve.end.x - curve.controlB.x, y: curve.end.y - curve.controlB.y };
}

function offset(point: Point, direction: Point, distance: number): Point {
  const length = Math.hypot(direction.x, direction.y) || 1;
  return { x: point.x - direction.y / length * distance, y: point.y + direction.x / length * distance };
}

function offsetCurve(curve: Cubic, distances: number[]): Cubic {
  return {
    start: offset(curve.start, tangent(curve, 'start'), distances[0]),
    controlA: offset(curve.controlA, tangent(curve, 'a'), distances[1]),
    controlB: offset(curve.controlB, tangent(curve, 'b'), distances[2]),
    end: offset(curve.end, tangent(curve, 'end'), distances[3]),
  };
}

function pointAt(curve: Cubic, progress: number): Point {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * curve.start.x + 3 * inverse ** 2 * progress * curve.controlA.x + 3 * inverse * progress ** 2 * curve.controlB.x + progress ** 3 * curve.end.x,
    y: inverse ** 3 * curve.start.y + 3 * inverse ** 2 * progress * curve.controlA.y + 3 * inverse * progress ** 2 * curve.controlB.y + progress ** 3 * curve.end.y,
  };
}

function directionAt(curve: Cubic, progress: number): Point {
  const inverse = 1 - progress;
  return {
    x: 3 * inverse ** 2 * (curve.controlA.x - curve.start.x) + 6 * inverse * progress * (curve.controlB.x - curve.controlA.x) + 3 * progress ** 2 * (curve.end.x - curve.controlB.x),
    y: 3 * inverse ** 2 * (curve.controlA.y - curve.start.y) + 6 * inverse * progress * (curve.controlB.y - curve.controlA.y) + 3 * progress ** 2 * (curve.end.y - curve.controlB.y),
  };
}

function markerTransform(curve: Cubic, progress: number): string {
  const point = pointAt(curve, progress);
  const direction = directionAt(curve, progress);
  return `translate(${point.x} ${point.y}) rotate(${Math.atan2(direction.y, direction.x) * 180 / Math.PI + 45})`;
}

function glassCurve(sourceX: number, sourceY: number, targetX: number, targetY: number, phase: 'file' | 'summary', index: number): Cubic {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const variation = phase === 'file' ? [-8, 5, 8, -6, 3][index % 5] : [-3, 4, -2, 3][index % 4];
  return {
    start: { x: sourceX, y: sourceY },
    controlA: { x: sourceX + dx * 0.25, y: sourceY + dy * 0.08 + variation },
    controlB: { x: sourceX + dx * 0.63, y: sourceY + dy * 0.72 - variation * 0.7 },
    end: { x: targetX, y: targetY },
  };
}

/** A translucent, refractive SVG material with a cheap single-line drag representation. */
export default function SemanticRibbonEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const ribbon = data as RibbonData | undefined;
  const relationshipType = ribbon?.relationshipType ?? 'place';
  const color = COLORS[relationshipType];
  const phase = ribbon?.phase ?? 'file';
  const index = ribbon?.index ?? 0;
  const isDragging = ribbon?.isDragging ?? false;
  const isTrunk = phase === 'summary';
  const curve = useMemo(() => glassCurve(sourceX, sourceY, targetX, targetY, phase, index), [sourceX, sourceY, targetX, targetY, phase, index]);
  const [glassVisible, setGlassVisible] = useState(!isDragging);

  useEffect(() => {
    if (isDragging) {
      setGlassVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setGlassVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isDragging]);

  const widths = isTrunk ? [10, 19, 18, 12] : [6, 15, 14, 8];
  const centerBias = widths.map((width, position) => position === 1 ? width * 0.13 : position === 2 ? -width * 0.08 : 0);
  const outerTop = offsetCurve(curve, widths);
  const outerBottom = offsetCurve(curve, widths.map((width) => -width));
  const center = offsetCurve(curve, centerBias);
  const innerTop = offsetCurve(curve, widths.map((width, position) => width * 0.48 + centerBias[position]));
  const innerBottom = offsetCurve(curve, widths.map((width, position) => -width * 0.48 + centerBias[position]));
  const safeId = id.replace(/[^a-z0-9]/gi, '');
  const glowId = `aether-glass-glow-${safeId}`;
  const markers = isTrunk ? [0.19, 0.37, 0.59, 0.78] : [0.22, 0.44, 0.67, 0.84];

  if (isDragging) {
    return <path className="semantic-ribbon" d={pathFor(curve)} fill="none" stroke={color} strokeLinecap="round" strokeOpacity={0.25} strokeWidth={2} />;
  }

  return (
    <g className="semantic-ribbon" style={{ opacity: glassVisible ? 1 : 0, transition: 'opacity 200ms ease-out' }}>
      <defs>
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <path d={pathFor(curve)} fill="none" filter={`url(#${glowId})`} stroke={color} strokeLinecap="round" strokeOpacity={0.04} strokeWidth={isTrunk ? 48 : 42} />

      {/* Refractive exterior and asymmetrically lit glass halves. */}
      <path d={pathFor(outerTop)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.34} strokeWidth={1.05} />
      <path d={pathFor(outerBottom)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.24} strokeWidth={0.86} />
      <path d={enclosedPath(outerTop, center)} fill={color} fillOpacity={isTrunk ? 0.17 : 0.15} />
      <path d={enclosedPath(center, outerBottom)} fill={color} fillOpacity={isTrunk ? 0.12 : 0.1} />

      {/* Internal glass channel, visible beneath the surface highlight. */}
      <path d={pathFor(innerTop)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.19} strokeWidth={0.72} />
      <path d={pathFor(innerBottom)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.13} strokeWidth={0.56} />
      <path d={enclosedPath(innerTop, innerBottom)} fill={color} fillOpacity={0.08} />

      {/* Specular rail and caustic diamonds. */}
      <path d={pathFor(center)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.55} strokeWidth={isTrunk ? 1.75 : 1.5} />
      <path d={pathFor(offsetCurve(center, [-0.38, -0.5, -0.36, -0.3]))} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.48} strokeWidth={0.48} />
      {markers.map((progress, markerIndex) => {
        const point = pointAt(center, progress);
        return <rect fill="#FFFFFF" fillOpacity={0.58} height={markerIndex % 2 ? 4 : 5} key={`caustic-${markerIndex}`} transform={`rotate(45 ${point.x} ${point.y})`} width={markerIndex % 2 ? 4 : 5} x={point.x - (markerIndex % 2 ? 2 : 2.5)} y={point.y - (markerIndex % 2 ? 2 : 2.5)} />;
      })}
      {[0.35, 0.73].map((progress, markerIndex) => {
        const point = pointAt(innerTop, progress);
        return <rect fill="#FFFFFF" fillOpacity={0.45} height={3} key={`inner-caustic-${markerIndex}`} transform={markerTransform(innerTop, progress)} width={3} x={-1.5} y={-1.5} />;
      })}
    </g>
  );
}
