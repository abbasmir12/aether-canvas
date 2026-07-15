import type { SmartPreview } from '../../../../../shared/types';

function text(data: Record<string, unknown>, key: string, fallback = '—') {
  return typeof data[key] === 'string' && data[key] ? data[key] : fallback;
}

export default function FlightPreview({ preview }: { preview: SmartPreview }) {
  const data = preview.displayData;

  return (
    <div className="mx-2.5 mb-2.5 rounded-[8px] border border-[#E1E1E4] bg-[#FCFCFD] px-3 pb-2.5 pt-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <div>
          <p className="text-[21px] font-semibold leading-6 tracking-[-0.04em] text-[#27272A]">
            {text(data, 'origin')}
          </p>
          <p className="mt-0.5 truncate text-[8px] text-[#85858A]">{text(data, 'originCity', '')}</p>
        </div>
        <span className="pt-0.5 text-[22px] font-light text-[#444449]">→</span>
        <div className="text-right">
          <p className="text-[21px] font-semibold leading-6 tracking-[-0.04em] text-[#27272A]">
            {text(data, 'destination')}
          </p>
          <p className="mt-0.5 truncate text-[8px] text-[#85858A]">{text(data, 'destCity', '')}</p>
        </div>
      </div>
      <div className="mt-2 border-t border-[#E7E7E9] pt-2 text-center text-[9px] font-medium tabular-nums text-[#5F5F64]">
        {text(data, 'departDate')} {text(data, 'departTime', '')}
        <span className="px-1.5 text-[#A1A1A5]">→</span>
        {text(data, 'arriveDate')} {text(data, 'arriveTime', '')}
      </div>
    </div>
  );
}
