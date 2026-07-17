import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Clock3, Link2Off, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { FileSyncStatus } from '../../../../shared/types';

const statusColor: Record<FileSyncStatus, string> = {
  synced: '#34A853',
  syncing: '#4A90D9',
  pending: '#F59E0B',
  deleted: '#EA4335',
  paused: '#F59E0B',
  unwatched: '#9E9E9E',
};

function relativeTime(timestamp?: number): string {
  if (!timestamp) return 'just now';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export default function FileSyncIndicator({ status, timestamp, filePath }: { status: FileSyncStatus; timestamp?: number; filePath: string }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    if (status !== 'synced') return;
    const timer = window.setInterval(() => refresh((value) => value + 1), 5_000);
    return () => window.clearInterval(timer);
  }, [status]);
  const complete = status === 'synced' && timestamp !== undefined && Date.now() - timestamp < 2_000;
  const message = status === 'synced' ? `In sync · Last checked ${relativeTime(timestamp)}` : status === 'syncing' ? 'Updating · Reading changes…' : status === 'pending' ? 'File changed · Waiting to sync…' : status === 'deleted' ? `Source deleted · ${filePath}` : status === 'paused' ? 'Sync paused · API rate guard' : 'Not watching';
  return <span className="group/sync relative ml-auto grid h-5 w-5 shrink-0 place-items-center" data-sync-status={status} title={message}>
    <AnimatePresence mode="wait">
      {complete ? <motion.span animate={{ opacity: 1, scale: 1 }} className="grid h-[15px] w-[15px] place-items-center rounded-full bg-[#34A853] text-white shadow-[0_2px_5px_rgba(52,168,83,.28)]" initial={{ opacity: 0, scale: 0.65 }} key="complete"><Check size={9} strokeWidth={3} /></motion.span>
        : status === 'syncing' ? <motion.span animate={{ rotate: 360 }} className="text-[#4A90D9]" key="syncing" transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}><LoaderCircle size={13} strokeWidth={2.2} /></motion.span>
          : status === 'deleted' ? <AlertTriangle className="text-[#EA4335]" key="deleted" size={13} />
            : status === 'paused' ? <Clock3 className="text-[#D18B08]" key="paused" size={12} />
              : status === 'unwatched' ? <Link2Off className="text-[#A0A0A4]" key="unwatched" size={11} />
                : <motion.span animate={status === 'pending' ? { opacity: [0.45, 1, 0.45] } : undefined} className="h-1.5 w-1.5 rounded-full ring-2 ring-white" key={status} style={{ backgroundColor: statusColor[status] }} transition={{ duration: 1.1, repeat: Infinity }} />}
    </AnimatePresence>
    <span className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden w-max max-w-[230px] rounded-[8px] border border-[#DFDEE2] bg-[#2F2F33] px-2.5 py-1.5 text-[9px] font-medium leading-4 text-white shadow-[0_6px_18px_rgba(0,0,0,.18)] group-hover/sync:block">{message}</span>
  </span>;
}
