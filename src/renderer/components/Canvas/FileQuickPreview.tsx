import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CheckSquare, CircleDollarSign, Copy, ExternalLink, File, FileText, FolderSearch, Image, MapPin, Network, RefreshCw, Sparkles, Table, X } from 'lucide-react';

import type { AnalyzedFile, FileInsightAccent } from '../../../shared/types';
import FileIntelligenceHero from './FileIntelligenceHero';
import PackingReadinessBrief from './PackingReadinessBrief';

type FileQuickPreviewProps = {
  file: AnalyzedFile;
  onClose: () => void;
  onOpen: () => void;
  onReveal: () => void;
  onReanalyze: () => void;
  onTrace: () => void;
};

const accents: Record<FileInsightAccent, { color: string; background: string; Icon: typeof CalendarDays }> = {
  dates: { color: '#4A90D9', background: '#F2F7FC', Icon: CalendarDays },
  cost: { color: '#34A853', background: '#F2F9F4', Icon: CircleDollarSign },
  place: { color: '#EA4335', background: '#FFF4F1', Icon: MapPin },
  tasks: { color: '#9B72CF', background: '#F8F4FC', Icon: CheckSquare },
  neutral: { color: '#77757D', background: '#F6F5F7', Icon: Sparkles },
};

function fileAppearance(file: AnalyzedFile) {
  const extension = file.fileName.split('.').pop()?.toLowerCase() ?? '';
  if (file.mimeType === 'application/pdf' || extension === 'pdf') return { label: 'PDF document', color: '#EA4335', background: '#FFF2F0', Icon: FileText };
  if (file.mimeType.startsWith('image/')) return { label: 'Image', color: '#34A853', background: '#F0F8F2', Icon: Image };
  if (['csv', 'xls', 'xlsx'].includes(extension)) return { label: 'Spreadsheet', color: '#34A853', background: '#F0F8F2', Icon: Table };
  return { label: 'Text file', color: '#4A90D9', background: '#EFF6FC', Icon: File };
}

function fallbackFacts(file: AnalyzedFile) {
  const facts: Array<{ label: string; value: string; accent: FileInsightAccent }> = [];
  const date = file.entities.dates[0];
  const cost = file.entities.costs[0];
  if (date) facts.push({ label: date.label || 'Date', value: date.display, accent: 'dates' });
  if (file.entities.locations.length) facts.push({ label: 'Places', value: file.entities.locations.slice(0, 2).map((item) => item.name).join(' → '), accent: 'place' });
  if (cost) facts.push({ label: cost.label || 'Amount', value: `${cost.currency} ${cost.amount.toLocaleString()}`, accent: 'cost' });
  if (file.entities.tasks.length) facts.push({ label: 'Tasks', value: `${file.entities.tasks.filter((item) => item.completed).length} of ${file.entities.tasks.length} complete`, accent: 'tasks' });
  if (file.entities.people.length) facts.push({ label: 'People', value: file.entities.people.slice(0, 2).join(', '), accent: 'neutral' });
  return facts.slice(0, 4);
}

function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileQuickPreview({ file, onClose, onOpen, onReveal, onReanalyze, onTrace }: FileQuickPreviewProps) {
  const appearance = fileAppearance(file);
  const FileIcon = appearance.Icon;
  const facts = (file.intelligence?.keyFacts.length ? file.intelligence.keyFacts : fallbackFacts(file)).slice(0, 4);
  const highlights = file.intelligence?.highlights.slice(0, 3) ?? [];
  const actions = file.intelligence?.suggestedActions.slice(0, 3) ?? [];
  const isChecklist = file.smartPreview.type === 'checklist';
  const copyBrief = async () => {
    const lines = [file.title, file.summary, ...facts.map((fact) => `${fact.label}: ${fact.value}`)];
    await navigator.clipboard.writeText(lines.join('\n'));
    window.dispatchEvent(new CustomEvent('aether:toast', { detail: 'File brief copied' }));
  };

  return <motion.aside animate={{ opacity: 1, x: 0, scale: 1 }} className="max-h-[calc(100vh-116px)] w-[382px] overflow-y-auto rounded-[20px] border border-[#D9D7DB] bg-[linear-gradient(155deg,rgba(255,255,255,.99),rgba(250,250,251,.98))] p-3 shadow-[0_26px_70px_rgba(25,25,30,.19),0_3px_10px_rgba(25,25,30,.07),inset_0_1px_0_white] [scrollbar-width:none]" exit={{ opacity: 0, x: 12, scale: 0.985 }} initial={{ opacity: 0, x: 14, scale: 0.98 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
    <header className="flex items-start gap-3 px-1 pb-3 pt-1">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-white text-white shadow-[0_5px_13px_rgba(30,30,35,.13),inset_0_1px_1px_rgba(255,255,255,.45)]" style={{ background: `linear-gradient(145deg, ${appearance.color}, ${appearance.color}D8)` }}><FileIcon size={19} strokeWidth={2.2} /></span>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="text-[8px] font-semibold uppercase tracking-[.13em]" style={{ color: appearance.color }}>{appearance.label}</span><span className="h-0.5 w-0.5 rounded-full bg-[#B7B5BA]" /><span className="text-[8px] font-medium uppercase tracking-[.11em] text-[#9A989F]">AI analyzed</span></div><h2 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-[1.2] tracking-[-.025em] text-[#29292F]">{file.title || file.fileName}</h2><p className="mt-1 truncate text-[9px] font-medium text-[#8E8C93]">{file.fileName} · {humanFileSize(file.fileSize)}</p></div>
      <button aria-label="Close quick preview" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8B8990] transition hover:bg-[#F0EFF2] hover:text-[#44434A]" onClick={onClose} type="button"><X size={16} /></button>
    </header>

    <FileIntelligenceHero file={file} />

    {isChecklist ? <PackingReadinessBrief file={file} /> : <><section className="px-1 pb-1 pt-4">
      <div className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-[7px] bg-[#F1ECF7] text-[#9B72CF]"><Sparkles size={11} /></span><span className="text-[8px] font-semibold uppercase tracking-[.14em] text-[#8C8992]">Aether read</span>{file.intelligence?.status && <span className="ml-auto rounded-full border border-[#E4E1E7] bg-white px-2 py-1 text-[8px] font-semibold text-[#65636A] shadow-[0_1px_2px_rgba(0,0,0,.03)]">{file.intelligence.status}</span>}</div>
      <p className="mt-2.5 text-[12px] font-medium leading-[1.55] tracking-[-.01em] text-[#55535B]">{file.intelligence?.headline || file.summary}</p>
    </section>

    {facts.length > 0 && <section className="mt-2 grid grid-cols-2 gap-2">{facts.map((fact, index) => { const style = accents[fact.accent] ?? accents.neutral; const Icon = style.Icon; return <motion.div className="min-w-0 rounded-[12px] border border-[#E7E5E8] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.95)]" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} key={`${fact.label}-${index}`} style={{ background: `linear-gradient(145deg,#FFFFFF,${style.background})` }} transition={{ delay: .08 + index * .04 }}><div className="flex items-center gap-1.5"><Icon size={11} style={{ color: style.color }} /><span className="truncate text-[7px] font-semibold uppercase tracking-[.12em] text-[#96949A]">{fact.label}</span></div><b className="mt-1.5 block line-clamp-2 text-[10px] font-semibold leading-[1.35] text-[#49474E]">{fact.value}</b></motion.div>; })}</section>}

    <AnimatePresence>{(highlights.length > 0 || actions.length > 0) && <motion.section animate={{ opacity: 1, height: 'auto' }} className="mt-3 rounded-[13px] border border-[#E8E6E9] bg-white/72 p-3" initial={{ opacity: 0, height: 0 }}><p className="text-[8px] font-semibold uppercase tracking-[.13em] text-[#96939A]">Useful context</p><div className="mt-2 space-y-1.5">{highlights.map((highlight) => <div className="flex gap-2 text-[9px] leading-[1.45] text-[#626068]" key={highlight}><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4A90D9]" />{highlight}</div>)}</div>{actions.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{actions.map((action) => <span className="rounded-full border border-[#E1DFE4] bg-[#F8F7F9] px-2 py-1 text-[8px] font-medium text-[#69676E]" key={action}>{action}</span>)}</div>}</motion.section>}</AnimatePresence></>}

    <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] gap-1.5 border-t border-[#E9E7EA] pt-3">
      <button className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#2D2D32] px-3 text-[10px] font-semibold text-white shadow-[0_4px_10px_rgba(35,35,40,.15)] transition hover:-translate-y-0.5 hover:bg-[#3A3A40]" onClick={onOpen} type="button"><ExternalLink size={13} />Open original</button>
      <button aria-label="Reveal in folder" className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E0DDE1] bg-white text-[#6D6B72] transition hover:-translate-y-0.5 hover:bg-[#F5F4F6]" onClick={onReveal} title="Reveal in folder" type="button"><FolderSearch size={14} /></button>
      <button aria-label="Copy file brief" className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#E0DDE1] bg-white text-[#6D6B72] transition hover:-translate-y-0.5 hover:bg-[#F5F4F6]" onClick={() => void copyBrief()} title="Copy file brief" type="button"><Copy size={14} /></button>
      <button aria-label="Trace connections" className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#DDE7F1] bg-[#F5F9FD] text-[#4A90D9] transition hover:-translate-y-0.5 hover:bg-[#ECF4FB]" onClick={onTrace} title="Trace connections" type="button"><Network size={14} /></button>
    </div>
    <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[9px] py-2 text-[9px] font-semibold text-[#85828A] transition hover:bg-[#F1F0F2] hover:text-[#46444B]" onClick={onReanalyze} type="button"><RefreshCw size={12} />Refresh intelligence with GPT-5.6</button>
  </motion.aside>;
}
