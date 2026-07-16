import { motion } from 'framer-motion';
import { Check, Circle, Flag, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

import type { AnalyzedFile } from '../../../shared/types';

type ChecklistItem = { text?: string; checked?: boolean };

function stripPeriod(value: string): string {
  return value.trim().replace(/[.!]+$/, '');
}

export default function PackingReadinessBrief({ file }: { file: AnalyzedFile }) {
  const data = file.smartPreview.displayData;
  const items = Array.isArray(data.items) ? data.items as ChecklistItem[] : [];
  const openItems = items.filter((item) => !item.checked && item.text).map((item) => item.text as string);
  const checked = typeof data.checkedCount === 'number' ? data.checkedCount : items.filter((item) => item.checked).length;
  const total = typeof data.totalCount === 'number' ? data.totalCount : items.length;
  const remaining = Math.max(0, total - checked);
  const undisplayed = Math.max(0, remaining - openItems.length);
  const destination = file.intelligence?.keyFacts.find((fact) => /destination|place|location/i.test(fact.label))?.value
    ?? file.entities.locations[0]?.name
    ?? '';
  const actions = file.intelligence?.suggestedActions.slice(0, 3) ?? [];
  const secured = file.intelligence?.highlights.find((highlight) => /packed|secured|complete/i.test(highlight));
  const attention = file.intelligence?.highlights.find((highlight) => /unchecked|remain|still|attention/i.test(highlight));

  return <motion.section animate={{ opacity: 1, y: 0 }} className="mt-3 overflow-hidden rounded-[16px] border border-[#E4DCEC] bg-[radial-gradient(circle_at_100%_0%,rgba(155,114,207,.13),transparent_43%),linear-gradient(150deg,#FFFFFF,#FAF8FC)] shadow-[inset_0_1px_0_white,0_2px_7px_rgba(63,44,82,.04)]" initial={{ opacity: 0, y: 5 }} transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}>
    <div className="p-3.5">
      <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#9B72CF] text-white shadow-[0_4px_10px_rgba(155,114,207,.22)]"><Flag size={13} /></span><div><p className="text-[8px] font-semibold uppercase tracking-[.14em] text-[#887A95]">Departure readiness</p><p className="mt-0.5 text-[9px] font-medium text-[#AAA1B2]">Your shortest path to packed</p></div>{destination && <span className="ml-auto flex items-center gap-1 rounded-full border border-[#E1D7EA] bg-white/80 px-2 py-1 text-[8px] font-semibold text-[#755B91]"><MapPin size={9} />{destination}</span>}</div>

      <div className="mt-3 flex items-end justify-between border-b border-[#E9E2EE] pb-3"><div><b className="block text-[22px] leading-none tracking-[-.055em] text-[#332C3A]">{remaining} items open</b><p className="mt-1.5 text-[9px] font-medium text-[#827A89]">{checked} essentials are already secured.</p></div><div className="flex -space-x-1">{Array.from({ length: Math.min(4, remaining) }, (_, index) => <motion.span animate={{ scale: 1 }} className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#EFE8F5] text-[8px] font-semibold text-[#8466A6] shadow-[0_1px_3px_rgba(0,0,0,.08)]" initial={{ scale: 0 }} key={index} transition={{ delay: .12 + index * .04 }}>{index + 1}</motion.span>)}</div></div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">{openItems.slice(0, 4).map((item, index) => <motion.div animate={{ opacity: 1, x: 0 }} className="flex min-w-0 items-center gap-2 rounded-[9px] border border-[#E8E1ED] bg-white/82 px-2.5 py-2" initial={{ opacity: 0, x: -4 }} key={item} transition={{ delay: .16 + index * .045 }}><Circle size={10} className="shrink-0 text-[#A78AC3]" /><span className="truncate text-[8px] font-medium text-[#625A68]">{item}</span></motion.div>)}{(openItems.length > 4 || undisplayed > 0) && <div className="col-span-2 text-right text-[8px] font-semibold text-[#9278AC]">+{Math.max(0, openItems.length - 4) + undisplayed} more on the source list</div>}</div>

      {(secured || attention) && <div className="mt-3 grid grid-cols-2 gap-2">{secured && <div className={`rounded-[10px] bg-[#F2F8F3] p-2.5 ${attention ? '' : 'col-span-2'}`}><ShieldCheck size={13} className="text-[#34A853]" /><p className="mt-1.5 line-clamp-3 text-[8px] font-medium leading-[1.45] text-[#55705C]">{secured}</p></div>}{attention && <div className={`rounded-[10px] bg-[#FBF6EF] p-2.5 ${secured ? '' : 'col-span-2'}`}><Sparkles size={13} className="text-[#B98535]" /><p className="mt-1.5 line-clamp-3 text-[8px] font-medium leading-[1.45] text-[#79664C]">{attention}</p></div>}</div>}
    </div>

    {actions.length > 0 && <div className="border-t border-[#E7DFEC] bg-white/65 px-3.5 py-3"><div className="mb-2 flex items-center gap-1.5"><Check size={10} className="text-[#9B72CF]" /><span className="text-[7px] font-semibold uppercase tracking-[.14em] text-[#95899F]">Finish line</span></div><div className="flex flex-wrap gap-1.5">{actions.map((action, index) => <span className="flex items-center gap-1.5 rounded-full border border-[#E1D9E7] bg-white px-2 py-1.5 text-[8px] font-medium text-[#696071] shadow-[0_1px_2px_rgba(40,30,50,.03)]" key={action}><i className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#9B72CF] text-[6px] not-italic text-white">{index + 1}</i>{stripPeriod(action)}</span>)}</div></div>}
  </motion.section>;
}
