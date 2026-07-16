import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, CircleDot, FileText, MapPin, Plane, Sparkles, TrendingUp } from 'lucide-react';

import type { DashboardComposition as DashboardCompositionPlan, DashboardPrimitive } from '../../../../shared/types';

function numericProgress(primitive: DashboardPrimitive): number {
  const percentage = primitive.primary.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentage) return Math.min(100, Number(percentage[1]));
  const fraction = primitive.primary.match(/(\d+)\s*\/\s*(\d+)/);
  if (fraction && Number(fraction[2])) return Math.min(100, Number(fraction[1]) / Number(fraction[2]) * 100);
  const values = [primitive.primary, primitive.secondary].map((item) => Number(item.replaceAll(/[^0-9.]/g, '')) || 0);
  return values[0] + values[1] > 0 ? values[0] / (values[0] + values[1]) * 100 : 0;
}

function comparisonWidths(items: string[]): number[] {
  const magnitudes = items.map((item) => Number(item.match(/-?\d[\d,.]*/)?.[0].replaceAll(',', '')) || 0);
  const maximum = Math.max(...magnitudes);
  return maximum > 0 ? magnitudes.map((value) => Math.max(8, value / maximum * 100)) : items.map(() => 100);
}

function Primitive({ primitive, color, prominent }: { primitive: DashboardPrimitive; color: string; prominent: boolean }) {
  const values = primitive.values.filter(Boolean).slice(0, 4);
  const progress = numericProgress(primitive);
  const RouteIcon = /flight|trip|journey|airport/i.test(primitive.label) ? Plane : ArrowRight;
  const shell = prominent ? 'rounded-[11px] border border-[#E7E5E9] bg-[linear-gradient(145deg,#FFFFFF,#FAFAFB)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_1px_2px_rgba(25,25,30,.03)]' : '';

  if (primitive.type === 'metric') return <motion.div className={shell} whileHover={{ y: -1 }}><p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#98969D]">{primitive.label}</p><b className={`${prominent ? 'text-[21px]' : 'text-[15px]'} mt-1 block truncate font-semibold leading-none tracking-[-0.055em] text-[#2E2E34]`}>{primitive.primary}</b><p className="mt-1 truncate text-[8px] font-medium text-[#77767D]">{[primitive.secondary, primitive.tertiary].filter(Boolean).join(' · ')}</p></motion.div>;

  if (primitive.type === 'route') return <div className={`${shell} flex items-center justify-between`}><span><b className="block text-[14px] leading-none tracking-[-0.035em] text-[#292A2F]">{primitive.primary}</b><small className="mt-1 block text-[7px] font-medium uppercase tracking-[0.09em] text-[#99979D]">Start</small></span><div className="mx-2.5 flex flex-1 items-center gap-1 text-[#86858B]"><span className="h-px flex-1 border-t border-dashed border-[#C9C7CB]" /><span className="grid h-6 w-6 place-items-center rounded-full" style={{ backgroundColor: `${color}16`, color }}><RouteIcon size={13} strokeWidth={2.3} /></span><span className="h-px flex-1 border-t border-dashed border-[#C9C7CB]" /></div><span className="text-right"><b className="block text-[14px] leading-none tracking-[-0.035em] text-[#292A2F]">{primitive.secondary}</b><small className="mt-1 block text-[7px] font-medium uppercase tracking-[0.09em] text-[#99979D]">Next</small></span></div>;

  if (primitive.type === 'ring') return <div className={`${shell} flex items-center gap-3`}><div className="relative grid h-[58px] w-[58px] shrink-0 place-items-center"><svg className="h-[58px] w-[58px] -rotate-90"><circle cx="29" cy="29" fill="none" r="23" stroke="#EAE9E6" strokeWidth="6.5" /><motion.circle animate={{ strokeDashoffset: 144.5 * (1 - progress / 100) }} cx="29" cy="29" fill="none" r="23" stroke={color} strokeDasharray="144.5" strokeLinecap="round" strokeWidth="6.5" transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} /></svg><b className="absolute max-w-[40px] truncate text-[9px] font-semibold tracking-[-0.04em] text-[#34343A]">{primitive.primary}</b></div><div className="min-w-0"><p className="text-[7px] font-semibold uppercase tracking-[0.1em] text-[#99979D]">{primitive.label}</p><p className="mt-1 truncate text-[9px] font-medium text-[#4D4D53]">{primitive.secondary}</p><p className="mt-1 truncate text-[8px] text-[#88878D]">{primitive.tertiary}</p></div></div>;

  if (primitive.type === 'progress') return <div className={shell}><div className="flex items-end justify-between"><span><b className="text-[18px] leading-none tracking-[-0.055em] text-[#303036]">{primitive.primary}</b><small className="ml-1 text-[8px] font-medium text-[#77767D]">{primitive.secondary}</small></span><span className="text-[8px] font-semibold" style={{ color }}>{Math.round(progress)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E9E7EB] shadow-[inset_0_1px_1px_rgba(30,30,35,.07)]"><motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}C9)` }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} /></div>{primitive.tertiary && <p className="mt-1.5 truncate text-[8px] text-[#8C8A91]">{primitive.tertiary}</p>}</div>;

  if (primitive.type === 'map') return <div className={`${shell} relative h-[68px] overflow-hidden bg-[#F1EEE7]`} style={{ backgroundImage: 'linear-gradient(30deg,transparent 43%,rgba(255,255,255,.84) 44%,rgba(255,255,255,.84) 47%,transparent 48%),linear-gradient(112deg,transparent 49%,rgba(255,255,255,.75) 50%,rgba(255,255,255,.75) 53%,transparent 54%)' }}>{values.slice(0, 3).map((place, index) => <span className="absolute" key={place} style={{ left: `${18 + index * 30}%`, top: `${18 + (index % 2) * 25}%` }}><MapPin fill={color} size={16 + index % 2 * 2} style={{ color }} /><small className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[7px] font-medium text-[#5D5A60]">{place}</small></span>)}</div>;

  if (primitive.type === 'timeline') return <div className={shell}><div className="flex items-center">{(values.length ? values : [primitive.primary, primitive.secondary, primitive.tertiary]).filter(Boolean).slice(0, 3).map((item, index, items) => <div className="contents" key={item}><span className="min-w-0 flex-1 text-center"><i className="mx-auto block h-2 w-2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,.16)]" style={{ backgroundColor: color }} /><small className="mt-1 block truncate text-[7px] font-medium text-[#65646B]">{item}</small></span>{index < items.length - 1 && <span className="-mt-3 h-px w-3 bg-[#D9D7DC]" />}</div>)}</div></div>;

  if (primitive.type === 'ranked-list') return <div className={`${shell} space-y-1.5`}>{(values.length ? values : [primitive.primary, primitive.secondary, primitive.tertiary]).filter(Boolean).slice(0, 3).map((item, index) => <div className="flex items-center gap-2" key={item}><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[7px] font-semibold text-white" style={{ backgroundColor: color, opacity: 1 - index * 0.16 }}>{index + 1}</span><span className="truncate text-[8px] font-medium text-[#59585F]">{item}</span></div>)}</div>;

  if (primitive.type === 'comparison') {
    const items = (values.length ? values : [primitive.primary, primitive.secondary, primitive.tertiary]).filter(Boolean).slice(0, 3);
    const widths = comparisonWidths(items);
    return <div className={`${shell} space-y-1.5`}>{items.map((item, index) => <div key={item}><div className="mb-0.5 truncate text-[7px] text-[#6E6D74]">{item}</div><div className="h-1 overflow-hidden rounded-full bg-[#EAE9EC]"><div className="h-full rounded-full" style={{ backgroundColor: color, opacity: 1 - index * 0.16, width: `${widths[index]}%` }} /></div></div>)}</div>;
  }

  if (primitive.type === 'source-evidence') return <div className={`${shell} flex flex-wrap gap-1.5`}>{(values.length ? values : [primitive.primary, primitive.secondary]).filter(Boolean).slice(0, 4).map((item) => <span className="flex min-w-0 items-center gap-1 rounded-full border border-[#E6E4E8] bg-white px-2 py-1 text-[7px] font-medium text-[#6F6D75]" key={item}><FileText size={9} style={{ color }} /><span className="max-w-[82px] truncate">{item}</span></span>)}</div>;

  if (primitive.type === 'status') return <div className={`${shell} flex items-center gap-2.5`}><span className="grid h-7 w-7 place-items-center rounded-[9px]" style={{ backgroundColor: `${color}16`, color }}><CircleDot size={14} /></span><span className="min-w-0"><small className="block text-[7px] font-semibold uppercase tracking-[0.1em] text-[#99979D]">{primitive.label}</small><b className="block truncate text-[10px] text-[#45444B]">{primitive.primary}</b><span className="block truncate text-[8px] text-[#85838B]">{primitive.secondary}</span></span></div>;

  if (primitive.type === 'calendar') return <div className={`${shell} grid grid-cols-3 gap-1.5`}>{(values.length ? values : [primitive.primary, primitive.secondary, primitive.tertiary]).slice(0, 3).map((date, index) => <span className="rounded-[7px] border border-[#E8E6EA] bg-white px-1 py-1.5 text-center" key={date || index}><CalendarDays className="mx-auto" size={10} style={{ color }} /><b className="mt-1 block truncate text-[7px] text-[#55545B]">{date || '—'}</b></span>)}</div>;

  return <div className={`${shell} flex items-center gap-2`}><TrendingUp size={13} style={{ color }} /><span className="truncate text-[9px] text-[#5A5960]">{primitive.primary}</span></div>;
}

export default function DashboardComposition({ composition, color }: { composition: DashboardCompositionPlan; color: string }) {
  const primitives = composition.primitives.slice(0, 3);
  const layout = composition.layout;
  return <motion.div className={`mt-3 ${layout === 'split' || layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`} initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055 } } }}>
    {primitives.map((primitive, index) => <motion.div className={layout === 'hero-stack' && index === 0 ? 'col-span-2' : ''} key={primitive.id} variants={{ hidden: { opacity: 0, y: 3 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.24 }}><Primitive color={color} primitive={primitive} prominent={layout === 'hero-stack' ? index === 0 : layout === 'stack'} /></motion.div>)}
    {!primitives.length && <div className="flex items-center gap-2 rounded-[9px] bg-[#FAF9FB] px-2.5 py-2 text-[9px] text-[#77757D]"><Sparkles size={12} style={{ color }} />Aether is composing this section.</div>}
  </motion.div>;
}
