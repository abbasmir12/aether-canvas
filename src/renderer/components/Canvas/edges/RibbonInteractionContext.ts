import { useSyncExternalStore } from 'react';

import type { RelationshipType } from '../../../../shared/types';

export type RibbonInteractionState = { focus: RelationshipType | null; isDragging: boolean; rich: boolean };

let state: RibbonInteractionState = { focus: null, isDragging: false, rich: true };
const listeners = new Set<() => void>();

export function setRibbonInteraction(next: RibbonInteractionState) {
  if (state.focus === next.focus && state.isDragging === next.isDragging && state.rich === next.rich) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export function useRibbonInteraction() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
    () => state,
  );
}
