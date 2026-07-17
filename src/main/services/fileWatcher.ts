import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

import chokidar, { type FSWatcher } from 'chokidar';

import type { FileChangedEvent, FileDeletedEvent } from '../../shared/types';

type WatchRegistration = {
  filePath: string;
  fileIds: Set<string>;
  contentHash: string;
  deletionTimer: NodeJS.Timeout | null;
};

type FileWatcherEvents = {
  changed: (event: FileChangedEvent) => void;
  deleted: (event: FileDeletedEvent) => void;
};

export async function hashFile(filePath: string): Promise<string> {
  const contents = await fs.readFile(filePath);
  return createHash('sha256').update(contents).digest('hex');
}

export class FileWatcherService {
  private watcher: FSWatcher | null = null;
  private registrations = new Map<string, WatchRegistration>();

  constructor(private readonly events: FileWatcherEvents) {}

  private pathKey(filePath: string): string {
    const normalized = resolve(filePath);
    return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized;
  }

  private ensureWatcher(): FSWatcher {
    if (this.watcher) return this.watcher;
    this.watcher = chokidar.watch([], {
      persistent: true,
      ignoreInitial: true,
      atomic: 750,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });
    this.watcher.on('change', (filePath) => { void this.handleChange(filePath); });
    // Editors on Windows commonly save by atomically replacing the original.
    // Chokidar reports the replacement as `add`, not `change`.
    this.watcher.on('add', (filePath) => { void this.handleChange(filePath); });
    this.watcher.on('unlink', (filePath) => { this.handleUnlink(filePath); });
    return this.watcher;
  }

  async watch(filePath: string, fileId: string, knownHash?: string): Promise<string> {
    const normalized = resolve(filePath);
    const key = this.pathKey(normalized);
    const diskHash = await hashFile(normalized);
    const existing = this.registrations.get(key);
    if (existing) {
      existing.fileIds.add(fileId);
      existing.filePath = normalized;
      if (existing.deletionTimer) clearTimeout(existing.deletionTimer);
      existing.deletionTimer = null;
      if (existing.contentHash !== diskHash) {
        existing.contentHash = diskHash;
        const timestamp = Date.now();
        for (const watchedFileId of existing.fileIds) this.events.changed({ fileId: watchedFileId, filePath: normalized, contentHash: diskHash, timestamp });
      }
      return diskHash;
    }
    this.registrations.set(key, { filePath: normalized, fileIds: new Set([fileId]), contentHash: diskHash, deletionTimer: null });
    this.ensureWatcher().add(normalized);
    // Catch edits made while Aether was closed. ignoreInitial prevents Chokidar
    // from reporting these, so compare the persisted analysis hash ourselves.
    if (knownHash && knownHash !== diskHash) {
      queueMicrotask(() => this.events.changed({ fileId, filePath: normalized, contentHash: diskHash, timestamp: Date.now() }));
    }
    return diskHash;
  }

  async unwatch(filePath: string, fileId?: string): Promise<void> {
    const normalized = resolve(filePath);
    const key = this.pathKey(normalized);
    const registration = this.registrations.get(key);
    if (!registration) return;
    if (fileId) registration.fileIds.delete(fileId);
    if (fileId && registration.fileIds.size > 0) return;
    if (registration.deletionTimer) clearTimeout(registration.deletionTimer);
    this.registrations.delete(key);
    await this.watcher?.unwatch(registration.filePath);
  }

  async stopAll(): Promise<void> {
    for (const registration of this.registrations.values()) {
      if (registration.deletionTimer) clearTimeout(registration.deletionTimer);
    }
    this.registrations.clear();
    await this.watcher?.close();
    this.watcher = null;
  }

  private async handleChange(filePath: string): Promise<void> {
    const registration = this.registrations.get(this.pathKey(filePath));
    if (!registration) return;
    if (registration.deletionTimer) clearTimeout(registration.deletionTimer);
    registration.deletionTimer = null;
    try {
      const nextHash = await hashFile(registration.filePath);
      if (nextHash === registration.contentHash) return;
      registration.contentHash = nextHash;
      const timestamp = Date.now();
      for (const fileId of registration.fileIds) this.events.changed({ fileId, filePath: registration.filePath, contentHash: nextHash, timestamp });
    } catch {
      this.handleUnlink(registration.filePath);
    }
  }

  private handleUnlink(filePath: string): void {
    const registration = this.registrations.get(this.pathKey(filePath));
    if (!registration || registration.deletionTimer) return;
    registration.deletionTimer = setTimeout(() => {
      registration.deletionTimer = null;
      void fs.stat(registration.filePath).then(() => this.handleChange(registration.filePath)).catch(() => {
        for (const fileId of registration.fileIds) this.events.deleted({ fileId, filePath: registration.filePath, timestamp: Date.now() });
      });
    }, 4_000);
  }
}
