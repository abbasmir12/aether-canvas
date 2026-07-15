import type { SmartPreview } from '../../../../../shared/types';

export default function GuidePreview({ preview }: { preview: SmartPreview }) {
  const title = typeof preview.displayData.title === 'string' ? preview.displayData.title : 'Travel Guide';
  const highlights = Array.isArray(preview.displayData.highlights)
    ? (preview.displayData.highlights as unknown[]).filter((item): item is string => typeof item === 'string').slice(0, 3)
    : [];

  return (
    <div className="mx-2.5 mb-2.5 overflow-hidden rounded-[7px] border border-[#D8D8DB] bg-[linear-gradient(145deg,#EAF0F5,#F7F3EA)]">
      <div className="h-[76px] px-3 pt-3">
        <p className="max-w-[150px] text-[15px] font-semibold uppercase leading-[1.05] tracking-[-0.02em] text-[#273746]">
          {title}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {highlights.map((highlight) => (
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[7px] text-[#52606B]" key={highlight}>
              {highlight}
            </span>
          ))}
        </div>
      </div>
      <div className="h-3 bg-[linear-gradient(90deg,#4A90D9,#EA4335,#9B72CF)] opacity-70" />
    </div>
  );
}
