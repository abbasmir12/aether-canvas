/// <reference types="vite/client" />

import type { AetherBridge } from '../shared/types';

declare global {
  interface Window {
    aether: AetherBridge;
  }
}

export {};
