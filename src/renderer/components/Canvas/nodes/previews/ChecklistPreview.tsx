import type { SmartPreview } from '../../../../../shared/types';

type ChecklistItem = { text?: string; checked?: boolean };

export default function ChecklistPreview({ preview }: { preview: SmartPreview }) {
  const allItems = Array.isArray(preview.displayData.items)
    ? (preview.displayData.items as ChecklistItem[])
    : [];
  const items = allItems.slice(0, 6);

  return (
    <div className="space-y-1 px-3 pb-2.5 text-[10px] text-[#4F4F54]">
      {items.map((item, index) => (
        <div className="flex items-center gap-1.5" key={`${item.text ?? 'item'}-${index}`}>
          <span
            className={`grid h-2.5 w-2.5 shrink-0 place-items-center rounded-[2px] border text-[7px] leading-none ${
              item.checked
                ? 'border-[#4A90D9] bg-[#4A90D9] text-white'
                : 'border-[#8D8D92] bg-white'
            }`}
          >
            {item.checked ? '✓' : ''}
          </span>
          <span className="truncate">{item.text ?? 'Untitled item'}</span>
        </div>
      ))}
      {allItems.length > items.length && <p className="pl-4 text-[#8A8A90]">…</p>}
    </div>
  );
}
