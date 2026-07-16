import { useMemo } from 'react';
import type { EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';

type Point = { x: number; y: number };
type Cubic = { start: Point; controlA: Point; controlB: Point; end: Point };
type RibbonData = { relationshipType: RelationshipType; phase?: 'file' | 'summary'; index?: number };

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

function tangentFor(curve: Cubic, point: 'start' | 'controlA' | 'controlB' | 'end'): Point {
  if (point === 'start') return { x: curve.controlA.x - curve.start.x, y: curve.controlA.y - curve.start.y };
  if (point === 'controlA') return { x: curve.controlB.x - curve.start.x, y: curve.controlB.y - curve.start.y };
  if (point === 'controlB') return { x: curve.end.x - curve.controlA.x, y: curve.end.y - curve.controlA.y };
  return { x: curve.end.x - curve.controlB.x, y: curve.end.y - curve.controlB.y };
}

function offsetPoint(point: Point, tangent: Point, distance: number): Point {
  const length = Math.hypot(tangent.x, tangent.y) || 1;
  return { x: point.x - tangent.y / length * distance, y: point.y + tangent.x / length * distance };
}

function offsetCurve(curve: Cubic, distances: number[]): Cubic {
  return {
    start: offsetPoint(curve.start, tangentFor(curve, 'start'), distances[0]),
    controlA: offsetPoint(curve.controlA, tangentFor(curve, 'controlA'), distances[1]),
    controlB: offsetPoint(curve.controlB, tangentFor(curve, 'controlB'), distances[2]),
    end: offsetPoint(curve.end, tangentFor(curve, 'end'), distances[3]),
  };
}

function pointAt(curve: Cubic, progress: number): Point {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * curve.start.x + 3 * inverse ** 2 * progress * curve.controlA.x + 3 * inverse * progress ** 2 * curve.controlB.x + progress ** 3 * curve.end.x,
    y: inverse ** 3 * curve.start.y + 3 * inverse ** 2 * progress * curve.controlA.y + 3 * inverse * progress ** 2 * curve.controlB.y + progress ** 3 * curve.end.y,
  };
}

function tangentAt(curve: Cubic, progress: number): Point {
  const inverse = 1 - progress;
  return {
    x: 3 * inverse ** 2 * (curve.controlA.x - curve.start.x) + 6 * inverse * progress * (curve.controlB.x - curve.controlA.x) + 3 * progress ** 2 * (curve.end.x - curve.controlB.x),
    y: 3 * inverse ** 2 * (curve.controlA.y - curve.start.y) + 6 * inverse * progress * (curve.controlB.y - curve.controlA.y) + 3 * progress ** 2 * (curve.end.y - curve.controlB.y),
  };
}

function markerTransform(curve: Cubic, progress: number, turn = 0): string {
  const point = pointAt(curve, progress);
  const tangent = tangentAt(curve, progress);
  return `translate(${point.x} ${point.y}) rotate(${Math.atan2(tangent.y, tangent.x) * 180 / Math.PI + turn})`;
}

function ribbonCurve(sourceX: number, sourceY: number, targetX: number, targetY: number, phase: 'file' | 'summary', index: number): Cubic {
  const distance = targetX - sourceX;
  const vertical = targetY - sourceY;
  const drift = phase === 'file' ? [-24, 15, 29, -18, 9][index % 5] : [-7, 5, -4, 8][index % 4];
  const first = phase === 'file' ? [0.48, 0.58, 0.43, 0.63, 0.52][index % 5] : 0.39;
  const second = phase === 'file' ? [0.25, 0.34, 0.29, 0.22, 0.37][index % 5] : 0.35;
  return {
    start: { x: sourceX, y: sourceY },
    controlA: { x: sourceX + distance * first, y: sourceY + drift + vertical * 0.11 },
    controlB: { x: targetX - distance * second, y: targetY - drift * 0.72 - vertical * 0.14 },
    end: { x: targetX, y: targetY },
  };
}

/**
 * A semantic connection is a pair of independently shaped translucent ribbons.
 * The upper/lower boundaries are real cubic contours, so the ribbon can taper,
 * swell, and become asymmetrical through turns rather than behaving like a stroke.
 */
export default function SemanticRibbonEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const ribbon = data as RibbonData | undefined;
  const relationshipType = ribbon?.relationshipType ?? 'place';
  const color = COLORS[relationshipType];
  const phase = ribbon?.phase ?? 'file';
  const index = ribbon?.index ?? 0;
  const isTrunk = phase === 'summary';
  const curve = useMemo(() => ribbonCurve(sourceX, sourceY, targetX, targetY, phase, index), [sourceX, sourceY, targetX, targetY, phase, index]);
  const widths = isTrunk ? [12, 26, 23, 14] : [8, 20, 18, 11];
  const innerWidths = widths.map((width) => Math.max(2.6, width * 0.52));
  const centerBias = widths.map((width, position) => position === 0 || position === 3 ? 0 : width * (position === 1 ? 0.18 : -0.12));
  const outerTop = offsetCurve(curve, widths);
  const outerBottom = offsetCurve(curve, widths.map((width) => -width));
  const center = offsetCurve(curve, centerBias);
  const innerTop = offsetCurve(curve, innerWidths.map((width, position) => width + centerBias[position]));
  const innerBottom = offsetCurve(curve, innerWidths.map((width, position) => -width + centerBias[position]));
  const atmosphereTop = offsetCurve(curve, widths.map((width) => width * 1.5));
  const atmosphereBottom = offsetCurve(curve, widths.map((width) => -width * 1.5));
  const terminalOuterRadius = isTrunk ? 8.5 : 7.5;
  const terminalInnerRadius = isTrunk ? 5.1 : 4.2;
  return (
    <g className="semantic-ribbon">
      {/* A quiet color atmosphere—filled rather than blurred, so it never becomes a grey/black drop shadow. */}
      <path d={enclosedPath(atmosphereTop, atmosphereBottom)} fill={color} fillOpacity={isTrunk ? 0.065 : 0.05} />

      {/* Main ribbon: its two halves deliberately carry different weight. */}
      <path d={enclosedPath(outerTop, center)} fill={color} fillOpacity={isTrunk ? 0.25 : 0.22} />
      <path d={enclosedPath(center, outerBottom)} fill={color} fillOpacity={isTrunk ? 0.14 : 0.11} />
      <path d={pathFor(outerTop)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.68} strokeWidth={1.05} />
      <path d={pathFor(outerBottom)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.56} strokeWidth={0.95} />

      {/* Secondary inner ribbon: a quieter translucent channel nested in the main body. */}
      <path d={enclosedPath(innerTop, center)} fill="#FFFFFF" fillOpacity={0.16} />
      <path d={enclosedPath(center, innerBottom)} fill={color} fillOpacity={0.13} />
      <path d={pathFor(innerTop)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.72} strokeWidth={0.8} />
      <path d={pathFor(innerBottom)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.48} strokeWidth={0.68} />

      {/* Optical divider that makes the asymmetric halves legible. */}
      <path d={pathFor(center)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.92} strokeWidth={isTrunk ? 1.7 : 1.35} />

      {/* Small filled flow packets: dots and compact arrowheads are decorative data cues, never controls. */}
      {[0.18, 0.42, 0.67, 0.88].map((progress, markerIndex) => (
        <circle cx={pointAt(innerTop, progress).x} cy={pointAt(innerTop, progress).y} fill="#FFFFFF" fillOpacity={0.86} key={`dot-${markerIndex}`} r={isTrunk ? 1.9 : 1.55} />
      ))}
      {[0.3, 0.57, 0.79].map((progress, markerIndex) => (
        <path d="M -3.4 -2.15 L 3.2 0 L -3.4 2.15 L -1.25 0 Z" fill="#FFFFFF" fillOpacity={0.88} key={`arrow-${markerIndex}`} transform={markerTransform(center, progress)} />
      ))}
      {[0.5, 0.84].map((progress, markerIndex) => (
        <rect fill="#FFFFFF" fillOpacity={0.72} height={2.6} key={`packet-${markerIndex}`} rx={0.65} transform={markerTransform(innerBottom, progress, 45)} width={2.6} x={-1.3} y={-1.3} />
      ))}

      <circle cx={sourceX} cy={sourceY} fill="#FFFFFF" r={terminalOuterRadius} stroke={color} strokeOpacity={0.9} strokeWidth={1.5} />
      <circle cx={sourceX} cy={sourceY} fill={color} r={terminalInnerRadius} />
      <circle cx={targetX} cy={targetY} fill="#FFFFFF" r={terminalOuterRadius} stroke={color} strokeOpacity={0.9} strokeWidth={1.5} />
      <circle cx={targetX} cy={targetY} fill={color} r={terminalInnerRadius} />
    </g>
  );
}
