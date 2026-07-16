import { useMemo } from 'react';

import type { AnalyzedFile, RelationshipType } from '../../shared/types';

export type HubLayout = { type: RelationshipType; x: number; y: number; delay: number };
export type AutoLayout = { filePositions: Map<string, { x: number; y: number }>; hubs: HubLayout[]; summaryPosition: { x: number; y: number } };

const FILE_X = 90;
const HUB_X = 510;
const SUMMARY_X = 720;
const FILE_TOP = 65;
const CARD_GAP = 30;
const CARD_HEIGHT = 195;
const HUB_ORDER: RelationshipType[] = ['dates', 'cost', 'place', 'tasks'];

function categoriesFor(file: AnalyzedFile): RelationshipType[] {
  const types: RelationshipType[] = [];
  if (file.entities.dates.length) types.push('dates');
  if (file.entities.costs.length) types.push('cost');
  if (file.entities.locations.length) types.push('place');
  if (file.entities.tasks.length) types.push('tasks');
  return types;
}

export function categoriesForFile(file: AnalyzedFile): RelationshipType[] {
  return categoriesFor(file);
}

export function calculateAutoLayout(files: AnalyzedFile[]): AutoLayout {
    // Order the file column to roughly follow hub order so ribbons flow to
    // their hubs with minimal crossing, as in the design reference.
    const hubRank = (file: AnalyzedFile) => {
      const categories = categoriesFor(file);
      if (!categories.length) return HUB_ORDER.length;
      return categories.reduce((sum, type) => sum + HUB_ORDER.indexOf(type), 0) / categories.length;
    };
    const orderedFiles = [...files].sort((a, b) => hubRank(a) - hubRank(b) || a.fileName.localeCompare(b.fileName));
    const filePositions = new Map(orderedFiles.map((file, index) => [file.id, { x: FILE_X, y: FILE_TOP + index * (CARD_HEIGHT + CARD_GAP) }]));
    const used = new Set(orderedFiles.flatMap(categoriesFor));
    const categories = HUB_ORDER.filter((category) => used.has(category));
    const fileBlockHeight = Math.max(CARD_HEIGHT, orderedFiles.length * (CARD_HEIGHT + CARD_GAP) - CARD_GAP);
    const hubBlockHeight = Math.max(44, categories.length * 104 - 60);
    const hubTop = FILE_TOP + Math.max(0, (fileBlockHeight - hubBlockHeight) / 2);
    const hubs = categories.map((type, index) => ({ type, x: HUB_X, y: hubTop + index * 104, delay: 0.3 + index * 0.05 }));
    return { filePositions, hubs, summaryPosition: { x: SUMMARY_X, y: Math.max(28, FILE_TOP + fileBlockHeight / 2 - 175) } };
}

export default function useAutoLayout(files: AnalyzedFile[]): AutoLayout {
  return useMemo(() => calculateAutoLayout(files), [files]);
}
