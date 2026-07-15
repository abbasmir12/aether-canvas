import { motion } from 'framer-motion';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

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
  glyph: string;
};

function fileKind(fileName: string, mimeType: string): FileKind {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return { label: 'PDF', color: '#D64035', glyph: 'A' };
  }

  if (mimeType.startsWith('image/')) {
    return { label: 'IMG', color: '#4A90D9', glyph: '◇' };
  }

  if (['csv', 'xls', 'xlsx'].includes(extension)) {
    return { label: 'SHEET', color: '#24965B', glyph: '▦' };
  }

  return { label: 'TEXT', color: '#6E63B6', glyph: '≡' };
}

export default function FileCardNode({ data, selected }: NodeProps<FileCardNodeType>) {
  const kind = fileKind(data.fileName, data.mimeType);
  const preview = data.analysis?.smartPreview;

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
      className={`w-[220px] overflow-hidden rounded-[12px] border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow] ${
        selected
          ? 'border-[#4A90D9] shadow-[0_5px_18px_rgba(74,144,217,0.18)]'
          : 'border-[#D8D8DC]'
      }`}
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      layout
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <Handle
        className="!h-3 !w-3 !border-2 !border-white !bg-[#4A90D9] !shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        position={Position.Left}
        type="target"
      />
      <Handle
        className="!h-3 !w-3 !border-2 !border-white !bg-[#4A90D9] !shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        id="top"
        position={Position.Top}
        type="target"
      />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: kind.color }}
          title={kind.label}
        >
          {kind.glyph}
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
      <Handle
        className="!h-3 !w-3 !border-2 !border-white !bg-[#4A90D9] !shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        position={Position.Right}
        type="source"
      />
    </motion.article>
  );
}
