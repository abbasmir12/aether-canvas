import { AnimatePresence, motion } from 'framer-motion';

import type { FileSyncChange, SmartPreview } from '../../../../../shared/types';

type BudgetRow = { category?: string; estimate?: number };

export default function BudgetPreview({ preview, syncChange }: { preview: SmartPreview; syncChange?: FileSyncChange }) {
  const rows = Array.isArray(preview.displayData.rows)
    ? (preview.displayData.rows as BudgetRow[]).slice(0, 5)
    : [];
  const currency = typeof preview.displayData.currency === 'string' ? preview.displayData.currency : 'USD';
  const total = typeof preview.displayData.total === 'number' ? preview.displayData.total : null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  return (
    <div className="mx-2.5 mb-2.5 overflow-hidden rounded-[7px] border border-[#DCDCE0] text-[9px]">
      <div className="grid grid-cols-[1fr_72px] bg-[#F5F5F6] px-2 py-1.5 font-semibold text-[#4A4A4F]">
        <span>Category</span>
        <span className="text-right">Estimate</span>
      </div>
      <AnimatePresence initial={false}>{rows.map((row, index) => (
        <motion.div
          animate={{ backgroundColor: syncChange?.label.toLowerCase().startsWith((row.category ?? '').toLowerCase()) ? ['#FFF2B8', '#FFFFFF'] : '#FFFFFF', opacity: 1, x: 0 }}
          className="grid grid-cols-[1fr_72px] border-t border-[#E6E6E8] px-2 py-1 text-[#4D4D52]"
          exit={{ backgroundColor: '#FDE3E0', opacity: 0, x: -8 }}
          initial={{ backgroundColor: '#E6F4E9', opacity: 0, x: 8 }}
          key={`${row.category ?? 'row'}-${index}`}
          transition={{ duration: 0.55 }}
        >
          <span className="truncate">{row.category ?? 'Other'}</span>
          <motion.span animate={{ opacity: 1, y: 0 }} className="text-right tabular-nums" initial={{ opacity: 0.35, y: -2 }} key={`${row.category}-${row.estimate}`}>
            {typeof row.estimate === 'number' ? formatter.format(row.estimate) : '—'}
          </motion.span>
        </motion.div>
      ))}</AnimatePresence>
      {total !== null && (
        <div className="grid grid-cols-[1fr_72px] border-t border-[#CFCFD3] bg-[#FAFAFB] px-2 py-1 font-semibold text-[#343438]">
          <span>Total</span>
          <motion.span animate={{ opacity: 1, y: 0 }} className="text-right tabular-nums" initial={{ opacity: 0.3, y: -2 }} key={total}>{formatter.format(total)}</motion.span>
        </div>
      )}
    </div>
  );
}
