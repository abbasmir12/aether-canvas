import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

import chokidar, { type FSWatcher } from 'chokidar';

import type { FileChangedEvent, FileDeletedEvent } from '../../shared/types';

type WatchRegistration = {
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
    this.watcher.on('unlink', (filePath) => { this.handleUnlink(filePath); });
    return this.watcher;
  }

  async watch(filePath: string, fileId: string, knownHash?: string): Promise<string> {
    const normalized = resolve(filePath);
    const contentHash = knownHash || await hashFile(normalized);
    const existing = this.registrations.get(normalized);
    if (existing) {
      existing.fileIds.add(fileId);
      existing.contentHash = contentHash;
      if (existing.deletionTimer) clearTimeout(existing.deletionTimer);
      existing.deletionTimer = null;
      return contentHash;
    }
    this.registrations.set(normalized, { fileIds: new Set([fileId]), contentHash, deletionTimer: null });
    this.ensureWatcher().add(normalized);
    return contentHash;
  }

  async unwatch(filePath: string, fileId?: string): Promise<void> {
    const normalized = resolve(filePath);
    const registration = this.registrations.get(normalized);
    if (!registration) return;
    if (fileId) registration.fileIds.delete(fileId);
    if (fileId && registration.fileIds.size > 0) return;
    if (registration.deletionTimer) clearTimeout(registration.deletionTimer);
    this.registrations.delete(normalized);
    await this.watcher?.unwatch(normalized);
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
    const normalized = resolve(filePath);
    const registration = this.registrations.get(normalized);
    if (!registration) return;
    try {
      const nextHash = await hashFile(normalized);
      if (nextHash === registration.contentHash) return;
      registration.contentHash = nextHash;
      const timestamp = Date.now();
      for (const fileId of registration.fileIds) this.events.changed({ fileId, filePath: normalized, contentHash: nextHash, timestamp });
    } catch {
      this.handleUnlink(normalized);
    }
  }

  private handleUnlink(filePath: string): void {
    const normalized = resolve(filePath);
    const registration = this.registrations.get(normalized);
    if (!registration || registration.deletionTimer) return;
    registration.deletionTimer = setTimeout(() => {
      registration.deletionTimer = null;
      void fs.stat(normalized).then(() => this.handleChange(normalized)).catch(() => {
        for (const fileId of registration.fileIds) this.events.deleted({ fileId, filePath: normalized, timestamp: Date.now() });
      });
    }, 800);
  }
}
