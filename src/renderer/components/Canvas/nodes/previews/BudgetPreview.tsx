import type { SmartPreview } from '../../../../../shared/types';

type BudgetRow = { category?: string; estimate?: number };

export default function BudgetPreview({ preview }: { preview: SmartPreview }) {
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
      {rows.map((row, index) => (
        <div
          className="grid grid-cols-[1fr_72px] border-t border-[#E6E6E8] px-2 py-1 text-[#4D4D52]"
          key={`${row.category ?? 'row'}-${index}`}
        >
          <span className="truncate">{row.category ?? 'Other'}</span>
          <span className="text-right tabular-nums">
            {typeof row.estimate === 'number' ? formatter.format(row.estimate) : '—'}
          </span>
        </div>
      ))}
      {total !== null && (
        <div className="grid grid-cols-[1fr_72px] border-t border-[#CFCFD3] bg-[#FAFAFB] px-2 py-1 font-semibold text-[#343438]">
          <span>Total</span>
          <span className="text-right tabular-nums">{formatter.format(total)}</span>
        </div>
      )}
    </div>
  );
}
