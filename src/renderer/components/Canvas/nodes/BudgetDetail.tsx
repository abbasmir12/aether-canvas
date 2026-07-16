import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Download, Plus, ReceiptText, TrendingDown, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { DashboardBudgetRow } from '../../../../shared/types';

type BudgetDetailProps = {
  rows: DashboardBudgetRow[];
  currency: string;
  planned: number;
  spent: number;
  importedAggregate: boolean;
  editable: boolean;
  onChange: (rows: DashboardBudgetRow[]) => void;
  onExport: () => void;
};

const money = (amount: number, currency: string) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(amount);

const ROW_COLORS = ['#34A853', '#4A90D9', '#9B72CF', '#F59E0B', '#EA4335', '#14B8A6'];

export default function BudgetDetail({ rows, currency, planned, spent, importedAggregate, editable, onChange, onExport }: BudgetDetailProps) {
  const [draft, setDraft] = useState({ category: '', estimate: '' });
  const remaining = planned - spent;
  const utilization = planned > 0 ? Math.min(1, spent / planned) : 0;
  const percentage = Math.round((planned > 0 ? spent / planned : 0) * 100);
  const isOver = remaining < 0;
  const knownRows = rows.filter((row) => row.actual !== undefined).length;
  const largestCategory = useMemo(() => rows.reduce<DashboardBudgetRow | null>((largest, row) => !largest || row.estimate > largest.estimate ? row : largest, null), [rows]);

  const addRow = () => {
    const estimate = Number(draft.estimate);
    if (!draft.category.trim() || !Number.isFinite(estimate) || estimate <= 0) return;
    onChange([...rows, { id: crypto.randomUUID(), category: draft.category.trim(), estimate, actual: 0 }]);
    setDraft({ category: '', estimate: '' });
  };

  return (
    <div className="space-y-3.5">
      <div className={`relative overflow-hidden rounded-[15px] border p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_5px_16px_rgba(38,75,47,.07)] ${isOver ? 'border-[#F0D2CE] bg-[linear-gradient(145deg,#FFFDFC_0%,#FFF2F0_100%)]' : 'border-[#D9EADC] bg-[linear-gradient(145deg,#FFFFFF_0%,#F2F9F3_100%)]'}`}>
        <span aria-hidden className={`absolute -right-6 -top-10 h-28 w-28 rounded-full blur-2xl ${isOver ? 'bg-[#EA4335]/10' : 'bg-[#34A853]/10'}`} />
        <div className="relative flex items-center gap-4">
          <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center">
            <svg className="h-[92px] w-[92px] -rotate-90" viewBox="0 0 92 92">
              <circle cx="46" cy="46" fill="none" r="35" stroke="#E4EAE5" strokeWidth="9" />
              <motion.circle animate={{ strokeDashoffset: 219.9 * (1 - utilization) }} cx="46" cy="46" fill="none" r="35" stroke={isOver ? '#EA4335' : '#34A853'} strokeDasharray="219.9" strokeLinecap="round" strokeWidth="9" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <span className="absolute text-center"><b className="block text-[15px] font-semibold tracking-[-0.05em] text-[#29332C]">{percentage}%</b><small className="mt-0.5 block text-[7px] font-semibold uppercase tracking-[0.11em] text-[#78837A]">used</small></span>
          </div>
          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.09em] ${isOver ? 'bg-[#FDE4E1] text-[#B43B32]' : 'bg-[#E2F3E6] text-[#277D3D]'}`}>{isOver ? <AlertTriangle size={10} /> : <Check size={10} strokeWidth={2.7} />}{isOver ? 'Over plan' : 'On track'}</span>
            <p className={`mt-2 text-[21px] font-semibold leading-none tracking-[-0.055em] ${isOver ? 'text-[#A73730]' : 'text-[#28372D]'}`}>{money(Math.abs(remaining), currency)}</p>
            <p className="mt-1 text-[9px] font-medium text-[#748078]">{isOver ? 'over your planned budget' : 'available to spend'}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(31,58,38,.1)]"><motion.div animate={{ width: `${utilization * 100}%` }} className={`h-full rounded-full ${isOver ? 'bg-[#EA4335]' : 'bg-[linear-gradient(90deg,#34A853,#5FC276)]'}`} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} /></div>
          </div>
        </div>
        <div className="relative mt-3 grid grid-cols-3 overflow-hidden rounded-[10px] border border-white/90 bg-white/70 shadow-[0_2px_7px_rgba(42,71,49,.045)]">
          {[['Planned', money(planned, currency)], ['Spent', money(spent, currency)], ['Largest', largestCategory?.category ?? '—']].map(([label, value], index) => <div className={`min-w-0 px-2 py-2 ${index ? 'border-l border-[#E7ECE8]' : ''}`} key={label}><span className="block text-[7px] font-semibold uppercase tracking-[0.1em] text-[#8A928C]">{label}</span><b className="mt-1 block truncate text-[10px] font-semibold text-[#3D4740]">{value}</b></div>)}
        </div>
      </div>

      <div className="flex items-end justify-between px-0.5">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#747B76]">Category ledger</p><p className="mt-0.5 text-[9px] text-[#A09FA3]">Actual spending stays editable</p></div>
        <span className="rounded-full bg-[#F0F5F1] px-2 py-1 text-[8px] font-semibold text-[#66806C]">{knownRows}/{rows.length} reconciled</span>
      </div>

      {importedAggregate && <div className="flex gap-2 rounded-[10px] border border-[#E5E1D3] bg-[#FFFDF5] px-2.5 py-2 text-[9px] leading-4 text-[#766E54]"><ReceiptText className="mt-0.5 shrink-0 text-[#A28B45]" size={13} /><span><b className="font-semibold text-[#665E46]">Imported total preserved.</b> Re-analyze the budget file to map actual spending to every category.</span></div>}

      <div className="max-h-[230px] space-y-1.5 overflow-y-auto pr-1">
        {rows.map((row, index) => {
          const variance = row.actual === undefined ? null : row.estimate - row.actual;
          const rowProgress = row.estimate > 0 && row.actual !== undefined ? Math.min(1, row.actual / row.estimate) : 0;
          return <motion.div className="group rounded-[11px] border border-[#E7E8E7] bg-white px-2.5 py-2.5 shadow-[0_1px_3px_rgba(24,30,26,.025)] transition hover:border-[#D5E3D8] hover:shadow-[0_4px_10px_rgba(36,70,44,.07)]" key={row.id} layout>
            <div className="grid grid-cols-[minmax(0,1fr)_68px_70px] items-center gap-2">
              <div className="flex min-w-0 items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] text-[8px] font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.35),0_2px_5px_rgba(20,30,23,.1)]" style={{ backgroundColor: ROW_COLORS[index % ROW_COLORS.length] }}>{index + 1}</span><span className="min-w-0"><b className="block truncate text-[10px] font-semibold text-[#404448]">{row.category}</b><small className={`mt-0.5 block text-[8px] ${variance !== null && variance < 0 ? 'text-[#C2473E]' : 'text-[#92979A]'}`}>{variance === null ? 'Not reconciled' : variance < 0 ? `${money(Math.abs(variance), currency)} over` : variance === 0 ? 'Matched plan' : `${money(variance, currency)} available`}</small></span></div>
              <span className="text-right text-[10px] font-medium text-[#777C79]">{money(row.estimate, currency)}</span>
              {editable ? <label className="relative"><span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#949A96]">{currency === 'USD' ? '$' : ''}</span><input aria-label={`${row.category} actual spending`} className="nodrag w-full rounded-[7px] border border-[#E2E6E3] bg-[#F8FAF8] py-1.5 pl-3 pr-1.5 text-right text-[10px] font-semibold text-[#3D4740] outline-none transition focus:border-[#34A853]/45 focus:bg-white focus:ring-2 focus:ring-[#34A853]/10" min="0" onChange={(event) => onChange(rows.map((item) => item.id === row.id ? { ...item, actual: event.target.value === '' ? undefined : Number(event.target.value) } : item))} placeholder="—" type="number" value={row.actual ?? ''} /></label> : <span className="text-right text-[10px] font-semibold text-[#3D4740]">{row.actual === undefined ? '—' : money(row.actual, currency)}</span>}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#EEF0EE]"><motion.div animate={{ width: `${rowProgress * 100}%` }} className={`h-full rounded-full ${variance !== null && variance < 0 ? 'bg-[#EA4335]' : 'bg-[#34A853]'}`} transition={{ duration: 0.35 }} /></div>
          </motion.div>;
        })}
      </div>

      {editable && <div className="rounded-[11px] border border-dashed border-[#CCDCCF] bg-[#FAFCFA] p-2.5"><div className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold text-[#637A68]"><WalletCards size={12} />Add a budget category</div><div className="flex gap-1.5"><input className="nodrag min-w-0 flex-1 rounded-[8px] border border-[#E0E5E1] bg-white px-2.5 py-1.5 text-[10px] outline-none focus:border-[#34A853]/45 focus:ring-2 focus:ring-[#34A853]/10" onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} onKeyDown={(event) => event.key === 'Enter' && addRow()} placeholder="Category" value={draft.category} /><input className="nodrag w-[76px] rounded-[8px] border border-[#E0E5E1] bg-white px-2 py-1.5 text-[10px] outline-none focus:border-[#34A853]/45 focus:ring-2 focus:ring-[#34A853]/10" min="0" onChange={(event) => setDraft((current) => ({ ...current, estimate: event.target.value }))} onKeyDown={(event) => event.key === 'Enter' && addRow()} placeholder="Budget" type="number" value={draft.estimate} /><motion.button aria-label="Add budget category" className="nodrag grid h-7 w-7 place-items-center rounded-[8px] bg-[#34A853] text-white shadow-[0_3px_8px_rgba(52,168,83,.24)]" onClick={addRow} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus size={13} /></motion.button></div></div>}

      <div className="flex items-center justify-between border-t border-[#ECEEEC] pt-3"><span className="flex items-center gap-1.5 text-[8px] font-medium text-[#929793]"><TrendingDown size={11} />Values save with this workspace</span><button className="nodrag flex items-center gap-1.5 rounded-[8px] border border-[#DFE6E0] bg-white px-2.5 py-1.5 text-[9px] font-semibold text-[#56705C] shadow-[0_1px_3px_rgba(30,50,35,.04)] transition hover:-translate-y-px hover:border-[#BED1C2] hover:text-[#2E7D42]" onClick={onExport} type="button"><Download size={12} />Export CSV</button></div>
      <AnimatePresence>{rows.length === 0 && <motion.p animate={{ opacity: 1 }} className="py-4 text-center text-[10px] text-[#969A97]" initial={{ opacity: 0 }}>No budget categories found.</motion.p>}</AnimatePresence>
    </div>
  );
}
