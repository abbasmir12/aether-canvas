import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { EdgeProps } from '@xyflow/react';

import type { RelationshipType } from '../../../../shared/types';
import { useRibbonInteraction } from './RibbonInteractionContext';

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
  // Pronounced hand-drawn S: opposing vertical pulls on the two control
  // points guarantee an inflection even on near-horizontal runs.
  const sway = (44 + (seed % 3) * 14) * (seed % 2 ? 1 : -1);
  const c1x = sourceX + dx * 0.5;
  const c1y = sourceY + sway;
  const c2x = targetX - dx * 0.42;
  const c2y = targetY - sway;

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
    const profile = steadyWidth ? 0.82 : 0.5 + 0.42 * Math.sin(Math.PI * t) + 0.18 * t;
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
  const satA: { x: number; y: number }[] = [];
  const satB: { x: number; y: number }[] = [];
  const center: { x: number; y: number }[] = [];

  // The ribbon swells where it turns, like liquid banking through a bend;
  // smooth the final half-widths so the outline never steps.
  const halfLefts = smoothPass(raw.map((sample, index) => {
    const swell = 1 + 0.55 * Math.tanh(Math.abs(smoothBend[index]) * 4);
    return sample.width * swell * (0.5 + (smoothBend[index] + bias) * 0.5);
  }));
  const halfRights = smoothPass(raw.map((sample, index) => {
    const swell = 1 + 0.55 * Math.tanh(Math.abs(smoothBend[index]) * 4);
    return sample.width * swell * (0.5 - (smoothBend[index] + bias) * 0.5);
  }));

  raw.forEach((sample, index) => {
    const lean = smoothBend[index] + bias; // >0 pushes mass to the left edge
    const halfLeft = halfLefts[index];
    const halfRight = halfRights[index];
    left.push({ x: sample.x + sample.nx * halfLeft, y: sample.y + sample.ny * halfLeft });
    right.push({ x: sample.x - sample.nx * halfRight, y: sample.y - sample.ny * halfRight });
    const innerHalfL = halfLeft * 0.42;
    const innerHalfR = halfRight * 0.42;
    innerL.push({ x: sample.x + sample.nx * innerHalfL, y: sample.y + sample.ny * innerHalfL });
    innerR.push({ x: sample.x - sample.nx * innerHalfR, y: sample.y - sample.ny * innerHalfR });
    // Primary band: its own stream drifting to the outside of each bend,
    // with an independent breathing width.
    const drift = lean * (halfLeft + halfRight) * 0.62;
    const satHalf = (halfLeft + halfRight) * (0.17 + 0.1 * Math.sin(Math.PI * (index / SAMPLES) * 1.7 + seed));
    satA.push({ x: sample.x + sample.nx * (drift + satHalf), y: sample.y + sample.ny * (drift + satHalf) });
    satB.push({ x: sample.x + sample.nx * (drift - satHalf), y: sample.y + sample.ny * (drift - satHalf) });
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

  // Flat terminal cuts let the ribbon disappear cleanly beneath node surfaces.
  // Semicircular caps accumulated all translucent layers into a visible
  // liquid-like bulb at DATES/COST/PLACE/TASKS hub boundaries.
  const body = polygon(left, [...right].reverse());

  return {
    body,
    saturated: polygon(satA, [...satB].reverse()),
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

function buildLitePath(sourceX: number, sourceY: number, targetX: number, targetY: number, seed: number): string {
  const dx = targetX - sourceX;
  const sway = (24 + (seed % 3) * 8) * (seed % 2 ? 1 : -1);
  return `M ${sourceX},${sourceY} C ${sourceX + dx * 0.44},${sourceY + sway} ${targetX - dx * 0.28},${targetY - sway} ${targetX},${targetY}`;
}

export default function SemanticRibbonEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const { focus, isDragging } = useRibbonInteraction();
  const ribbon = data as RibbonData | undefined;
  const color = COLORS[ribbon?.relationshipType ?? 'place'];
  const isDimmed = Boolean(focus && ribbon?.relationshipType !== focus);
  const isSummary = ribbon?.phase === 'summary';
  const index = ribbon?.index ?? 0;
  // React Flow terminates at the mathematical handle center. The hub pill has
  // a white border/ring above the edge layer, so extend the ribbon a few pixels
  // underneath that surface to guarantee a seamless visual insertion.
  const visualSourceX = isSummary ? sourceX - 8 : sourceX;
  const visualTargetX = isSummary ? targetX : targetX + 8;

  // Every ribbon carries a different weight, like strands of unequal flow.
  const baseWidth = isSummary ? [22, 26, 20, 24][index % 4] : [24, 30, 20, 33, 26][index % 5];
  const geometry = useMemo(
    () => isDragging ? null : buildGeometry(visualSourceX, sourceY, visualTargetX, targetY, baseWidth, index, isSummary),
    [baseWidth, index, isDragging, isSummary, sourceY, targetY, visualSourceX, visualTargetX],
  );
  const litePath = useMemo(() => buildLitePath(visualSourceX, sourceY, visualTargetX, targetY, index), [index, sourceY, targetY, visualSourceX, visualTargetX]);
  const safeId = String(id).replace(/[^a-z0-9]/gi, '');
  const gradientId = `aether-ribbon-ramp-${safeId}`;
  const satGradientId = `aether-ribbon-sat-ramp-${safeId}`;

  return (
    <motion.g
      animate={{ opacity: isDimmed ? 0.16 : 1 }}
      className="semantic-ribbon"
      initial={false}
      transition={{ duration: isDragging ? 0 : 0.14, ease: 'easeOut' }}
    >
      {isDragging && <path d={litePath} fill="none" stroke={color} strokeLinecap="round" strokeOpacity={0.42} strokeWidth={2.5} />}
      {!isDragging && geometry && <>
      <defs>
        {/* Opacity ramps from a near-transparent source to strong color at the hub. */}
        <linearGradient gradientUnits="userSpaceOnUse" id={gradientId} x1={visualSourceX} x2={visualTargetX} y1={sourceY} y2={targetY}>
          <stop offset="0%" stopColor={color} stopOpacity={0.05} />
          <stop offset="55%" stopColor={color} stopOpacity={0.14} />
          <stop offset="86%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.46} />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={satGradientId} x1={visualSourceX} x2={visualTargetX} y1={sourceY} y2={targetY}>
          <stop offset="0%" stopColor={color} stopOpacity={0.07} />
          <stop offset="55%" stopColor={color} stopOpacity={0.2} />
          <stop offset="86%" stopColor={color} stopOpacity={0.42} />
          <stop offset="100%" stopColor={color} stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* soft grounded shadow under the whole ribbon */}
      <path d={geometry.body} fill="#3B382F" opacity={0.03} transform="translate(0,2)" />
      {/* glass main body; flat terminal cuts tuck cleanly beneath node surfaces */}
      <path d={geometry.body} fill={`url(#${gradientId})`} />
      {/* primary band — its own stream pooling on the outside of each bend */}
      <path d={geometry.saturated} fill={`url(#${satGradientId})`} />
      {/* secondary inner ribbon */}
      <path d={geometry.inner} fill={color} opacity={0.1} />
      {/* white light lines: outer edges, inner edges */}
      <path d={geometry.edgeLeft} fill="none" stroke="#FFFFFF" strokeLinecap="butt" strokeOpacity={0.75} strokeWidth={1.6} />
      <path d={geometry.edgeRight} fill="none" stroke="#FFFFFF" strokeLinecap="butt" strokeOpacity={0.6} strokeWidth={1.2} />
      <path d={geometry.innerLeft} fill="none" stroke="#FFFFFF" strokeLinecap="butt" strokeOpacity={0.4} strokeWidth={0.9} />
      <path d={geometry.innerRight} fill="none" stroke="#FFFFFF" strokeLinecap="butt" strokeOpacity={0.35} strokeWidth={0.9} />
      {/* center spine: dark under-stroke gives it lift, white line divides the halves */}
      <path d={geometry.spine} fill="none" stroke="#33323C" strokeLinecap="butt" strokeOpacity={0.14} strokeWidth={4} transform="translate(0,1)" />
      <path d={geometry.spine} fill="none" stroke="#FFFFFF" strokeLinecap="butt" strokeOpacity={0.9} strokeWidth={2.2} />
      {geometry.markers.map((marker, markerIndex) => (
        <FlowMarker key={`m-${markerIndex}`} opacity={0.92} {...marker} />
      ))}
      {geometry.edgeMarkers.map((marker, markerIndex) => (
        <FlowMarker key={`e-${markerIndex}`} opacity={0.55} {...marker} />
      ))}
      {/* one bold anchor dot per card, like the reference: colored circle in a white ring */}
      {index === 0 && !isSummary && (
        <>
          <circle cx={sourceX} cy={sourceY} fill="#3B382F" opacity={0.18} r={9.5} transform="translate(0,1.5)" />
          <circle cx={sourceX} cy={sourceY} fill={color} r={8} stroke="#FFFFFF" strokeWidth={3} />
        </>
      )}
      </>}
    </motion.g>
  );
}
