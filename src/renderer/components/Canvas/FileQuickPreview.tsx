import { ExternalLink, FolderSearch, RefreshCw, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

import type { AnalyzedFile } from '../../../shared/types';

type FileQuickPreviewProps = {
  file: AnalyzedFile;
  onClose: () => void;
  onOpen: () => void;
  onReveal: () => void;
  onReanalyze: () => void;
};

export default function FileQuickPreview({ file, onClose, onOpen, onReveal, onReanalyze }: FileQuickPreviewProps) {
  const dates = file.entities.dates.slice(0, 2).map((date) => date.display).join(' · ');
  const locations = file.entities.locations.slice(0, 3).map((location) => location.name).join(' · ');
  const costs = file.entities.costs.slice(0, 2).map((cost) => `${cost.currency} ${cost.amount.toLocaleString()}`).join(' · ');
  return <motion.aside animate={{ opacity: 1, x: 0, scale: 1 }} className="w-[292px] rounded-[14px] border border-[#E0DEDB] bg-white p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16)]" exit={{ opacity: 0, x: 8, scale: 0.98 }} initial={{ opacity: 0, x: 8, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}><header className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#EAF3FC] text-[#4A90D9]"><Sparkles size={18} /></span><div className="min-w-0 flex-1"><h2 className="truncate text-[14px] font-semibold text-[#303034]">{file.title || file.fileName}</h2><p className="truncate text-[11px] text-[#85858B]">{file.fileName}</p></div><button aria-label="Close quick preview" className="grid h-7 w-7 place-items-center rounded-[7px] text-[#8B8B91] hover:bg-[#F3F2F0]" onClick={onClose} type="button"><X size={16} /></button></header><p className="mt-4 text-[12px] leading-5 text-[#65656B]">{file.summary}</p><div className="mt-4 space-y-2">{dates && <p className="rounded-[7px] bg-[#F6F9FD] px-2.5 py-2 text-[11px] text-[#48749E]">{dates}</p>}{locations && <p className="rounded-[7px] bg-[#FFF4F1] px-2.5 py-2 text-[11px] text-[#B65248]">{locations}</p>}{costs && <p className="rounded-[7px] bg-[#F2FAF4] px-2.5 py-2 text-[11px] text-[#337647]">{costs}</p>}</div><div className="mt-4 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-1.5 rounded-[8px] bg-[#29292D] px-2 py-2 text-[11px] font-medium text-white hover:bg-[#3A3A3E]" onClick={onOpen} type="button"><ExternalLink size={14} />Open</button><button className="flex items-center justify-center gap-1.5 rounded-[8px] border border-[#DDDAD6] px-2 py-2 text-[11px] font-medium text-[#55555A] hover:bg-[#F5F4F2]" onClick={onReveal} type="button"><FolderSearch size={14} />Reveal</button></div><button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[11px] font-medium text-[#74747A] hover:bg-[#F3F2F0] hover:text-[#39393E]" onClick={onReanalyze} type="button"><RefreshCw size={13} />Re-analyze with GPT-5.6</button></motion.aside>;
}
