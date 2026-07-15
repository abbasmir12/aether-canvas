import { motion } from 'framer-motion';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export type FileCardNodeData = {
  fileName: string;
  mimeType: string;
  filePath: string;
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

  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`w-[184px] rounded-[12px] border bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow] ${
        selected
          ? 'border-[#4A90D9] shadow-[0_5px_18px_rgba(74,144,217,0.18)]'
          : 'border-[#D8D8DC]'
      }`}
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <Handle
        className="!h-3 !w-3 !border-2 !border-white !bg-[#4A90D9] !shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        position={Position.Left}
        type="target"
      />
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-[13px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: kind.color }}
          title={kind.label}
        >
          {kind.glyph}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-5 text-[#2B2B2E]">
            {data.fileName}
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-[#99999E]">
            {kind.label}
          </p>
        </div>
      </div>
      <Handle
        className="!h-3 !w-3 !border-2 !border-white !bg-[#4A90D9] !shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        position={Position.Right}
        type="source"
      />
    </motion.article>
  );
}
