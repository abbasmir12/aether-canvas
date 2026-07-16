import { motion } from 'framer-motion';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { File, FileText, Image, Table } from 'lucide-react';

import type { AnalyzedFile } from '../../../../shared/types';
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

  const smartPreview = preview ? (() => {
    switch (preview.type) {
      case 'flight':
        return <FlightPreview preview={preview} />;
      case 'hotel':
        return <HotelPreview preview={preview} thumbnailUrl={data.thumbnailUrl} />;
      case 'budget':
        return <BudgetPreview preview={preview} />;
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
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`relative w-[220px] rounded-[12px] border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow] ${
        selected
          ? 'border-[#4A90D9] shadow-[0_5px_18px_rgba(74,144,217,0.18)]'
          : 'border-[#D8D8DC]'
      }`}
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overflow-hidden rounded-[11px]">
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
        {data.status === 'loading' && (
          <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-[#4A90D9]" />
        )}
      </div>
      {data.status === 'loading' && <LoadingPreview />}
      {data.status === 'ready' && smartPreview}
      {data.status === 'error' && (
        <div className="mx-2.5 mb-2.5 rounded-[7px] bg-[#FFF3F1] px-3 py-2 text-[9px] leading-4 text-[#A13B31]">
          {data.errorMessage ?? 'Aether could not analyze this file.'}
        </div>
      )}
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
