import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';

type RibbonData = { relationshipType: RelationshipType; phase?: 'file' | 'summary'; index?: number };

const COLORS: Record<RelationshipType, string> = {
  dates: '#4A90D9',
  cost: '#34A853',
  place: '#EA4335',
  tasks: '#9B72CF',
};

const SAMPLES = 40;

type Sample = {
  x: number;
  y: number;
  nx: number; // unit normal
  ny: number;
  angle: number; // tangent angle in degrees
  bend: number; // smoothed signed curvature, -1..1
  width: number; // full ribbon width at this point
};

type Geometry = {
  body: string;
  saturated: string;
  inner: string;
  edgeLeft: string;
  edgeRight: string;
  innerLeft: string;
  innerRight: string;
  spine: string;
  markers: { x: number; y: number; angle: number; size: number }[];
  edgeMarkers: { x: number; y: number; angle: number; size: number }[];
};

function cubicPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function cubicDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

function cubicSecond(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return 6 * u * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1);
}

function polyline(points: { x: number; y: number }[]): string {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

function polygon(forward: { x: number; y: number }[], backward: { x: number; y: number }[]): string {
  return `${polyline(forward)} ${backward.map((point) => `L ${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')} Z`;
}

function buildGeometry(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  maxWidth: number,
  seed: number,
  steadyWidth: boolean,
): Geometry {
  const dx = targetX - sourceX;
  // Lazy horizontal S-curve; asymmetric control points keep the exit from the
  // card gentler than the turn into the hub, so bends read hand-drawn.
  const c1x = sourceX + dx * 0.42;
  const c1y = sourceY + (seed % 2 ? 6 : -5);
  const c2x = targetX - dx * 0.24;
  const c2y = targetY;

  const raw: Sample[] = [];
  for (let index = 0; index <= SAMPLES; index += 1) {
    const t = index / SAMPLES;
    const x = cubicPoint(t, sourceX, c1x, c2x, targetX);
    const y = cubicPoint(t, sourceY, c1y, c2y, targetY);
    const dxdt = cubicDerivative(t, sourceX, c1x, c2x, targetX);
    const dydt = cubicDerivative(t, sourceY, c1y, c2y, targetY);
    const d2x = cubicSecond(t, sourceX, c1x, c2x, targetX);
    const d2y = cubicSecond(t, sourceY, c1y, c2y, targetY);
    const speed = Math.hypot(dxdt, dydt) || 1;
    const cross = dxdt * d2y - dydt * d2x;
    const curvature = cross / (speed * speed * speed);
    // River profile: narrow at the source, widest mid-flow, medium at the mouth.
    const profile = steadyWidth ? 0.82 : 0.52 + 0.48 * Math.sin(Math.PI * t) + 0.16 * t;
    raw.push({
      x,
      y,
      nx: -dydt / speed,
      ny: dxdt / speed,
      angle: (Math.atan2(dydt, dxdt) * 180) / Math.PI,
      bend: curvature * 900,
      width: maxWidth * Math.min(profile, 1.12),
    });
  }

  // Smooth the curvature signal so the saturated half migrates gradually
  // across the inflection instead of snapping sides.
  const smoothPass = (values: number[]) => values.map((_, index) => {
    let sum = 0;
    let count = 0;
    for (let k = -9; k <= 9; k += 1) {
      if (values[index + k] !== undefined) { sum += values[index + k]; count += 1; }
    }
    return sum / count;
  });
  const smoothBend = smoothPass(smoothPass(raw.map((sample) => sample.bend))).map(
    (value) => Math.tanh(value / 0.22) * 0.22,
  );

  const bias = seed % 2 ? 0.1 : -0.1;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  const innerL: { x: number; y: number }[] = [];
  const innerR: { x: number; y: number }[] = [];
  const sat: { x: number; y: number }[] = [];
  const center: { x: number; y: number }[] = [];

  raw.forEach((sample, index) => {
    const lean = smoothBend[index] + bias; // >0 pushes mass to the left edge
    const halfLeft = sample.width * (0.5 + lean * 0.5);
    const halfRight = sample.width * (0.5 - lean * 0.5);
    left.push({ x: sample.x + sample.nx * halfLeft, y: sample.y + sample.ny * halfLeft });
    right.push({ x: sample.x - sample.nx * halfRight, y: sample.y - sample.ny * halfRight });
    const innerHalfL = halfLeft * 0.42;
    const innerHalfR = halfRight * 0.42;
    innerL.push({ x: sample.x + sample.nx * innerHalfL, y: sample.y + sample.ny * innerHalfL });
    innerR.push({ x: sample.x - sample.nx * innerHalfR, y: sample.y - sample.ny * innerHalfR });
    // Saturated half hugs the outside of the current bend.
    const satOffset = (lean >= 0 ? halfLeft : -halfRight) * 0.85;
    sat.push({ x: sample.x + sample.nx * satOffset, y: sample.y + sample.ny * satOffset });
    center.push({ x: sample.x, y: sample.y });
  });

  const markerFor = (t: number, size: number) => {
    const index = Math.round(t * SAMPLES);
    const sample = raw[Math.min(SAMPLES, Math.max(0, index))];
    return { x: sample.x, y: sample.y, angle: sample.angle, size };
  };
  const markerSizes = [2.6, 3.4, 2.3, 3.8, 2.9, 3.5, 2.5];
  const markerCount = Math.max(2, Math.min(6, Math.round(Math.hypot(dx, targetY - sourceY) / 78)));
  const markers = Array.from({ length: markerCount }, (_, index) =>
    markerFor((index + 0.7) / (markerCount + 0.4), markerSizes[(index + seed) % markerSizes.length]),
  );
  const edgeMarkers = [0.3, 0.62].map((t, index) => {
    const sampleIndex = Math.round(t * SAMPLES);
    const sample = raw[sampleIndex];
    const point = innerL[sampleIndex];
    return { x: point.x, y: point.y, angle: sample.angle, size: 2.2 + ((index + seed) % 2) * 0.7 };
  });

  return {
    body: polygon(left, [...right].reverse()),
    saturated: polygon(center, [...sat].reverse()),
    inner: polygon(innerL, [...innerR].reverse()),
    edgeLeft: polyline(left),
    edgeRight: polyline(right),
    innerLeft: polyline(innerL),
    innerRight: polyline(innerR),
    spine: polyline(center),
    markers,
    edgeMarkers,
  };
}

function FlowMarker({ x, y, angle, size, opacity }: { x: number; y: number; angle: number; size: number; opacity: number }) {
  const chevron = `M ${size},0 L ${-size * 0.7},${size * 0.72} L ${-size * 0.32},0 L ${-size * 0.7},${-size * 0.72} Z`;
  return (
    <g transform={`translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${angle.toFixed(1)})`}>
      <path d={chevron} fill="#3B3B40" opacity={opacity * 0.16} transform="translate(0.3,0.6)" />
      <path d={chevron} fill="#FFFFFF" opacity={opacity} />
    </g>
  );
}

export default function SemanticRibbonEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const ribbon = data as RibbonData | undefined;
  const color = COLORS[ribbon?.relationshipType ?? 'place'];
  const isSummary = ribbon?.phase === 'summary';
  const index = ribbon?.index ?? 0;
  const drawDelay = (isSummary ? 1.4 : 0.45) + index * 0.08;

  const geometry = useMemo(
    () => buildGeometry(sourceX, sourceY, targetX, targetY, isSummary ? 24 : 27, index, isSummary),
    [index, isSummary, sourceX, sourceY, targetX, targetY],
  );

  return (
    <motion.g
      animate={{ opacity: 1 }}
      className="semantic-ribbon"
      initial={{ opacity: 0 }}
      transition={{ delay: drawDelay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* soft grounded shadow under the whole ribbon */}
      <path d={geometry.body} fill="#3B382F" opacity={0.03} transform="translate(0,2)" />
      {/* glass main body */}
      <path d={geometry.body} fill={color} opacity={0.13} />
      {/* saturated half — pools on the outside of each bend */}
      <path d={geometry.saturated} fill={color} opacity={0.16} />
      {/* secondary inner ribbon */}
      <path d={geometry.inner} fill={color} opacity={0.12} />
      {/* white light lines: outer edges, inner edges */}
      <path d={geometry.edgeLeft} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.75} strokeWidth={1.6} />
      <path d={geometry.edgeRight} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.6} strokeWidth={1.2} />
      <path d={geometry.innerLeft} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.4} strokeWidth={0.9} />
      <path d={geometry.innerRight} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.35} strokeWidth={0.9} />
      {/* center spine: dark under-stroke gives it lift, white line divides the halves */}
      <path d={geometry.spine} fill="none" stroke="#33323C" strokeLinecap="round" strokeOpacity={0.14} strokeWidth={4} transform="translate(0,1)" />
      <path d={geometry.spine} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.9} strokeWidth={2.2} />
      {geometry.markers.map((marker, markerIndex) => (
        <FlowMarker key={`m-${markerIndex}`} opacity={0.92} {...marker} />
      ))}
      {geometry.edgeMarkers.map((marker, markerIndex) => (
        <FlowMarker key={`e-${markerIndex}`} opacity={0.55} {...marker} />
      ))}
    </motion.g>
  );
}
