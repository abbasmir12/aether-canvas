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

function seededValue(seed: number): number {
  return (Math.sin(seed * 12.9898) * 43758.5453) % 1;
}

function positiveSeed(seed: number): number {
  return Math.abs(seededValue(seed));
}

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
  const terminalOuterRadius = isTrunk ? 8.5 : 7.5;
  const terminalInnerRadius = isTrunk ? 5.1 : 4.2;
  const safeId = id.replace(/[^a-z0-9]/gi, '');
  const mainGradientId = `aether-ribbon-main-${safeId}`;
  const lowerGradientId = `aether-ribbon-lower-${safeId}`;
  const outsideOnTop = targetY >= sourceY;
  const topBorderWidth = outsideOnTop ? 0.78 : 0.36;
  const bottomBorderWidth = outsideOnTop ? 0.36 : 0.78;
  const markerPattern = useMemo(() => {
    const seed = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
    const spread = (slot: number, min: number, max: number) => min + positiveSeed(seed + slot * 17.3) * (max - min);
    return {
      dots: [spread(1, 0.13, 0.23), spread(2, 0.31, 0.43), spread(3, 0.52, 0.66), spread(4, 0.74, 0.9)].sort((a, b) => a - b),
      arrows: [spread(5, 0.24, 0.38), spread(6, 0.5, 0.61), spread(7, 0.69, 0.83)].sort((a, b) => a - b),
      packets: [spread(8, 0.34, 0.5), spread(9, 0.7, 0.86)].sort((a, b) => a - b),
    };
  }, [id]);
  return (
    <g className="semantic-ribbon">
      <defs>
        <filter id={`aether-ribbon-shadow-${safeId}`} x="-30%" y="-35%" width="160%" height="180%">
          <feDropShadow dx="0" dy="2" floodColor="#000000" floodOpacity="0.08" stdDeviation="2" />
        </filter>
        <linearGradient id={mainGradientId} gradientUnits="userSpaceOnUse" x1={sourceX} x2={targetX} y1={sourceY} y2={targetY}>
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="54%" stopColor={color} stopOpacity="0.31" />
          <stop offset="100%" stopColor={color} stopOpacity={isTrunk ? "0.62" : "0.52"} />
        </linearGradient>
        <linearGradient id={lowerGradientId} gradientUnits="userSpaceOnUse" x1={sourceX} x2={targetX} y1={sourceY} y2={targetY}>
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="54%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity={isTrunk ? "0.42" : "0.34"} />
        </linearGradient>
      </defs>
      <g filter={`url(#aether-ribbon-shadow-${safeId})`}>

      {/* One defined pipe: it starts translucent at the source and gains semantic contrast at its destination. */}
      <path d={enclosedPath(outerTop, center)} fill={`url(#${mainGradientId})`} />
      <path d={enclosedPath(center, outerBottom)} fill={`url(#${lowerGradientId})`} />
      <path d={pathFor(outerTop)} fill="none" stroke={color} strokeLinecap="round" strokeOpacity={0.8} strokeWidth={isTrunk ? 1.55 : 1.25} />
      <path d={pathFor(outerBottom)} fill="none" stroke={color} strokeLinecap="round" strokeOpacity={0.72} strokeWidth={isTrunk ? 1.4 : 1.15} />
      <path d={pathFor(outerTop)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.82} strokeWidth={topBorderWidth} />
      <path d={pathFor(outerBottom)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.76} strokeWidth={bottomBorderWidth} />

      {/* Secondary inner ribbon: a quieter translucent channel nested in the main body. */}
      <path d={enclosedPath(innerTop, center)} fill="#FFFFFF" fillOpacity={0.18} />
      <path d={enclosedPath(center, innerBottom)} fill={color} fillOpacity={0.14} />
      <path d={pathFor(innerTop)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.74} strokeWidth={0.5} />
      <path d={pathFor(innerBottom)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.44} strokeWidth={0.35} />

      {/* Optical divider that makes the asymmetric halves legible. */}
      <path d={pathFor(center)} fill="none" stroke={color} strokeLinecap="round" strokeOpacity={0.82} strokeWidth={isTrunk ? 5.3 : 4.3} />
      <path d={pathFor(center)} fill="none" stroke="#131416" strokeLinecap="round" strokeOpacity={0.34} strokeWidth={isTrunk ? 3.35 : 2.75} />
      <path d={pathFor(center)} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.96} strokeWidth={isTrunk ? 1.95 : 1.58} />
      <path d={pathFor(offsetCurve(center, [-0.55, -0.65, -0.5, -0.4]))} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.74} strokeWidth={isTrunk ? 0.62 : 0.5} />

      {/* Small filled flow packets: dots and compact arrowheads are decorative data cues, never controls. */}
      {markerPattern.dots.map((progress, markerIndex) => (
        <g key={`dot-${markerIndex}`} transform={`translate(${pointAt(innerTop, progress).x} ${pointAt(innerTop, progress).y})`}>
          <circle fill="#000000" fillOpacity={0.12} r={isTrunk ? 2.75 : 2.25} transform="translate(0 0.8)" />
          <circle fill="#FFFFFF" fillOpacity={0.96} r={isTrunk ? 2.15 : 1.75} />
          <circle fill="#FFFFFF" fillOpacity={0.72} r={isTrunk ? 0.85 : 0.68} transform="translate(-0.55 -0.55)" />
        </g>
      ))}
      {markerPattern.arrows.map((progress, markerIndex) => (
        <g key={`arrow-${markerIndex}`} transform={`${markerTransform(center, progress)} translate(0 0.85)`}>
          <path d="M -3.8 -2.5 L 3.7 0 L -3.8 2.5 L -1.25 0 Z" fill="#000000" fillOpacity={0.12} />
          <path d="M -3.8 -3.15 L 3.7 -0.65 L -3.8 1.85 L -1.25 -0.65 Z" fill="#FFFFFF" fillOpacity={0.96} />
          <path d="M -2.7 -2.15 L 1.55 -0.65 L -2.7 0.75" fill="none" stroke={color} strokeOpacity={0.42} strokeWidth={0.62} />
        </g>
      ))}
      {markerPattern.packets.map((progress, markerIndex) => (
        <g key={`packet-${markerIndex}`} transform={`${markerTransform(innerBottom, progress, 45)} translate(0 0.65)`}>
          <rect fill="#000000" fillOpacity={0.1} height={3.5} rx={0.82} width={3.5} x={-1.75} y={-1.1} />
          <rect fill="#FFFFFF" fillOpacity={0.92} height={3.25} rx={0.78} width={3.25} x={-1.625} y={-2.05} />
        </g>
      ))}

      <circle cx={sourceX} cy={sourceY} fill="#FFFFFF" r={terminalOuterRadius} stroke={color} strokeOpacity={0.9} strokeWidth={1.5} />
      <circle cx={sourceX} cy={sourceY} fill={color} r={terminalInnerRadius} />
      <circle cx={targetX} cy={targetY} fill="#FFFFFF" r={terminalOuterRadius} stroke={color} strokeOpacity={0.9} strokeWidth={1.5} />
      <circle cx={targetX} cy={targetY} fill={color} r={terminalInnerRadius} />
      </g>
    </g>
  );
}
