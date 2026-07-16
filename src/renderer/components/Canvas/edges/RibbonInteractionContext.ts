import { useSyncExternalStore } from 'react';

import type { RelationshipType } from '../../../../shared/types';

export type RibbonInteractionState = { focus: RelationshipType | null; isDragging: boolean };

let state: RibbonInteractionState = { focus: null, isDragging: false };
const listeners = new Set<() => void>();

export function setRibbonInteraction(next: RibbonInteractionState) {
  if (state.focus === next.focus && state.isDragging === next.isDragging) return;
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
