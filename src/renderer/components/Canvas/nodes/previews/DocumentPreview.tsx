import type { SmartPreview } from '../../../../../shared/types';

export default function DocumentPreview({ preview }: { preview: SmartPreview }) {
  const points = Array.isArray(preview.displayData.keyPoints)
    ? (preview.displayData.keyPoints as unknown[]).filter((item): item is string => typeof item === 'string').slice(0, 3)
    : [];
  const description = typeof preview.displayData.description === 'string'
    ? preview.displayData.description
    : '';

  return (
    <div className="space-y-1.5 px-3 pb-3 text-[9px] leading-[1.35] text-[#626268]">
      {description && <p className="line-clamp-3">{description}</p>}
      {points.map((point) => (
        <div className="flex gap-1.5" key={point}>
          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#4A90D9]" />
          <span className="line-clamp-2">{point}</span>
        </div>
      ))}
    </div>
  );
}
