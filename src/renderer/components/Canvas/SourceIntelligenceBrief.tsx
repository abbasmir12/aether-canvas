import { motion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, CheckSquare, CircleDollarSign, Lightbulb, MapPin, Sparkles } from 'lucide-react';

import type { FileInsightAccent, FileIntelligence } from '../../../shared/types';

const treatments: Record<FileInsightAccent, { color: string; tint: string; border: string; Icon: typeof CalendarDays }> = {
  dates: { color: '#4A90D9', tint: '#EEF6FD', border: '#D8E7F5', Icon: CalendarDays },
  cost: { color: '#34A853', tint: '#EFF8F1', border: '#D7EADB', Icon: CircleDollarSign },
  place: { color: '#EA4335', tint: '#FFF1EE', border: '#F2D9D4', Icon: MapPin },
  tasks: { color: '#9B72CF', tint: '#F6F1FB', border: '#E6DAF1', Icon: CheckSquare },
  neutral: { color: '#68666D', tint: '#F4F3F5', border: '#E3E1E5', Icon: Sparkles },
};

const signalColors = ['#4A90D9', '#EA4335', '#34A853'];

function stripPeriod(value: string): string {
  return value.trim().replace(/[.!]+$/, '');
}

export default function SourceIntelligenceBrief({ headline, status, facts, highlights, actions }: {
  headline: string;
  status?: string;
  facts: FileIntelligence['keyFacts'];
  highlights: string[];
  actions: string[];
}) {
  return <motion.section animate={{ opacity: 1, y: 0 }} className="mt-3 overflow-hidden rounded-[16px] border border-[#DEDBE1] bg-white shadow-[0_3px_12px_rgba(35,32,40,.055),inset_0_1px_0_white]" initial={{ opacity: 0, y: 5 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }}>
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_92%_-20%,rgba(155,114,207,.20),transparent_45%),linear-gradient(145deg,#FCFBFD,#F6F4F8)] px-3.5 pb-3.5 pt-3">
      <span className="absolute -right-6 -top-7 h-20 w-20 rounded-full border border-white/70 bg-white/25" />
      <div className="relative flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full border border-[#E2D8EC] bg-white/85 px-2 py-1 text-[8px] font-semibold uppercase tracking-[.12em] text-[#806396] shadow-[0_2px_5px_rgba(70,45,90,.05)]"><Sparkles size={10} />Aether read</span>{status && <span className="ml-auto rounded-full bg-[#302B35] px-2.5 py-1 text-[8px] font-semibold text-white shadow-[0_3px_8px_rgba(35,30,40,.14)]">{status}</span>}</div>
      <p className="relative mt-3 max-w-[310px] text-[13px] font-semibold leading-[1.48] tracking-[-.018em] text-[#3E3943]">{headline}</p>
    </div>

    {facts.length > 0 && <div className="grid grid-cols-2 gap-2 p-3">{facts.map((fact, index) => { const treatment = treatments[fact.accent] ?? treatments.neutral; const Icon = treatment.Icon; return <motion.div animate={{ opacity: 1, scale: 1 }} className={`relative min-h-[68px] overflow-hidden rounded-[12px] border p-2.5 ${facts.length === 3 && index === 0 ? 'col-span-2' : ''}`} initial={{ opacity: 0, scale: .975 }} key={`${fact.label}-${index}`} style={{ background: `linear-gradient(145deg,#FFFFFF,${treatment.tint})`, borderColor: treatment.border }} transition={{ delay: .07 + index * .045 }} whileHover={{ y: -2, boxShadow: `0 7px 16px ${treatment.color}16` }}><span className="absolute -bottom-5 -right-4 h-14 w-14 rounded-full" style={{ backgroundColor: `${treatment.color}0B` }} /><span className="relative inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-1 text-[7px] font-semibold uppercase tracking-[.1em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)]" style={{ backgroundColor: treatment.color }}><Icon size={9} /><span className="truncate">{fact.label}</span></span><b className="relative mt-2 block line-clamp-2 text-[11px] font-semibold leading-[1.3] tracking-[-.015em] text-[#464249]">{fact.value}</b></motion.div>; })}</div>}

    {highlights.length > 0 && <div className="border-t border-[#ECE9EE] px-3 py-3"><div className="mb-2.5 flex items-center gap-1.5"><Lightbulb size={11} className="text-[#A67A31]" /><span className="text-[8px] font-semibold uppercase tracking-[.13em] text-[#938D97]">Signals worth noticing</span></div><div className="space-y-1.5">{highlights.map((highlight, index) => <motion.div animate={{ opacity: 1, x: 0 }} className="group flex items-center gap-2.5 rounded-[10px] border border-[#E9E6EA] bg-[#FBFAFC] px-2.5 py-2 transition-colors hover:bg-white" initial={{ opacity: 0, x: -4 }} key={highlight} transition={{ delay: .12 + index * .04 }}><span className="h-7 w-1 shrink-0 rounded-full" style={{ backgroundColor: signalColors[index % signalColors.length] }} /><span className="line-clamp-2 flex-1 text-[9px] font-medium leading-[1.4] text-[#5F5A63]">{highlight}</span><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#AAA5AD] shadow-[0_1px_3px_rgba(0,0,0,.08)]"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: signalColors[index % signalColors.length] }} /></span></motion.div>)}</div></div>}

    {actions.length > 0 && <div className="border-t border-[#3D3742] bg-[radial-gradient(circle_at_100%_0%,rgba(155,114,207,.28),transparent_45%),linear-gradient(145deg,#312D35,#26242A)] px-3 py-3 text-white"><div className="mb-2.5 flex items-center justify-between"><span className="text-[8px] font-semibold uppercase tracking-[.14em] text-white/60">Suggested next moves</span><ArrowUpRight size={12} className="text-white/45" /></div><div className="grid gap-1.5">{actions.map((action, index) => <motion.div animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-[9px] border border-white/10 bg-white/[.065] px-2.5 py-2" initial={{ opacity: 0, x: -4 }} key={action} transition={{ delay: .18 + index * .045 }}><span className="grid h-5 w-5 shrink-0 place-items-center rounded-[7px] bg-white text-[8px] font-bold text-[#5E496F]">{index + 1}</span><span className="text-[9px] font-medium leading-[1.35] text-white/88">{stripPeriod(action)}</span></motion.div>)}</div></div>}
  </motion.section>;
}
