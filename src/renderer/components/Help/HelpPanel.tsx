import { motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  CheckSquare,
  Clock3,
  FileSpreadsheet,
  FileText,
  Image,
  Keyboard,
  Layers3,
  LifeBuoy,
  Link2,
  Map,
  MousePointer2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const guides = [
  { icon: FileText, color: '#4A90D9', title: 'Drop real files', copy: 'PDFs, spreadsheets, images, notes, Word files, and presentations can share one canvas.' },
  { icon: BrainCircuit, color: '#9B72CF', title: 'Aether understands', copy: 'GPT-5.6 extracts grounded dates, costs, places, tasks, and useful source intelligence.' },
  { icon: Link2, color: '#34A853', title: 'Relationships appear', copy: 'Semantic streams route source facts through DATES, COST, PLACE, and TASKS hubs.' },
  { icon: Layers3, color: '#EA4335', title: 'A mini-app compiles', copy: 'Related files become an interactive dashboard designed for the project Aether discovers.' },
];

const shortcuts = [
  ['Ctrl/⌘ K', 'Search files and spaces'],
  ['Ctrl/⌘ J', 'Ask the canvas'],
  ['Ctrl/⌘ O', 'Browse for source files'],
  ['Ctrl/⌘ + / −', 'Zoom the canvas'],
  ['Ctrl/⌘ 0', 'Fit workspace to view'],
  ['Delete', 'Remove the selected canvas item'],
  ['Space + drag', 'Pan the canvas'],
];

const concepts = [
  { Icon: Sparkles, title: 'Ask the Canvas', copy: 'Answers appear spatially and trace back to the modules and files that support them.' },
  { Icon: Clock3, title: 'Living files', copy: 'External edits can update cards, relationships, and dashboard values without re-importing.' },
  { Icon: Map, title: 'Semantic hubs', copy: 'DATES, COST, PLACE, and TASKS make the reason for each connection visible.' },
  { Icon: CheckSquare, title: 'Generated mini-apps', copy: 'Dashboards remain interactive: edit budgets, check tasks, inspect maps, and export results.' },
];

export default function HelpPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  const filteredConcepts = useMemo(() => concepts.filter((concept) => `${concept.title} ${concept.copy}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <motion.div animate={{ opacity: 1 }} className="absolute inset-0 z-[80] flex justify-end bg-[#252329]/18 backdrop-blur-[5px]" data-aether-help-panel initial={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section animate={{ x: 0 }} className="h-full w-[520px] max-w-[92vw] overflow-y-auto border-l border-white/80 bg-[#FAF9F8] px-7 py-6 shadow-[-20px_0_60px_rgba(28,25,32,.18)]" initial={{ x: 70 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
        <header className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[linear-gradient(145deg,#4A90D9,#8064A3)] text-white shadow-[0_7px_16px_rgba(74,100,145,.24)]"><LifeBuoy size={19} /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#9B72CF]">Aether Guide</p><h1 className="mt-0.5 text-[23px] font-semibold tracking-[-.045em] text-[#2D2A31]">Build with your files</h1><p className="mt-1 text-[10px] text-[#8E8A92]">Everything needed to turn a blank space into a living workspace.</p></div><button aria-label="Close help" className="grid h-8 w-8 place-items-center rounded-full border border-[#E3E0E4] bg-white text-[#858189] transition hover:rotate-90 hover:text-[#343137]" onClick={onClose} type="button"><X size={15} /></button></header>

        <label className="mt-5 flex h-10 items-center gap-2 rounded-[11px] border border-[#E2DFE3] bg-white px-3 shadow-[0_2px_8px_rgba(25,25,30,.04)] focus-within:border-[#4A90D9]"><Search size={14} className="text-[#95919A]" /><input className="min-w-0 flex-1 bg-transparent text-[11px] text-[#49454D] outline-none placeholder:text-[#AAA6AD]" onChange={(event) => setQuery(event.target.value)} placeholder="Search help and concepts…" value={query} /></label>

        {!query && <>
          <section className="mt-7"><div className="mb-3 flex items-center gap-2"><span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#8D8991]">The four-step flow</span><span className="h-px flex-1 bg-[#E7E4E7]" /></div><div className="grid grid-cols-2 gap-2.5">{guides.map(({ icon: Icon, color, title, copy }, index) => <motion.div animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[14px] border border-[#E7E4E7] bg-white p-3.5 shadow-[0_3px_10px_rgba(25,25,30,.035)]" initial={{ opacity: 0, y: 5 }} key={title} transition={{ delay: index * .05 }}><span className="grid h-8 w-8 place-items-center rounded-[9px] text-white" style={{ backgroundColor: color }}><Icon size={15} /></span><b className="mt-3 block text-[11px] text-[#413D45]">{title}</b><p className="mt-1 text-[9px] leading-4 text-[#8B878F]">{copy}</p><span className="absolute right-3 top-3 text-[8px] font-semibold text-[#C0BCC2]">0{index + 1}</span></motion.div>)}</div></section>

          <section className="mt-7"><div className="mb-3 flex items-center gap-2"><Keyboard size={13} className="text-[#4A90D9]" /><span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#8D8991]">Keyboard shortcuts</span><span className="h-px flex-1 bg-[#E7E4E7]" /></div><div className="overflow-hidden rounded-[14px] border border-[#E4E1E5] bg-white">{shortcuts.map(([keys, action], index) => <div className={`flex items-center px-3.5 py-2.5 ${index ? 'border-t border-[#EFEDF0]' : ''}`} key={keys}><kbd className="min-w-[92px] text-[9px] font-semibold text-[#514B57]">{keys}</kbd><span className="text-[9px] text-[#8E8992]">{action}</span></div>)}</div></section>

          <section className="mt-7"><div className="mb-3 flex items-center gap-2"><MousePointer2 size={13} className="text-[#9B72CF]" /><span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#8D8991]">Supported sources</span><span className="h-px flex-1 bg-[#E7E4E7]" /></div><div className="flex flex-wrap gap-2">{[[FileText, 'PDF & documents', '#EA4335'], [FileSpreadsheet, 'Spreadsheets', '#34A853'], [Image, 'Images & screenshots', '#4A90D9'], [FileText, 'Notes & Markdown', '#9B72CF']].map(([Icon, label, color]) => { const SourceIcon = Icon as typeof FileText; return <span className="flex items-center gap-1.5 rounded-full border border-[#E3E0E4] bg-white px-2.5 py-1.5 text-[9px] font-medium text-[#66616A]" key={String(label)}><SourceIcon size={11} style={{ color: String(color) }} />{String(label)}</span>; })}</div></section>
        </>}

        <section className="mt-7"><div className="mb-3 flex items-center gap-2"><Sparkles size={13} className="text-[#9B72CF]" /><span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#8D8991]">{query ? 'Search results' : 'Core concepts'}</span><span className="h-px flex-1 bg-[#E7E4E7]" /></div><div className="space-y-2">{filteredConcepts.map(({ Icon, title, copy }) => <div className="group flex items-start gap-3 rounded-[13px] border border-[#E6E3E7] bg-white p-3 transition hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(25,25,30,.07)]" key={title}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#F1EDF5] text-[#8665A5]"><Icon size={14} /></span><div><b className="text-[10px] text-[#464149]">{title}</b><p className="mt-0.5 text-[9px] leading-4 text-[#8C8790]">{copy}</p></div><ArrowRight className="ml-auto mt-2 text-[#C1BDC4] transition group-hover:translate-x-0.5 group-hover:text-[#9B72CF]" size={12} /></div>)}{query && !filteredConcepts.length && <div className="rounded-[13px] border border-dashed border-[#DCD8DE] p-5 text-center text-[10px] text-[#96919A]">No help topic matched “{query}”.</div>}</div></section>

        <footer className="mt-7 rounded-[14px] border border-[#DDE5EE] bg-[#F4F8FC] p-4"><p className="text-[10px] font-semibold text-[#465566]">Demo tip</p><p className="mt-1 text-[9px] leading-4 text-[#738091]">Edit a watched budget file beside Aether and save it. The source card and generated dashboard will update together—your files are alive inside the workspace.</p></footer>
      </motion.section>
    </motion.div>
  );
}
