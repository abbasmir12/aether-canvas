import { useEffect, useRef } from 'react';

import type { AnalyzedFile, FileChangedEvent, FileDeletedEvent, FileSyncChange, FileSyncStatus } from '../../shared/types';
import { describeAnalysisChange } from '../utils/analysisDiff';

type WatchedSource = { id: string; filePath: string; contentHash?: string };

type LiveFileSyncOptions = {
  workspaceId?: string;
  sources: WatchedSource[];
  analyzedFiles: AnalyzedFile[];
  getFile: (fileId: string) => AnalyzedFile | undefined;
  onStatus: (fileId: string, status: FileSyncStatus, timestamp?: number) => void;
  onAnalysis: (fileId: string, analysis: AnalyzedFile, thumbnailUrl: string | null, change?: FileSyncChange) => void;
  onDeleted: (event: FileDeletedEvent) => void;
  onBatchComplete: () => void | Promise<void>;
  onMessage: (message: string) => void;
};

const SAME_FILE_COOLDOWN = 3_000;
const BATCH_SETTLE = 2_000;
const RATE_WINDOW = 60_000;
const MAX_CALLS = 10;

export function useLiveFileSync(options: LiveFileSyncOptions): void {
  const optionsRef = useRef(options);
  const pending = useRef(new Map<string, FileChangedEvent>());
  const running = useRef(new Set<string>());
  const lastRun = useRef(new Map<string, number>());
  const callTimes = useRef<number[]>([]);
  const retryCounts = useRef(new Map<string, number>());
  const fileTimers = useRef(new Map<string, number>());
  const batchTimer = useRef<number | null>(null);
  const watchedSources = useRef(new Map<string, WatchedSource>());
  const watchGeneration = useRef(0);
  optionsRef.current = options;

  const sourceSignature = options.sources.map((source) => `${source.id}:${source.filePath}`).sort().join('|');

  useEffect(() => {
    const current = optionsRef.current;
    const generation = ++watchGeneration.current;
    const next = new Map(current.sources.map((source) => [source.id, source]));
    const previous = watchedSources.current;
    watchedSources.current = next;
    for (const [fileId, source] of previous) {
      const replacement = next.get(fileId);
      if (!replacement || replacement.filePath !== source.filePath) void window.aether.fileWatcher.unwatch(source.filePath, fileId);
    }
    if (!current.workspaceId) return;
    void window.aether.hydrateAnalyzedFiles(current.analyzedFiles).then(async () => {
      await Promise.allSettled(current.sources.map(async (source) => {
        const alreadyWatching = previous.get(source.id)?.filePath === source.filePath;
        if (alreadyWatching) return source.contentHash ?? '';
        try {
          const hash = await window.aether.fileWatcher.watch(source.filePath, source.id, source.contentHash);
          if (!hash) {
            if (watchGeneration.current === generation) current.onDeleted({ fileId: source.id, filePath: source.filePath, timestamp: Date.now() });
            return '';
          }
          if (watchGeneration.current === generation) current.onStatus(source.id, 'synced', Date.now());
          return hash;
        } catch {
          if (watchGeneration.current === generation) current.onDeleted({ fileId: source.id, filePath: source.filePath, timestamp: Date.now() });
          return '';
        }
      }));
    });
  }, [options.workspaceId, sourceSignature]);

  useEffect(() => () => {
    for (const [fileId, source] of watchedSources.current) void window.aether.fileWatcher.unwatch(source.filePath, fileId);
    watchedSources.current.clear();
  }, []);

  useEffect(() => {
    const scheduleBatch = () => {
      if (batchTimer.current !== null) window.clearTimeout(batchTimer.current);
      batchTimer.current = window.setTimeout(() => {
        if (running.current.size || pending.current.size) { scheduleBatch(); return; }
        void optionsRef.current.onBatchComplete();
      }, BATCH_SETTLE);
    };

    const run = async (fileId: string) => {
      if (running.current.has(fileId)) return;
      const event = pending.current.get(fileId);
      if (!event) return;
      const now = Date.now();
      callTimes.current = callTimes.current.filter((timestamp) => now - timestamp < RATE_WINDOW);
      if (callTimes.current.length >= MAX_CALLS) {
        optionsRef.current.onStatus(fileId, 'paused');
        optionsRef.current.onMessage('Sync paused — API rate guard');
        const delay = Math.max(1_000, RATE_WINDOW - (now - callTimes.current[0]));
        const timer = window.setTimeout(() => { fileTimers.current.delete(fileId); void run(fileId); }, delay);
        fileTimers.current.set(fileId, timer);
        return;
      }
      const cooldown = Math.max(0, SAME_FILE_COOLDOWN - (now - (lastRun.current.get(fileId) ?? 0)));
      if (cooldown > 0) {
        const timer = window.setTimeout(() => { fileTimers.current.delete(fileId); void run(fileId); }, cooldown);
        fileTimers.current.set(fileId, timer);
        return;
      }

      pending.current.delete(fileId);
      running.current.add(fileId);
      callTimes.current.push(Date.now());
      optionsRef.current.onStatus(fileId, 'syncing', event.timestamp);
      try {
        const previous = optionsRef.current.getFile(fileId);
        const [analysis, thumbnailUrl] = await Promise.all([
          window.aether.analyzeFile(event.filePath, fileId),
          window.aether.getThumbnail(event.filePath),
        ]);
        const change = previous ? describeAnalysisChange(previous, analysis) : undefined;
        optionsRef.current.onAnalysis(fileId, analysis, thumbnailUrl, change);
        retryCounts.current.delete(fileId);
        optionsRef.current.onStatus(fileId, 'synced', Date.now());
        optionsRef.current.onMessage(`${analysis.fileName} updated`);
        scheduleBatch();
      } catch {
        const attempt = (retryCounts.current.get(fileId) ?? 0) + 1;
        retryCounts.current.set(fileId, attempt);
        if (attempt <= 2) {
          pending.current.set(fileId, event);
          optionsRef.current.onStatus(fileId, 'pending', event.timestamp);
          optionsRef.current.onMessage('Sync delayed — retrying automatically');
        } else {
          retryCounts.current.delete(fileId);
          optionsRef.current.onStatus(fileId, 'paused');
          optionsRef.current.onMessage('Couldn’t sync this file right now');
        }
      } finally {
        running.current.delete(fileId);
        lastRun.current.set(fileId, Date.now());
        if (pending.current.has(fileId)) {
          const timer = window.setTimeout(() => { fileTimers.current.delete(fileId); void run(fileId); }, SAME_FILE_COOLDOWN);
          fileTimers.current.set(fileId, timer);
        }
      }
    };

    const unlistenChanged = window.aether.fileWatcher.onFileChanged((event) => {
      const queued = pending.current.get(event.fileId);
      if (!queued || queued.contentHash !== event.contentHash) retryCounts.current.delete(event.fileId);
      pending.current.set(event.fileId, event);
      optionsRef.current.onStatus(event.fileId, 'pending', event.timestamp);
      const existing = fileTimers.current.get(event.fileId);
      if (existing !== undefined) window.clearTimeout(existing);
      const delay = Math.max(0, SAME_FILE_COOLDOWN - (Date.now() - (lastRun.current.get(event.fileId) ?? 0)));
      const timer = window.setTimeout(() => { fileTimers.current.delete(event.fileId); void run(event.fileId); }, delay);
      fileTimers.current.set(event.fileId, timer);
    });
    const unlistenDeleted = window.aether.fileWatcher.onFileDeleted((event) => optionsRef.current.onDeleted(event));
    return () => {
      unlistenChanged();
      unlistenDeleted();
      for (const timer of fileTimers.current.values()) window.clearTimeout(timer);
      fileTimers.current.clear();
      if (batchTimer.current !== null) window.clearTimeout(batchTimer.current);
    };
  }, []);
}
