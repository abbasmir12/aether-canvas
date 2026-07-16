import { motion } from 'framer-motion';
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react';
import { CheckSquare, Map, MapPin, MoreHorizontal, Plane, Sparkles, Wallet } from 'lucide-react';
import { useCallback } from 'react';

import type { AnalyzedFile, SuggestedCluster } from '../../../../shared/types';

export type SummaryCardNodeData = {
  cluster: SuggestedCluster;
  files: AnalyzedFile[];
  assemblyDelay?: number;
};

export type SummaryCardNodeType = Node<SummaryCardNodeData, 'summaryCard'>;

function value(data: Record<string, unknown>, key: string): string {
  const item = data[key];
  return typeof item === 'string' ? item : '';
}

function numberValue(data: Record<string, unknown>, key: string): number {
  const item = data[key];
  return typeof item === 'number' && Number.isFinite(item) ? item : 0;
}

function Section({ children, index, relationshipType }: { children: React.ReactNode; index: number; relationshipType: 'dates' | 'cost' | 'tasks' | 'place' }) {
  const colors = { dates: '#4A90D9', cost: '#34A853', tasks: '#9B72CF', place: '#EA4335' };
  return (
    <motion.section
      animate={{ opacity: 1 }}
      className="relative rounded-[11px] border border-[#DFDFE2] bg-[#FEFEFF] px-3 py-2.5"
      initial={{ opacity: 0 }}
      transition={{ delay: 2.2 + index * 0.1, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Handle id={`summary-${relationshipType}`} className="!h-[8px] !w-[8px] !border-0 !bg-transparent !opacity-0" position={Position.Left} style={{ top: '50%' }} type="target" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10px] top-1/2 grid h-[18px] w-[18px] -translate-y-1/2 place-items-center rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        style={{ backgroundColor: colors[relationshipType] }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      {children}
    </motion.section>
  );
}

function SectionHeading({ children, Icon }: { children: string; Icon: typeof Plane }) {
  return <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#333337]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#EDF4FC] text-[#4A90D9]"><Icon size={13} strokeWidth={2.4} /></span>{children}</div>;
}

export default function SummaryCardNode({ id, data, selected }: NodeProps<SummaryCardNodeType>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const syncHandlesAfterEntrance = useCallback(() => {
    requestAnimationFrame(() => updateNodeInternals(id));
  }, [id, updateNodeInternals]);
  const flight = data.files.find((file) => file.smartPreview.type === 'flight');
  const hotel = data.files.find((file) => file.smartPreview.type === 'hotel');
  const checklist = data.files.find((file) => file.smartPreview.type === 'checklist');
  const allCosts = data.files.flatMap((file) => file.entities.costs);
  const locations = [...new Set(data.files.flatMap((file) => file.entities.locations.map((location) => location.name)))].slice(0, 3);
  const hasBudget = allCosts.length > 0;
  const total = allCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const budgetPreview = data.files.find((file) => file.smartPreview.type === 'budget')?.smartPreview.displayData ?? {};
  const budgetLimit = numberValue(budgetPreview, 'total') || Math.ceil(total / 100) * 100 || 1;
  const spent = Math.min(total, budgetLimit);
  const remaining = Math.max(budgetLimit - spent, 0);
  const progress = checklist?.smartPreview.displayData ?? {};
  const packed = numberValue(progress, 'checkedCount');
  const packTotal = numberValue(progress, 'totalCount');
  const packingItems = Array.isArray(progress.items) ? progress.items as Array<{ text?: string; checked?: boolean }> : [];
  const nextPackingIndex = packingItems.findIndex((item) => !item.checked);
  const flightData = flight?.smartPreview.displayData ?? {};
  const hotelData = hotel?.smartPreview.displayData ?? {};
  const percent = Math.min(100, Math.round((spent / budgetLimit) * 100));
  const circumference = 2 * Math.PI * 31;
  const focusSource = (fileId?: string) => { if (fileId) window.dispatchEvent(new CustomEvent('aether:focus-source-file', { detail: fileId })); };
  const focusLocation = (location: string) => window.dispatchEvent(new CustomEvent('aether:focus-source-location', { detail: location }));
  const markNextPacked = () => { if (checklist && nextPackingIndex >= 0) window.dispatchEvent(new CustomEvent('aether:toggle-packing-task', { detail: { fileId: checklist.id, taskIndex: nextPackingIndex } })); };

  let sectionIndex = 0;

  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      className={`w-[286px] rounded-[16px] border bg-white p-3 shadow-[0_5px_18px_rgba(0,0,0,0.12)] ${selected ? 'border-[#4A90D9]' : 'border-[#D5D5D9]'}`}
      initial={{ opacity: 0, x: 100, y: 10 }}
      onAnimationComplete={syncHandlesAfterEntrance}
      transition={{ delay: data.assemblyDelay ?? 1.2, duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
    >
      <header className="mb-3 flex items-start gap-2.5 px-1 pt-1">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#FFF0EA] text-[#EA6335]"><MapPin size={21} strokeWidth={2.25} /></span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-[23px] font-semibold tracking-[-0.035em] text-[#29292C]">{data.cluster.name}</h2><p className="mt-0.5 text-[12px] font-medium text-[#77777D]">{data.cluster.dateRange || 'Aether space'}</p></div>
        <button aria-label="Summary options" className="grid h-7 w-7 place-items-center rounded-md text-[#77777D] hover:bg-[#F2F2F4]" type="button"><MoreHorizontal size={18} /></button>
      </header>
      <div className="space-y-2">
        {flight && <Section index={sectionIndex++} relationshipType="dates"><SectionHeading Icon={Plane}>Journey</SectionHeading><button className="nodrag grid w-full grid-cols-[1fr_auto_1fr] items-center rounded-[7px] text-center transition hover:bg-[#F6F8FB]" onClick={() => focusSource(flight.id)} type="button"><div><p className="text-[16px] font-semibold text-[#303034]">{value(flightData, 'origin') || '—'}</p><p className="text-[10px] text-[#77777D]">{value(flightData, 'departDate')}</p></div><Plane className="mx-2 text-[#55555A]" size={19} /><div><p className="text-[16px] font-semibold text-[#303034]">{value(flightData, 'destination') || '—'}</p><p className="text-[10px] text-[#77777D]">{value(flightData, 'arriveDate')}</p></div></button>{hotel && <button className="nodrag mt-2 w-full border-t border-[#E8E8EB] pt-2 text-left text-[10px] text-[#77777D] hover:text-[#4A90D9]" onClick={() => focusSource(hotel.id)} type="button">Check-in <span className="ml-1 font-medium text-[#4D4D52]">{value(hotelData, 'checkIn')}</span></button>}</Section>}
        {hasBudget && <Section index={sectionIndex++} relationshipType="cost"><SectionHeading Icon={Wallet}>Budget</SectionHeading><div className="flex items-center gap-3"><div className="relative grid h-[78px] w-[78px] place-items-center"><svg className="h-[78px] w-[78px] -rotate-90"><circle cx="39" cy="39" fill="none" r="31" stroke="#E9E9E7" strokeWidth="9" /><circle cx="39" cy="39" fill="none" r="31" stroke="#34A853" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} strokeLinecap="round" strokeWidth="9" /></svg><div className="absolute text-center"><p className="text-[13px] font-semibold text-[#323237]">${Math.round(spent).toLocaleString()}</p><p className="text-[8px] text-[#77777D]">of ${Math.round(budgetLimit).toLocaleString()}</p></div></div><div className="space-y-2 text-[10px]"><p className="flex items-center gap-1.5 text-[#55555A]"><i className="h-2 w-2 rounded-full bg-[#34A853]" />Spent <b className="ml-auto pl-4 text-[#333337]">${Math.round(spent).toLocaleString()}</b></p><p className="flex items-center gap-1.5 text-[#55555A]"><i className="h-2 w-2 rounded-full bg-[#B5B3AC]" />Remaining <b className="ml-auto pl-4 text-[#333337]">${Math.round(remaining).toLocaleString()}</b></p></div></div></Section>}
        {checklist && <Section index={sectionIndex++} relationshipType="tasks"><SectionHeading Icon={CheckSquare}>Packing</SectionHeading><div className="flex items-end justify-between"><p className="text-[12px] text-[#444449]"><b className="text-[22px] leading-none text-[#303034]">{packed}</b> / {packTotal} packed</p>{nextPackingIndex >= 0 && <button className="nodrag text-[10px] font-medium text-[#7B57A9] hover:text-[#59398A]" onClick={markNextPacked} type="button">Mark next packed</button>}</div><button aria-label="Mark the next packing item as packed" className="nodrag mt-2 block h-2 w-full overflow-hidden rounded-full bg-[#E7E5E9]" onClick={markNextPacked} type="button"><motion.span animate={{ width: `${packTotal ? (packed / packTotal) * 100 : 0}%` }} className="block h-full rounded-full bg-[#9B72CF]" initial={{ width: 0 }} transition={{ delay: 2.4, duration: 0.45 }} /></button></Section>}
        {locations.length > 0 && <Section index={sectionIndex++} relationshipType="place"><SectionHeading Icon={Map}>Map</SectionHeading><div className="relative h-[83px] overflow-hidden rounded-[7px] border border-[#E5E2D9] bg-[#F1EEE6]" style={{ backgroundImage: 'linear-gradient(26deg, transparent 47%, rgba(255,255,255,.8) 48%, rgba(255,255,255,.8) 51%, transparent 52%), linear-gradient(112deg, transparent 42%, rgba(255,255,255,.75) 43%, rgba(255,255,255,.75) 46%, transparent 47%)' }}>{locations.map((location, index) => <button className="nodrag absolute flex items-center gap-0.5 text-[9px] font-medium text-[#4A4A4E] hover:text-[#EA6335]" key={location} onClick={() => focusLocation(location)} style={{ left: `${16 + index * 29}%`, top: `${53 - index * 17}%` }} type="button"><MapPin className="fill-[#EA6335] text-white" size={19} strokeWidth={2.5} />{location}</button>)}</div></Section>}
      </div>
      <footer className="mt-3 flex justify-center"><span className="flex items-center gap-1.5 rounded-full border border-[#E2E2E5] bg-[#FAFAFB] px-3 py-1.5 text-[10px] font-medium text-[#6F6F74]"><Sparkles size={13} />Generated from {data.files.length} files</span></footer>
    </motion.article>
  );
}
