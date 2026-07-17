import { AnimatePresence, motion } from 'framer-motion';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { AlertTriangle, File, FileText, Image, MapPin, Table, Trash2 } from 'lucide-react';

import type { AnalyzedFile, FileSyncChange, FileSyncStatus } from '../../../../shared/types';
import FileSyncIndicator from './FileSyncIndicator';
import BudgetPreview from './previews/BudgetPreview';
import ChecklistPreview from './previews/ChecklistPreview';
import DocumentPreview from './previews/DocumentPreview';
import FlightPreview from './previews/FlightPreview';
import GuidePreview from './previews/GuidePreview';
import HotelPreview from './previews/HotelPreview';
import LoadingPreview from './previews/LoadingPreview';

export type FileCardNodeData = {
  fileName: string;
  mimeType: string;
  filePath: string;
  status: 'loading' | 'ready' | 'error';
  analysis: AnalyzedFile | null;
  thumbnailUrl: string | null;
  errorMessage: string | null;
  syncStatus?: FileSyncStatus;
  syncCheckedAt?: number;
  syncChange?: FileSyncChange;
  syncChangedAt?: number;
  watchEnabled?: boolean;
};

export type FileCardNodeType = Node<FileCardNodeData, 'fileCard'>;

type FileKind = {
  label: string;
  color: string;
  Icon: typeof File;
};

function connectionColor(data: FileCardNodeData): string {
  switch (data.analysis?.smartPreview.type) {
    case 'flight':
    case 'hotel':
      return '#4A90D9';
    case 'budget':
      return '#34A853';
    case 'checklist':
      return '#9B72CF';
    case 'guide':
      return '#EA4335';
    default:
      break;
  }

  const entities = data.analysis?.entities;
  if (entities?.dates.length) return '#4A90D9';
  if (entities?.costs.length) return '#34A853';
  if (entities?.locations.length) return '#EA4335';
  if (entities?.tasks.length) return '#9B72CF';
  return '#4A90D9';
}

function fileKind(fileName: string, mimeType: string): FileKind {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return { label: 'PDF', color: '#EA4335', Icon: FileText };
  }

  if (mimeType.startsWith('image/')) {
    return { label: 'IMG', color: '#34A853', Icon: Image };
  }

  if (['csv', 'xls', 'xlsx'].includes(extension)) {
    return { label: 'SHEET', color: '#34A853', Icon: Table };
  }

  return { label: 'TEXT', color: '#4A90D9', Icon: FileText };
}

export default function FileCardNode({ data, selected }: NodeProps<FileCardNodeType>) {
  const kind = fileKind(data.fileName, data.mimeType);
  const FileIcon = kind.Icon;
  const preview = data.analysis?.smartPreview;
  const portColor = connectionColor(data);
  const syncStatus = data.syncStatus ?? 'unwatched';
  const recentlyChanged = Boolean(data.syncChangedAt && Date.now() - data.syncChangedAt < 4_000);

  const smartPreview = preview ? (() => {
    switch (preview.type) {
      case 'flight':
        return <FlightPreview preview={preview} />;
      case 'hotel':
        return <HotelPreview preview={preview} thumbnailUrl={data.thumbnailUrl} />;
      case 'budget':
        return <BudgetPreview preview={preview} syncChange={data.syncChange} />;
      case 'checklist':
        return <ChecklistPreview preview={preview} />;
      case 'guide':
        return <GuidePreview preview={preview} />;
      case 'image':
        return data.thumbnailUrl
          ? <HotelPreview preview={preview} thumbnailUrl={data.thumbnailUrl} />
          : <DocumentPreview preview={preview} />;
      default:
        return <DocumentPreview preview={preview} />;
    }
  })() : null;

  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, y: 0, boxShadow: syncStatus === 'syncing' ? '0 0 0 3px rgba(74,144,217,.14), 0 5px 18px rgba(74,144,217,.18)' : selected ? '0 5px 18px rgba(74,144,217,.18)' : '0 2px 8px rgba(0,0,0,.08)' }}
      className={`relative w-[220px] rounded-[12px] border bg-white transition-[border-color,box-shadow] ${syncStatus === 'deleted' ? 'border-dashed border-[#EA4335]/70' :
        selected
          ? 'border-[#4A90D9] shadow-[0_5px_18px_rgba(74,144,217,0.18)]'
          : syncStatus === 'syncing' || syncStatus === 'pending' ? 'border-[#4A90D9]/60' : 'border-[#D8D8DC]'
      }`}
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overflow-hidden rounded-[11px]">
      <AnimatePresence>{recentlyChanged && <motion.span animate={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 rounded-[11px] bg-[#F7D96C]/20" exit={{ opacity: 0 }} initial={{ opacity: 0.75 }} transition={{ delay: 0.35, duration: 1.1 }} />}</AnimatePresence>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: kind.color }}
          title={kind.label}
        >
          <FileIcon size={12} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium leading-5 text-[#2B2B2E]">
            {data.fileName}
          </p>
        </div>
        {data.syncChange && recentlyChanged && <motion.span animate={{ opacity: 1, scale: 1 }} className={`ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${data.syncChange.kind === 'number' && (data.syncChange.delta ?? 0) > 0 ? 'bg-[#FDE8E5] text-[#B83E35]' : 'bg-[#E6F4E9] text-[#2D8242]'}`} initial={{ opacity: 0, scale: 0.8 }}>{data.syncChange.kind === 'number' ? `${(data.syncChange.delta ?? 0) > 0 ? '+' : ''}${data.syncChange.delta}` : data.syncChange.kind === 'items' ? `+${data.syncChange.added ?? 0} / −${data.syncChange.removed ?? 0}` : 'Updated'}</motion.span>}
        {data.status === 'loading' && data.syncStatus !== 'syncing' && (
          <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-[#4A90D9]" />
        )}
        {(data.analysis || data.syncStatus) && <FileSyncIndicator filePath={data.filePath} status={syncStatus} timestamp={data.syncCheckedAt} />}
      </div>
      {data.status === 'loading' && <LoadingPreview />}
      {data.status === 'ready' && smartPreview}
      {data.status === 'error' && (
        <div className="mx-2.5 mb-2.5 rounded-[7px] bg-[#FFF3F1] px-3 py-2 text-[9px] leading-4 text-[#A13B31]">
          {data.errorMessage ?? 'Aether could not analyze this file.'}
        </div>
      )}
      {syncStatus === 'deleted' && <div className="mx-2.5 mb-2.5 rounded-[9px] border border-[#F1C7C2] bg-[#FFF7F5] p-2.5"><p className="flex items-center gap-1.5 text-[9px] font-semibold text-[#A93A32]"><AlertTriangle size={12} />Source file was deleted or moved</p><div className="mt-2 flex gap-1"><button className="nodrag flex items-center gap-1 rounded-[6px] bg-[#EA4335] px-2 py-1 text-[8px] font-semibold text-white" onClick={() => window.dispatchEvent(new CustomEvent('aether:file-relocate', { detail: data.filePath }))} type="button"><MapPin size={9} />Relocate</button><button className="nodrag rounded-[6px] border border-[#E5C9C5] bg-white px-2 py-1 text-[8px] font-medium text-[#7D5C58]" onClick={() => window.dispatchEvent(new CustomEvent('aether:file-keep-cached', { detail: data.filePath }))} type="button">Keep cached</button><button aria-label="Remove from canvas" className="nodrag ml-auto grid h-5 w-5 place-items-center rounded-[6px] text-[#B44A41] hover:bg-[#F8E3E0]" onClick={() => window.dispatchEvent(new CustomEvent('aether:file-remove-request', { detail: data.filePath }))} type="button"><Trash2 size={10} /></button></div></div>}
      </div>
      <Handle
        className="!z-20 !h-[18px] !w-[18px] !border-2 !border-white !opacity-100 !shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
        position={Position.Right}
        style={{ backgroundColor: portColor, right: -10, top: '50%' }}
        type="source"
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-[-10px] top-1/2 z-30 grid h-[18px] w-[18px] -translate-y-1/2 place-items-center rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.14)]" style={{ backgroundColor: portColor }}><span className="h-1.5 w-1.5 rounded-full bg-white" /></span>
    </motion.article>
  );
}
