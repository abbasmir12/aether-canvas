import type { AnalyzedFile, FileSyncChange } from '../../shared/types';

type BudgetRow = { category?: string; estimate?: number; actual?: number };

const rowsFrom = (file: AnalyzedFile): BudgetRow[] => Array.isArray(file.smartPreview.displayData.rows)
  ? file.smartPreview.displayData.rows as BudgetRow[]
  : [];

const itemsFrom = (file: AnalyzedFile): Array<{ text?: string }> => Array.isArray(file.smartPreview.displayData.items)
  ? file.smartPreview.displayData.items as Array<{ text?: string }>
  : [];

const currencyFrom = (file: AnalyzedFile) => typeof file.smartPreview.displayData.currency === 'string'
  ? file.smartPreview.displayData.currency
  : file.entities.costs[0]?.currency ?? 'USD';

const money = (amount: number, currency: string) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(amount);

export function describeAnalysisChange(previous: AnalyzedFile, next: AnalyzedFile): FileSyncChange | undefined {
  const oldRows = rowsFrom(previous);
  const newRows = rowsFrom(next);
  const currency = currencyFrom(next);
  const numericChanges = newRows.flatMap((row) => {
    const old = oldRows.find((candidate) => candidate.category?.toLowerCase() === row.category?.toLowerCase());
    if (!old) return [];
    return (['actual', 'estimate'] as const).flatMap((field) => {
      const before = old[field];
      const after = row[field];
      if (typeof before !== 'number' || typeof after !== 'number' || before === after) return [];
      return [{ label: `${row.category || 'Budget'} ${field}`, before, after, delta: after - before }];
    });
  }).sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
  const numberChange = numericChanges[0];
  if (numberChange) return { kind: 'number', label: numberChange.label, before: money(numberChange.before, currency), after: money(numberChange.after, currency), delta: numberChange.delta };

  const oldCosts = new Map(previous.entities.costs.map((cost) => [cost.label.toLowerCase(), cost]));
  const costChange = next.entities.costs.map((cost) => ({ cost, old: oldCosts.get(cost.label.toLowerCase()) })).filter((entry) => entry.old && entry.old.amount !== entry.cost.amount).sort((left, right) => Math.abs((right.cost.amount - (right.old?.amount ?? 0))) - Math.abs((left.cost.amount - (left.old?.amount ?? 0))))[0];
  if (costChange?.old) return { kind: 'number', label: costChange.cost.label, before: money(costChange.old.amount, costChange.cost.currency), after: money(costChange.cost.amount, costChange.cost.currency), delta: costChange.cost.amount - costChange.old.amount };

  const oldItems = new Set(itemsFrom(previous).map((item) => item.text?.trim()).filter(Boolean));
  const newItems = new Set(itemsFrom(next).map((item) => item.text?.trim()).filter(Boolean));
  const added = [...newItems].filter((item) => !oldItems.has(item)).length;
  const removed = [...oldItems].filter((item) => !newItems.has(item)).length;
  if (added || removed) return { kind: 'items', label: 'List changed', added, removed };

  if (previous.summary !== next.summary) return { kind: 'text', label: 'Content updated', before: previous.summary, after: next.summary };
  return undefined;
}
