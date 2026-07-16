import { Eye, FolderSearch, LayoutPanelTop, Network, RefreshCw, Trash2, X } from 'lucide-react';

import type { RelationshipType } from '../../../shared/types';

export type CanvasMenuTarget = { id: string; type: 'fileCard' | 'hub' | 'summaryCard'; relationshipType?: RelationshipType };

type CanvasContextMenuProps = {
  position: { x: number; y: number };
  target: CanvasMenuTarget;
  onClose: () => void;
  onHighlight: (type: RelationshipType) => void;
  onPreview: () => void;
  onOpen: () => void;
  onReveal: () => void;
  onReanalyze: () => void;
  onRemove: () => void;
  onReorganize: () => void;
};

function MenuItem({ children, danger = false, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button className={`flex w-full items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[12px] transition ${danger ? 'text-[#C63D32] hover:bg-[#FFF0EE]' : 'text-[#48484D] hover:bg-[#F3F2F0]'}`} onClick={onClick} type="button">{children}</button>;
}

export default function CanvasContextMenu({ position, target, onClose, onHighlight, onPreview, onOpen, onReveal, onReanalyze, onRemove, onReorganize }: CanvasContextMenuProps) {
  const act = (action: () => void) => { action(); onClose(); };
  return <aside className="absolute z-50 w-[190px] rounded-[10px] border border-[#E1DFDC] bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.15)]" role="menu" style={{ left: position.x, top: position.y }}>
    <div className="mb-1 flex items-center justify-between border-b border-[#F0EFED] px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#96969B]"><span>{target.type === 'fileCard' ? 'File card' : target.type === 'hub' ? 'Semantic hub' : 'Summary card'}</span><button aria-label="Close menu" className="text-[#A2A2A7] hover:text-[#4B4B50]" onClick={onClose} type="button"><X size={13} /></button></div>
    {target.type === 'fileCard' && <><MenuItem onClick={() => act(onPreview)}><Eye size={15} />Quick preview</MenuItem><MenuItem onClick={() => act(onOpen)}><LayoutPanelTop size={15} />Open original</MenuItem><MenuItem onClick={() => act(onReveal)}><FolderSearch size={15} />Reveal in folder</MenuItem><MenuItem onClick={() => act(onReanalyze)}><RefreshCw size={15} />Re-analyze with GPT-5.6</MenuItem><div className="my-1 h-px bg-[#F0EFED]" /><MenuItem onClick={() => act(() => onHighlight(target.relationshipType ?? 'dates'))}><Network size={15} />Highlight relationships</MenuItem><MenuItem danger onClick={() => act(onRemove)}><Trash2 size={15} />Remove from canvas</MenuItem></>}
    {target.type === 'hub' && target.relationshipType && <><MenuItem onClick={() => act(() => onHighlight(target.relationshipType!))}><Network size={15} />Highlight this flow</MenuItem><MenuItem onClick={() => act(onReorganize)}><RefreshCw size={15} />Reorganize canvas</MenuItem></>}
    {target.type === 'summaryCard' && <><MenuItem onClick={() => act(onReorganize)}><RefreshCw size={15} />Reorganize canvas</MenuItem><MenuItem onClick={() => act(onPreview)}><Eye size={15} />Highlight source files</MenuItem></>}
  </aside>;
}
