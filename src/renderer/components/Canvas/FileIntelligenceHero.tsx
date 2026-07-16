import { motion } from 'framer-motion';
import { ArrowRight, BedDouble, CalendarDays, Check, CircleDollarSign, FileText, Plane } from 'lucide-react';

import type { AnalyzedFile } from '../../../shared/types';

function text(data: Record<string, unknown>, key: string, fallback = ''): string {
  return typeof data[key] === 'string' && data[key] ? data[key] : fallback;
}

function number(data: Record<string, unknown>, key: string): number | null {
  return typeof data[key] === 'number' ? data[key] : null;
}

function FlightHero({ file }: { file: AnalyzedFile }) {
  const data = file.smartPreview.displayData;
  const origin = text(data, 'origin', file.entities.locations[0]?.name ?? 'Start');
  const destination = text(data, 'destination', file.entities.locations[1]?.name ?? 'Arrival');
  return <div className="overflow-hidden rounded-[16px] border border-[#DCE7F2] bg-[radial-gradient(circle_at_50%_-25%,rgba(74,144,217,.2),transparent_55%),linear-gradient(145deg,#FBFDFF,#F5F9FD)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.95)]">
    <div className="grid grid-cols-[1fr_84px_1fr] items-center">
      <div><b className="block text-[27px] leading-none tracking-[-0.055em] text-[#262A30]">{origin}</b><span className="mt-1 block truncate text-[9px] font-medium text-[#8A9098]">{text(data, 'originCity', 'Departure')}</span></div>
      <div className="flex items-center"><span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#AFC7DF)]" /><motion.span animate={{ y: [0, -2, 0] }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white bg-white text-[#4A90D9] shadow-[0_5px_14px_rgba(74,144,217,.2)]" transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}><Plane size={17} /></motion.span><span className="h-px flex-1 bg-[linear-gradient(90deg,#AFC7DF,transparent)]" /></div>
      <div className="text-right"><b className="block text-[27px] leading-none tracking-[-0.055em] text-[#262A30]">{destination}</b><span className="mt-1 block truncate text-[9px] font-medium text-[#8A9098]">{text(data, 'destCity', 'Arrival')}</span></div>
    </div>
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center rounded-[11px] border border-white/90 bg-white/72 px-3 py-2.5 shadow-[0_2px_8px_rgba(49,74,100,.06)] backdrop-blur-sm">
      <div><span className="block text-[8px] font-semibold uppercase tracking-[.12em] text-[#9B9FA5]">Depart</span><b className="mt-0.5 block text-[10px] font-semibold text-[#4C5158]">{[text(data, 'departDate'), text(data, 'departTime')].filter(Boolean).join(' · ') || '—'}</b></div>
      <ArrowRight size={13} className="mx-2 text-[#A7ABB0]" />
      <div className="text-right"><span className="block text-[8px] font-semibold uppercase tracking-[.12em] text-[#9B9FA5]">Arrive</span><b className="mt-0.5 block text-[10px] font-semibold text-[#4C5158]">{[text(data, 'arriveDate'), text(data, 'arriveTime')].filter(Boolean).join(' · ') || '—'}</b></div>
    </div>
  </div>;
}

function BudgetHero({ file }: { file: AnalyzedFile }) {
  const data = file.smartPreview.displayData;
  const total = number(data, 'total') ?? file.entities.costs[0]?.amount ?? 0;
  const currency = text(data, 'currency', file.entities.costs[0]?.currency ?? 'USD');
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(total);
  const rows = Array.isArray(data.rows) ? (data.rows as Array<{ category?: string; estimate?: number }>).slice(0, 3) : [];
  const maximum = Math.max(...rows.map((row) => row.estimate ?? 0), 1);
  return <div className="rounded-[16px] border border-[#DDEBDF] bg-[linear-gradient(145deg,#FBFEFC,#F4FAF5)] p-4">
    <div className="flex items-start justify-between"><div><span className="text-[8px] font-semibold uppercase tracking-[.13em] text-[#84938A]">Planned total</span><b className="mt-1 block text-[26px] tracking-[-.055em] text-[#29332C]">{formatted}</b></div><span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#34A853] text-white shadow-[0_5px_14px_rgba(52,168,83,.22)]"><CircleDollarSign size={19} /></span></div>
    <div className="mt-3 space-y-2">{rows.map((row) => <div key={row.category}><div className="mb-1 flex justify-between text-[9px] font-medium text-[#667069]"><span>{row.category}</span><span>{typeof row.estimate === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(row.estimate) : '—'}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#E4EEE6]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#34A853,#72C388)]" style={{ width: `${Math.max(8, (row.estimate ?? 0) / maximum * 100)}%` }} /></div></div>)}</div>
  </div>;
}

function ChecklistHero({ file }: { file: AnalyzedFile }) {
  const data = file.smartPreview.displayData;
  const items = Array.isArray(data.items) ? data.items as Array<{ text?: string; checked?: boolean }> : [];
  const checked = typeof data.checkedCount === 'number' ? data.checkedCount : items.filter((item) => item.checked).length;
  const total = typeof data.totalCount === 'number' ? data.totalCount : items.length;
  const progress = total ? checked / total * 100 : 0;
  return <div className="rounded-[16px] border border-[#E7DFF1] bg-[linear-gradient(145deg,#FDFBFF,#F8F4FC)] p-4"><div className="flex items-center justify-between"><div><span className="text-[8px] font-semibold uppercase tracking-[.13em] text-[#90859D]">Completion</span><p className="mt-1"><b className="text-[27px] tracking-[-.055em] text-[#322C39]">{checked}</b><span className="text-[13px] font-medium text-[#8E8795]"> / {total}</span></p></div><div className="relative grid h-14 w-14 place-items-center"><svg className="h-14 w-14 -rotate-90"><circle cx="28" cy="28" fill="none" r="22" stroke="#E9E1EF" strokeWidth="6" /><circle cx="28" cy="28" fill="none" r="22" stroke="#9B72CF" strokeDasharray="138.2" strokeDashoffset={138.2 * (1 - progress / 100)} strokeLinecap="round" strokeWidth="6" /></svg><Check className="absolute text-[#9B72CF]" size={17} /></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAE4EF]"><motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-[linear-gradient(90deg,#9B72CF,#B99BDD)]" transition={{ duration: .55 }} /></div></div>;
}

function DefaultHero({ file }: { file: AnalyzedFile }) {
  const data = file.smartPreview.displayData;
  const isHotel = file.smartPreview.type === 'hotel';
  const highlights = Array.isArray(data.highlights) ? (data.highlights as unknown[]).filter((value): value is string => typeof value === 'string').slice(0, 3) : [];
  return <div className="rounded-[16px] border border-[#E5E3E7] bg-[radial-gradient(circle_at_100%_0%,rgba(74,144,217,.12),transparent_42%),linear-gradient(145deg,#FFFFFF,#F8F8FA)] p-4"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[#EEF4FA] text-[#4A90D9]">{isHotel ? <BedDouble size={20} /> : <FileText size={20} />}</span><div className="min-w-0"><span className="text-[8px] font-semibold uppercase tracking-[.13em] text-[#96949B]">{isHotel ? 'Stay details' : 'Aether overview'}</span><b className="mt-1 block text-[15px] leading-tight tracking-[-.025em] text-[#333238]">{text(data, isHotel ? 'hotelName' : 'title', file.intelligence?.headline || file.title)}</b><p className="mt-1 text-[10px] text-[#77757D]">{isHotel ? text(data, 'location') : highlights.join(' · ')}</p></div></div>{isHotel && <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-white/80 px-3 py-2 text-[9px] font-medium text-[#65636B]"><CalendarDays size={13} className="text-[#4A90D9]" />{text(data, 'checkIn', '—')}<ArrowRight size={11} className="text-[#AAA7AD]" />{text(data, 'checkOut', '—')}</div>}</div>;
}

export default function FileIntelligenceHero({ file }: { file: AnalyzedFile }) {
  if (file.smartPreview.type === 'flight') return <FlightHero file={file} />;
  if (file.smartPreview.type === 'budget') return <BudgetHero file={file} />;
  if (file.smartPreview.type === 'checklist') return <ChecklistHero file={file} />;
  return <DefaultHero file={file} />;
}
