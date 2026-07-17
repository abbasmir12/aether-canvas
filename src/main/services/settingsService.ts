import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';

import { safeStorage } from 'electron';

import type {
  AetherSettings,
  AetherSettingsUpdate,
  AIReasoningEffort,
  CanvasTone,
  RibbonMode,
} from '../../shared/types';
import { configureAI } from './aiService';

type PersistedSettings = {
  version: 1;
  ribbonMode: RibbonMode;
  showMinimap: boolean;
  minimapConnectors: boolean;
  liveFileSync: boolean;
  canvasTone: CanvasTone;
  defaultZoom: number;
  model: string;
  reasoningEffort: AIReasoningEffort;
  encryptedApiKey?: string;
};

const REASONING_EFFORTS: AIReasoningEffort[] = ['none', 'low', 'medium', 'high', 'xhigh', 'max'];
const RIBBON_MODES: RibbonMode[] = ['rich', 'simple'];
const CANVAS_TONES: CanvasTone[] = ['warm', 'cool', 'paper'];

function defaults(): PersistedSettings {
  const configuredReasoning = process.env.AI_REASONING_EFFORT?.trim().toLowerCase() as AIReasoningEffort | undefined;
  return {
    version: 1,
    ribbonMode: 'rich',
    showMinimap: true,
    minimapConnectors: true,
    liveFileSync: true,
    canvasTone: 'warm',
    defaultZoom: 1,
    model: process.env.AI_MODEL?.trim() || 'gpt-5.6-luna',
    reasoningEffort: configuredReasoning && REASONING_EFFORTS.includes(configuredReasoning) ? configuredReasoning : 'low',
  };
}

export class SettingsService {
  private readonly filePath: string;
  private settings: PersistedSettings = defaults();
  private loaded = false;
  private updateQueue: Promise<void> = Promise.resolve();

  constructor(userDataPath: string) {
    this.filePath = join(userDataPath, 'aether-settings.json');
  }

  async initialize(): Promise<AetherSettings> {
    if (!this.loaded) {
      try {
        const parsed = JSON.parse(await fs.readFile(this.filePath, 'utf8')) as Partial<PersistedSettings>;
        this.settings = this.sanitize(parsed);
      } catch {
        this.settings = defaults();
      }
      this.loaded = true;
    }
    this.applyAIConfiguration();
    return this.publicSettings();
  }

  async get(): Promise<AetherSettings> {
    return this.initialize();
  }

  async update(update: AetherSettingsUpdate): Promise<AetherSettings> {
    let result = this.publicSettings();
    const operation = this.updateQueue
      .catch(() => undefined)
      .then(async () => {
        result = await this.performUpdate(update);
      });
    this.updateQueue = operation;
    await operation;
    return result;
  }

  private async performUpdate(update: AetherSettingsUpdate): Promise<AetherSettings> {
    await this.initialize();
    const next = { ...this.settings };
    if (update.ribbonMode && RIBBON_MODES.includes(update.ribbonMode)) next.ribbonMode = update.ribbonMode;
    if (typeof update.showMinimap === 'boolean') next.showMinimap = update.showMinimap;
    if (typeof update.minimapConnectors === 'boolean') next.minimapConnectors = update.minimapConnectors;
    if (typeof update.liveFileSync === 'boolean') next.liveFileSync = update.liveFileSync;
    if (update.canvasTone && CANVAS_TONES.includes(update.canvasTone)) next.canvasTone = update.canvasTone;
    if (typeof update.defaultZoom === 'number' && Number.isFinite(update.defaultZoom)) next.defaultZoom = Math.min(2, Math.max(0.5, update.defaultZoom));
    if (typeof update.model === 'string' && update.model.trim()) next.model = update.model.trim().slice(0, 100);
    if (update.reasoningEffort && REASONING_EFFORTS.includes(update.reasoningEffort)) next.reasoningEffort = update.reasoningEffort;

    if (update.clearStoredApiKey) delete next.encryptedApiKey;
    const apiKey = update.apiKey?.trim();
    if (apiKey) {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Secure credential storage is unavailable on this device.');
      }
      next.encryptedApiKey = safeStorage.encryptString(apiKey).toString('base64');
    }

    this.settings = next;
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(this.settings, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporaryPath, this.filePath);
    this.applyAIConfiguration();
    return this.publicSettings();
  }

  private sanitize(input: Partial<PersistedSettings>): PersistedSettings {
    const fallback = defaults();
    return {
      version: 1,
      ribbonMode: input.ribbonMode && RIBBON_MODES.includes(input.ribbonMode) ? input.ribbonMode : fallback.ribbonMode,
      showMinimap: typeof input.showMinimap === 'boolean' ? input.showMinimap : fallback.showMinimap,
      minimapConnectors: typeof input.minimapConnectors === 'boolean' ? input.minimapConnectors : fallback.minimapConnectors,
      liveFileSync: typeof input.liveFileSync === 'boolean' ? input.liveFileSync : fallback.liveFileSync,
      canvasTone: input.canvasTone && CANVAS_TONES.includes(input.canvasTone) ? input.canvasTone : fallback.canvasTone,
      defaultZoom: typeof input.defaultZoom === 'number' ? Math.min(2, Math.max(0.5, input.defaultZoom)) : fallback.defaultZoom,
      model: typeof input.model === 'string' && input.model.trim() ? input.model.trim().slice(0, 100) : fallback.model,
      reasoningEffort: input.reasoningEffort && REASONING_EFFORTS.includes(input.reasoningEffort) ? input.reasoningEffort : fallback.reasoningEffort,
      encryptedApiKey: typeof input.encryptedApiKey === 'string' ? input.encryptedApiKey : undefined,
    };
  }

  private decryptedApiKey(): string | undefined {
    if (this.settings.encryptedApiKey && safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(this.settings.encryptedApiKey, 'base64'));
      } catch {
        return process.env.OPENAI_API_KEY;
      }
    }
    return process.env.OPENAI_API_KEY;
  }

  private applyAIConfiguration(): void {
    configureAI({
      apiKey: this.decryptedApiKey(),
      model: this.settings.model,
      reasoningEffort: this.settings.reasoningEffort,
    });
  }

  private publicSettings(): AetherSettings {
    const hasStoredKey = Boolean(this.settings.encryptedApiKey && this.decryptedApiKey());
    const hasEnvironmentKey = Boolean(process.env.OPENAI_API_KEY);
    return {
      ribbonMode: this.settings.ribbonMode,
      showMinimap: this.settings.showMinimap,
      minimapConnectors: this.settings.minimapConnectors,
      liveFileSync: this.settings.liveFileSync,
      canvasTone: this.settings.canvasTone,
      defaultZoom: this.settings.defaultZoom,
      model: this.settings.model,
      reasoningEffort: this.settings.reasoningEffort,
      apiKeyConfigured: hasStoredKey || hasEnvironmentKey,
      apiKeySource: hasStoredKey ? 'encrypted-local' : hasEnvironmentKey ? 'environment' : 'missing',
      secureStorageAvailable: safeStorage.isEncryptionAvailable(),
      settingsPath: this.filePath,
    };
  }
}

export function createSettingsService(userDataPath: string): SettingsService {
  return new SettingsService(userDataPath);
}
