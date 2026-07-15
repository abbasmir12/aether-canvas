import type { SmartPreview } from '../../../../../shared/types';

function value(data: Record<string, unknown>, key: string) {
  return typeof data[key] === 'string' ? data[key] : '';
}

export default function HotelPreview({
  preview,
  thumbnailUrl,
}: {
  preview: SmartPreview;
  thumbnailUrl: string | null;
}) {
  const data = preview.displayData;

  if (thumbnailUrl) {
    return (
      <div className="px-2.5 pb-2.5">
        <img
          alt={value(data, 'hotelName') || 'Hotel preview'}
          className="h-[112px] w-full rounded-[4px] object-cover"
          src={thumbnailUrl}
        />
      </div>
    );
  }

  return (
    <div className="mx-2.5 mb-2.5 rounded-[8px] border border-[#E1E1E4] bg-[#FAFAFB] p-3">
      <p className="truncate text-[14px] font-semibold text-[#303034]">
        {value(data, 'hotelName') || 'Hotel stay'}
      </p>
      <p className="mt-1 truncate text-[10px] text-[#77777D]">{value(data, 'location')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E5E5E8] pt-2 text-[9px] text-[#636368]">
        <span>In · {value(data, 'checkIn') || '—'}</span>
        <span className="text-right">Out · {value(data, 'checkOut') || '—'}</span>
      </div>
    </div>
  );
}
