import { AnimatePresence, motion } from 'framer-motion';
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react';
import { BookOpen, CarFront, Check, CheckSquare, ChevronDown, Clipboard, Download, FileText, ListChecks, Map, MapPin, MoreHorizontal, Plane, Plus, Sparkles as SparklesIcon, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType } from 'react';

import type { AnalyzedFile, DashboardBudgetRow, DashboardModule, DashboardModuleKind, DashboardPackingItem, DashboardPlan, DashboardState, RelationshipType, SuggestedCluster } from '../../../../shared/types';
import BudgetDetail from './BudgetDetail';
import DashboardComposition from './DashboardComposition';
import InteractiveMap, { type DashboardLocation } from './InteractiveMap';

export type SummaryCardNodeData = { cluster: SuggestedCluster; files: AnalyzedFile[]; dashboard?: DashboardState; dashboardPlan?: DashboardPlan; assemblyDelay?: number };
export type SummaryCardNodeType = Node<SummaryCardNodeData, 'summaryCard'>;

const COLORS: Record<RelationshipType, string> = { dates: '#4A90D9', cost: '#34A853', place: '#EA4335', tasks: '#9B72CF' };
const iconForKind: Record<DashboardModuleKind, ComponentType<{ size?: number; strokeWidth?: number }>> = { overview: SparklesIcon, timeline: Plane, budget: Wallet, checklist: CheckSquare, map: Map, tasks: ListChecks, topics: BookOpen, resources: FileText, results: SparklesIcon };
const iconForPlan = { sparkles: SparklesIcon, plane: Plane, wallet: Wallet, 'check-square': CheckSquare, map: Map, 'list-checks': ListChecks, 'book-open': BookOpen, 'file-text': FileText } as const;
const relationshipFor = (kind: DashboardModuleKind): RelationshipType | null => ({ timeline: 'dates', budget: 'cost', checklist: 'tasks', tasks: 'tasks', map: 'place' } as Partial<Record<DashboardModuleKind, RelationshipType>>)[kind] ?? null;
const colorFor = (module: DashboardModule) => module.accent === 'dates' ? COLORS.dates : module.accent === 'cost' ? COLORS.cost : module.accent === 'place' ? COLORS.place : module.accent === 'tasks' ? COLORS.tasks : '#9B72CF';
const value = (data: Record<string, unknown>, key: string) => typeof data[key] === 'string' ? data[key] : '';
const numberValue = (data: Record<string, unknown>, key: string) => typeof data[key] === 'number' && Number.isFinite(data[key]) ? data[key] : undefined;
const money = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
const emit = (name: string, detail: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));
const dataValue = (files: AnalyzedFile[], key: string) => files.map((file) => value(file.smartPreview.displayData, key)).find(Boolean) ?? '';
type ModuleWithoutCompact = Omit<DashboardModule, 'compact'>;

function compactFor(module: ModuleWithoutCompact, files: AnalyzedFile[]) {
  if (module.visual === 'route-rail') return { primary: dataValue(files, 'origin') || files.flatMap((file) => file.entities.dates)[0]?.display || 'Start', secondary: dataValue(files, 'destination') || files.flatMap((file) => file.entities.dates).at(-1)?.display || 'Next', tertiary: dataValue(files, 'checkIn') || 'Next step' };
  if (module.visual === 'ring-metric') return { primary: dataValue(files, 'total') || 'Budget', secondary: 'Tracked', tertiary: `${files.flatMap((file) => file.entities.costs).length} items` };
  if (module.visual === 'progress') { const tasks = files.flatMap((file) => file.entities.tasks); return { primary: `${tasks.filter((task) => task.completed).length} / ${tasks.length}`, secondary: 'complete', tertiary: '' }; }
  if (module.visual === 'pin-map') { const locations = files.flatMap((file) => file.entities.locations); return { primary: locations[0]?.name ?? '', secondary: locations[1]?.name ?? '', tertiary: locations[2]?.name ?? '' }; }
  return { primary: module.title, secondary: `${module.sourceFileIds.length} source files`, tertiary: '' };
}

function fallbackPlan(files: AnalyzedFile[], cluster: SuggestedCluster): DashboardPlan {
  const modules: ModuleWithoutCompact[] = [{ id: 'overview', kind: 'overview', title: cluster.category === 'education' ? 'Key concepts' : 'Overview', summary: files.map((file) => file.summary).slice(0, 2).join(' '), icon: 'sparkles', accent: 'neutral', visual: 'key-points', interactions: ['expand', 'focus-source'], sourceFileIds: files.map((file) => file.id) }];
  if (files.some((file) => file.entities.dates.length)) modules.push({ id: 'timeline', kind: 'timeline', title: cluster.category === 'travel' ? 'Journey' : 'Timeline', summary: 'Important dates synthesized from your source files.', icon: 'plane', accent: 'dates', visual: cluster.category === 'travel' ? 'route-rail' : 'milestone-list', interactions: ['expand', 'focus-source', 'copy'], sourceFileIds: files.filter((file) => file.entities.dates.length).map((file) => file.id) });
  if (files.some((file) => file.entities.costs.length)) modules.push({ id: 'budget', kind: 'budget', title: 'Budget', summary: 'Editable amounts grounded in the files you added.', icon: 'wallet', accent: 'cost', visual: 'ring-metric', interactions: ['expand', 'edit-values', 'export'], sourceFileIds: files.filter((file) => file.entities.costs.length).map((file) => file.id) });
  if (files.some((file) => file.entities.tasks.length)) modules.push({ id: 'tasks', kind: 'tasks', title: cluster.category === 'travel' ? 'Packing' : 'Tasks', summary: 'Track the actionable items Aether found.', icon: 'list-checks', accent: 'tasks', visual: 'progress', interactions: ['expand', 'toggle-item', 'add-item'], sourceFileIds: files.filter((file) => file.entities.tasks.length).map((file) => file.id) });
  if (files.some((file) => file.entities.locations.length)) modules.push({ id: 'map', kind: 'map', title: cluster.category === 'travel' ? 'Map' : 'Places', summary: 'Places mentioned across this workspace.', icon: 'map', accent: 'place', visual: 'pin-map', interactions: ['expand', 'focus-source', 'open-map'], sourceFileIds: files.filter((file) => file.entities.locations.length).map((file) => file.id) });
  return { title: cluster.name, subtitle: cluster.dateRange, category: cluster.category, headerIcon: cluster.category === 'travel' ? 'map' : cluster.category === 'education' ? 'book-open' : 'sparkles', headerAccent: cluster.category === 'travel' ? 'place' : 'neutral', modules: modules.map((module) => ({ ...module, compact: compactFor(module, files) })) };
}

function CompactPreview({ module, color }: { module: DashboardModule; color: string }) {
  const compact = module.compact;

  if (module.composition?.primitives.length) return <DashboardComposition color={color} composition={module.composition} />;

  if (module.visual === 'route-rail') return (
    <div className="mt-3">
      <div className="flex items-center justify-between rounded-[10px] border border-[#E8E7E4] bg-[linear-gradient(135deg,#FFFFFF_0%,#FAFAF9_100%)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(31,31,36,0.03)]">
        <span><b className="block text-[14px] leading-none tracking-[-0.03em] text-[#26262A]">{compact.primary}</b><small className="mt-1 block text-[8px] font-medium uppercase tracking-[0.08em] text-[#929198]">Depart</small></span>
        <div className="mx-3 flex flex-1 items-center gap-1.5 text-[#68727D]"><span className="h-px flex-1 border-t border-dashed border-[#C3C4C6]" /><span className="grid h-6 w-6 place-items-center rounded-full bg-[#EEF5FC] text-[#4A90D9]"><Plane size={14} strokeWidth={2.4} /></span><span className="h-px flex-1 border-t border-dashed border-[#C3C4C6]" /></div>
        <span className="text-right"><b className="block text-[14px] leading-none tracking-[-0.03em] text-[#26262A]">{compact.secondary}</b><small className="mt-1 block text-[8px] font-medium uppercase tracking-[0.08em] text-[#929198]">Arrive</small></span>
      </div>
      {compact.tertiary && <p className="mt-2 flex items-center gap-1.5 px-0.5 text-[10px] font-medium text-[#67676E]"><span className="grid h-4 w-4 place-items-center rounded-[5px] bg-[#F1F6FC]" style={{ color }}><CarFront size={11} strokeWidth={2.2} /></span>{compact.tertiary}</p>}
    </div>
  );

  if (module.visual === 'ring-metric') {
    const spent = Number(compact.primary.replaceAll(/[^0-9.]/g, '')) || 0;
    const remaining = Number(compact.tertiary.replaceAll(/[^0-9.]/g, '')) || 0;
    const progress = spent + remaining > 0 ? spent / (spent + remaining) : 0.72;
    return (
      <div className="mt-3 flex items-center gap-4">
        <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_42%,#FFFFFF_0%,#FCFCFB_58%,#F0EFEC_100%)] shadow-[inset_0_1px_2px_rgba(27,27,31,0.055),0_2px_6px_rgba(35,61,42,.04)]">
          <svg className="absolute h-[68px] w-[68px] -rotate-90"><circle cx="34" cy="34" fill="none" r="27" stroke="#ECEBE8" strokeWidth="7.5" /><motion.circle animate={{ strokeDashoffset: 169.65 * (1 - progress) }} cx="34" cy="34" fill="none" r="27" stroke={color} strokeDasharray="169.65" strokeLinecap="round" strokeWidth="7.5" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} /></svg>
          <span className="relative text-center"><b className="block max-w-[48px] truncate text-[11px] font-semibold tracking-[-0.045em] text-[#2F3034]">{compact.primary}</b><small className="mt-0.5 block text-[7px] font-medium uppercase tracking-[0.08em] text-[#99979C]">of total</small></span>
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-[10px]"><p className="flex items-center gap-2 font-medium text-[#4B4C51]"><i className="h-2.5 w-2.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,.42),0_1px_2px_rgba(0,0,0,.14)]" style={{ backgroundColor: color }} /><span className="flex-1">{compact.secondary}</span><b className="font-semibold text-[#37383D]">{compact.primary}</b></p><p className="flex items-center gap-2 text-[#85848A]"><i className="h-2.5 w-2.5 rounded-full bg-[#C7C5C0]" /><span className="truncate">{compact.tertiary}</span></p></div>
      </div>
    );
  }

  if (module.visual === 'progress') {
    const match = compact.primary.match(/(\d+)\s*\/\s*(\d+)/);
    const progress = match ? Math.min(100, Number(match[1]) / Number(match[2]) * 100) : 55;
    return <div className="mt-3"><p className="text-[11px] text-[#66666D]"><b className="mr-1 text-[23px] leading-none tracking-[-0.06em] text-[#2D2D32]">{compact.primary}</b>{compact.secondary}</p><div className="mt-2.5 h-[7px] overflow-hidden rounded-full bg-[#EAE8ED] shadow-[inset_0_1px_2px_rgba(29,29,33,0.08)]"><motion.div animate={{ width: `${progress}%` }} className="relative h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}CC)` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}><span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/70 bg-white/55 shadow-[0_1px_3px_rgba(0,0,0,0.2)]" /></motion.div></div></div>;
  }

  if (module.visual === 'pin-map') return <div className="relative mt-3 h-[76px] overflow-hidden rounded-[10px] border border-[#E6E2D8] bg-[#F0ECE4] shadow-[inset_0_1px_0_rgba(255,255,255,.72)]" style={{ backgroundImage: 'linear-gradient(28deg, transparent 42%, rgba(255,255,255,.88) 43%, rgba(255,255,255,.88) 46%, transparent 47%), linear-gradient(112deg, transparent 48%, rgba(255,255,255,.78) 49%, rgba(255,255,255,.78) 52%, transparent 53%), radial-gradient(circle at 80% 10%, rgba(255,255,255,.72), transparent 34%)' }}><span className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white/45 to-transparent" /><MapPin className="absolute left-[21%] top-[31%] drop-shadow-[0_2px_2px_rgba(70,35,20,.22)]" fill={color} size={21} style={{ color }} /><MapPin className="absolute left-[50%] top-[48%] drop-shadow-[0_2px_2px_rgba(70,35,20,.22)]" fill={color} size={18} style={{ color }} /><MapPin className="absolute right-[19%] top-[18%] drop-shadow-[0_2px_2px_rgba(70,35,20,.22)]" fill={color} size={21} style={{ color }} /><span className="absolute bottom-1.5 left-2.5 text-[8px] font-medium text-[#57545A]">{compact.primary}</span><span className="absolute bottom-1.5 left-[42%] text-[8px] font-medium text-[#57545A]">{compact.secondary}</span><span className="absolute right-2.5 top-1.5 text-[8px] font-medium text-[#57545A]">{compact.tertiary}</span></div>;

  if (module.visual === 'key-points') {
    const points = module.summary.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2);
    return <div className="mt-3 overflow-hidden rounded-[10px] border border-[#EAE7EF] bg-[linear-gradient(135deg,#FBF9FE_0%,#FFFFFF_100%)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]"><p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#876BA5]">Workspace brief</p><div className="space-y-1.5">{(points.length ? points : [compact.primary, compact.secondary]).map((point, index) => <p className="flex gap-2 text-[10px] leading-[1.45] text-[#5D5963]" key={`${point}-${index}`}><span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_1px_2px_rgba(55,32,75,.25)]" style={{ backgroundColor: color }} />{point}</p>)}</div></div>;
  }

  if (module.visual === 'stat-grid') return <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[10px] border border-[#E8E7E9] bg-[#FCFCFC] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">{[compact.primary, compact.secondary, compact.tertiary].map((stat, index) => <div className={`min-w-0 px-2 py-2.5 text-center ${index ? 'border-l border-[#ECEBED]' : ''}`} key={stat || index}><b className="block truncate text-[11px] tracking-[-0.025em] text-[#35353B]">{stat || '—'}</b><span className="mt-1 block text-[7px] font-medium uppercase tracking-[0.08em] text-[#96959B]">{['Current', 'Tracked', 'Next'][index]}</span></div>)}</div>;

  if (module.visual === 'priority-stack') return <div className="mt-3 space-y-1.5">{[compact.primary, compact.secondary, compact.tertiary].filter(Boolean).map((label, index) => <div className="flex items-center gap-2 rounded-[8px] border border-[#ECEAED] bg-white px-2.5 py-1.5 shadow-[0_1px_2px_rgba(25,25,30,.025)]" key={label} style={{ marginLeft: `${index * 5}px` }}><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white" style={{ backgroundColor: color, opacity: 1 - index * 0.16 }}>{index + 1}</span><span className="truncate text-[10px] font-medium text-[#55535B]">{label}</span></div>)}</div>;

  if (module.visual === 'calendar-strip') return <div className="mt-3 grid grid-cols-3 gap-1.5">{[compact.primary, compact.secondary, compact.tertiary].map((date, index) => <div className="rounded-[9px] border border-[#E8E7EA] bg-[linear-gradient(180deg,#FFFFFF,#FAFAFA)] px-1.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.95)]" key={date || index}><span className="block text-[7px] font-semibold uppercase tracking-[0.1em] text-[#99979D]">{['Start', 'Focus', 'Due'][index]}</span><b className="mt-1 block truncate text-[10px] tracking-[-0.02em] text-[#3E3D43]">{date || '—'}</b></div>)}</div>;

  if (module.visual === 'activity-stream') return <div className="mt-3 space-y-2 border-l-2 pl-3" style={{ borderColor: `${color}40` }}>{[compact.primary, compact.secondary, compact.tertiary].filter(Boolean).map((event, index) => <div className="relative text-[10px] text-[#5F5E65]" key={event}><span className="absolute -left-[18px] top-[4px] h-2 w-2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,.14)]" style={{ backgroundColor: color }} />{event}</div>)}</div>;

  if (module.visual === 'comparison-bars') return <div className="mt-3 space-y-2">{[compact.primary, compact.secondary, compact.tertiary].filter(Boolean).map((label, index) => <div key={label}><div className="mb-1 flex justify-between text-[9px] text-[#65646B]"><span className="truncate">{label}</span><span>{[82, 58, 36][index]}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#ECEBED]"><div className="h-full rounded-full" style={{ width: `${[82, 58, 36][index]}%`, backgroundColor: color, opacity: 1 - index * 0.17 }} /></div></div>)}</div>;

  if (module.visual === 'source-list') return <div className="mt-3 space-y-1.5">{[compact.primary, compact.secondary, compact.tertiary].filter(Boolean).map((source, index) => <div className="flex items-center gap-2 rounded-[8px] bg-[#FAFAFB] px-2.5 py-1.5 text-[10px] text-[#5C5B62]" key={source}><FileText size={12} style={{ color }} /><span className="truncate">{source}</span><span className="ml-auto text-[8px] text-[#A09FA4]">{index + 1}</span></div>)}</div>;

  return <div className="mt-3 rounded-[9px] border border-[#EEEBE6] bg-[#FBFAF8] px-3 py-2.5 text-[10px] leading-4 text-[#6A696F]"><b className="block font-semibold text-[#38383E]">{compact.primary}</b><span>{[compact.secondary, compact.tertiary].filter(Boolean).join(' · ')}</span></div>;
}

function ModuleShell({ module, open, onToggle, onHover, children }: { module: DashboardModule; open: boolean; onToggle: () => void; onHover: (active: boolean) => void; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = iconForPlan[module.icon] ?? iconForKind[module.kind];
  const relationship = relationshipFor(module.kind);
  const color = colorFor(module);
  useEffect(() => setIsOpen(open), [open]);
  return <motion.section layout className="group relative overflow-visible rounded-[14px] border px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.98),0_1px_2px_rgba(25,25,29,.035)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_18px_rgba(25,25,29,.075)]" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} style={{ background: `linear-gradient(138deg, #FFFFFF 0%, #FEFEFE 70%, ${color}0B 100%)`, borderColor: isOpen ? `${color}66` : '#E2E1E4' }} transition={{ duration: 0.22 }}>
    <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
    {relationship && <><Handle className="!h-[8px] !w-[8px] !border-0 !bg-transparent !opacity-0" id={`summary-${relationship}`} position={Position.Left} style={{ top: '50%' }} type="target" /><span aria-hidden className="pointer-events-none absolute left-[-11px] top-1/2 grid h-[19px] w-[19px] -translate-y-1/2 place-items-center rounded-full border-[3px] border-white shadow-[0_2px_7px_rgba(24,24,30,0.16)] transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: color }}><span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_1px_1px_rgba(0,0,0,.15)]" /></span></>}
    <button aria-expanded={isOpen} className="nodrag flex w-full items-center gap-2.5 rounded-[9px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#4A90D9]/40" onClick={onToggle} type="button"><motion.span className="grid h-7 w-7 place-items-center rounded-full text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.42),0_3px_7px_rgba(30,30,35,.17)]" style={{ background: `linear-gradient(145deg, ${color}, ${color}D5)` }} whileHover={{ scale: 1.06 }}><Icon size={15} strokeWidth={2.45} /></motion.span><span className="flex-1 text-[12px] font-semibold tracking-[-0.015em] text-[#303036]">{module.title}</span><span className="grid h-6 w-6 place-items-center rounded-full text-[#8D8D94] transition-colors group-hover:bg-white/80 group-hover:text-[#55555C]"><ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={15} /></span></button>
    <CompactPreview color={color} module={module} />
    <AnimatePresence>{isOpen && <motion.div animate={{ opacity: 1, scale: 1, x: 0 }} className="nodrag absolute left-[calc(100%+70px)] top-0 z-50 w-[350px]" exit={{ opacity: 0, scale: 0.98, x: -8 }} initial={{ opacity: 0, scale: 0.98, x: -12 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}><svg aria-hidden className="pointer-events-none absolute right-full top-8 h-8 w-[70px] overflow-visible" viewBox="0 0 70 32"><path d="M0 16 C22 16, 42 16, 70 16" fill="none" stroke={color} strokeDasharray="2 5" strokeLinecap="round" strokeOpacity="0.78" strokeWidth="2" /><circle cx="4" cy="16" fill="white" r="4" stroke={color} strokeWidth="2" /><circle cx="66" cy="16" fill="white" r="4" stroke={color} strokeWidth="2" /></svg><div className="max-h-[560px] overflow-y-auto rounded-[17px] border border-[#DCDADF] bg-[linear-gradient(145deg,#FFFFFF_0%,#FCFCFD_100%)] p-4 shadow-[0_20px_48px_rgba(25,25,30,0.18),0_2px_5px_rgba(25,25,30,0.06)]"><div className="mb-3.5 flex items-center gap-2.5 border-b border-[#ECEBED] pb-3"><span className="grid h-8 w-8 place-items-center rounded-[10px] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.4),0_2px_4px_rgba(25,25,30,.15)]" style={{ background: `linear-gradient(145deg, ${color}, ${color}D9)` }}><Icon size={16} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold tracking-[-0.02em] text-[#303036]">{module.title}</p><p className="mt-0.5 truncate text-[9px] font-medium tracking-[0.02em] text-[#909096]">EXPANDED DETAILS · {module.sourceFileIds.length} SOURCES</p></div><button aria-label={`Close ${module.title} details`} className="grid h-7 w-7 place-items-center rounded-full text-[#85858B] transition hover:bg-[#F0EFF2] hover:text-[#494950]" onClick={onToggle} type="button"><X size={14} /></button></div>{children}</div></motion.div>}</AnimatePresence>
  </motion.section>;
}

export default function SummaryCardNode({ id, data, selected }: NodeProps<SummaryCardNodeType>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data.cluster.name);
  const [menu, setMenu] = useState(false);
  const [newItem, setNewItem] = useState('');
  const dashboard = data.dashboard ?? {};
  const fallback = fallbackPlan(data.files, data.cluster);
  const plan = data.dashboardPlan?.modules.every((module) => Boolean(module.visual) && Array.isArray(module.interactions) && Boolean(module.compact)) ? data.dashboardPlan : fallback;
  const HeaderIcon = iconForPlan[plan.headerIcon] ?? SparklesIcon;
  const Sparkles = HeaderIcon;
  const headerColor = plan.headerAccent === 'dates' ? COLORS.dates : plan.headerAccent === 'cost' ? COLORS.cost : plan.headerAccent === 'place' ? COLORS.place : plan.headerAccent === 'tasks' ? COLORS.tasks : '#7B57A9';
  const openModule = dashboard.expandedSection;
  const costs = data.files.flatMap((file) => file.entities.costs);
  const previewBudget = data.files.find((file) => file.smartPreview.type === 'budget')?.smartPreview.displayData ?? {};
  const initialRows = useMemo<DashboardBudgetRow[]>(() => {
    const rows: Array<{ category?: string; estimate?: number; actual?: number }> = Array.isArray(previewBudget.rows) ? previewBudget.rows as Array<{ category?: string; estimate?: number; actual?: number }> : costs.filter((cost) => !/\b(total|spent|remaining)\b/i.test(cost.label)).map((cost) => ({ category: cost.label, estimate: cost.amount }));
    return rows.map((row, index) => ({ id: `source-${index}`, category: row.category || 'Other', estimate: typeof row.estimate === 'number' ? row.estimate : 0, actual: typeof row.actual === 'number' ? row.actual : undefined }));
  }, [costs, previewBudget]);
  const budgetRows = dashboard.budgetRows ?? initialRows;
  const checklistFile = data.files.find((file) => file.smartPreview.type === 'checklist') ?? data.files.find((file) => file.entities.tasks.length);
  const initialItems = useMemo<DashboardPackingItem[]>(() => {
    const raw = checklistFile && Array.isArray(checklistFile.smartPreview.displayData.items) ? checklistFile.smartPreview.displayData.items as Array<{ text?: string; checked?: boolean }> : checklistFile?.entities.tasks.map((task) => ({ text: task.item, checked: task.completed })) ?? [];
    return raw.map((item, index) => ({ id: `source-${index}`, text: item.text || 'Untitled item', checked: Boolean(item.checked), source: 'file' }));
  }, [checklistFile]);
  const items = dashboard.packingItems ?? initialItems;
  const locations: DashboardLocation[] = data.files.flatMap((file) => file.entities.locations.map((location) => ({ ...location, fileName: file.fileName }))).filter((location, index, all) => all.findIndex((item) => item.name === location.name) === index);
  const rowTotal = budgetRows.reduce((sum, row) => sum + row.estimate, 0);
  const importedPlanned = numberValue(previewBudget, 'estimatedTotal') ?? numberValue(previewBudget, 'total') ?? costs.find((cost) => /(?:estimated|planned|budget)\s+total|total\s+(?:estimate|budget)/i.test(cost.label))?.amount;
  const total = dashboard.budgetRows ? rowTotal : importedPlanned ?? rowTotal;
  const importedActual = numberValue(previewBudget, 'actualTotal') ?? costs.find((cost) => /actual\s+total|total\s+(?:actual|spent)|spent\s+total/i.test(cost.label))?.amount;
  const explicitActuals = budgetRows.filter((row) => row.actual !== undefined);
  const actual = explicitActuals.length > 0 ? explicitActuals.reduce((sum, row) => sum + (row.actual ?? 0), 0) : importedActual ?? 0;
  const importedAggregate = explicitActuals.length === 0 && importedActual !== undefined;
  const packed = items.filter((item) => item.checked).length;
  const currency = value(previewBudget, 'currency') || costs[0]?.currency || 'USD';
  const patch = (next: Partial<DashboardState>) => emit('aether:dashboard-state', { summaryId: id, patch: next });
  const toggle = (module: DashboardModule) => {
    const opening = openModule !== module.id;
    patch({ expandedSection: opening ? module.id as DashboardState['expandedSection'] : undefined });
    if (opening) emit('aether:reveal-summary-detail', id);
  };
  const focus = (module: DashboardModule, active: boolean) => emit('aether:summary-section-focus', active ? relationshipFor(module.kind) : null);
  const sourceFiles = (module: DashboardModule) => data.files.filter((file) => module.sourceFileIds.includes(file.id));
  const displayModules = plan.modules.map((module) => {
    if (module.visual === 'progress') {
      const secondary = module.title.toLowerCase() === 'packing' ? 'packed' : 'complete';
      return {
        ...module,
        compact: { ...module.compact, primary: `${packed} / ${items.length}`, secondary },
        composition: module.composition ? {
          ...module.composition,
          primitives: module.composition.primitives.map((primitive) => primitive.type === 'progress' ? { ...primitive, primary: `${packed} / ${items.length}`, secondary, tertiary: `${Math.max(0, items.length - packed)} remaining` } : primitive),
        } : undefined,
      };
    }
    if (module.visual === 'ring-metric') {
      const remaining = total - actual;
      return {
        ...module,
        compact: { primary: money(actual, currency), secondary: 'Spent', tertiary: `${money(Math.max(0, remaining), currency)} remaining` },
        composition: module.composition ? {
          ...module.composition,
          primitives: module.composition.primitives.map((primitive) => primitive.type === 'ring' || primitive.type === 'metric' ? { ...primitive, primary: money(actual, currency), secondary: `of ${money(total, currency)} planned`, tertiary: remaining < 0 ? `${money(Math.abs(remaining), currency)} over` : `${money(remaining, currency)} remaining` } : primitive),
        } : undefined,
      };
    }
    return module;
  });
  useEffect(() => { requestAnimationFrame(() => updateNodeInternals(id)); }, [id, openModule, updateNodeInternals]);

  const content = (module: DashboardModule) => {
    const moduleSources = sourceFiles(module);
    if (module.visual === 'route-rail') {
      const dates = data.files.flatMap((file) => file.entities.dates.map((date) => ({ ...date, file }))).sort((left, right) => left.date.localeCompare(right.date)).slice(0, 5);
      return (
        <div className="space-y-3.5">
          <div className="overflow-hidden rounded-[12px] border border-[#DCE8F3] bg-[linear-gradient(145deg,#F9FCFF_0%,#F2F8FD_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.94)]">
            <div className="flex items-center justify-between border-b border-[#E2ECF5] px-3 py-2"><span className="text-[8px] font-semibold uppercase tracking-[0.13em] text-[#4A7FAF]">Trip flow</span><span className="rounded-full bg-white/70 px-2 py-0.5 text-[8px] font-medium text-[#6683A0]">{dates.length} key moments</span></div>
            <div className="flex items-center justify-between px-3 py-3"><div><b className="block text-[19px] leading-none tracking-[-0.045em] text-[#26313C]">{module.compact.primary}</b><span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.1em] text-[#71879A]">Departure</span></div><div className="mx-3 flex flex-1 items-center gap-1.5 text-[#4A90D9]"><span className="h-px flex-1 border-t border-dashed border-[#ABC8E1]" /><span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-[0_2px_5px_rgba(45,104,157,.16)]"><Plane size={16} strokeWidth={2.4} /></span><span className="h-px flex-1 border-t border-dashed border-[#ABC8E1]" /></div><div className="text-right"><b className="block text-[19px] leading-none tracking-[-0.045em] text-[#26313C]">{module.compact.secondary}</b><span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.1em] text-[#71879A]">Arrival</span></div></div>
            {module.compact.tertiary && <div className="flex items-center gap-2 border-t border-[#E2ECF5] bg-white/45 px-3 py-2 text-[10px] font-medium text-[#536778]"><span className="grid h-5 w-5 place-items-center rounded-[6px] bg-white text-[#4A90D9] shadow-[0_1px_2px_rgba(45,104,157,.1)]"><CarFront size={12} /></span>{module.compact.tertiary}</div>}
          </div>
          <div><div className="mb-2 flex items-center justify-between"><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#85858C]">Timeline</p><span className="text-[9px] text-[#A09FA5]">From your files</span></div><div className="relative space-y-2 border-l-2 border-[#D8E7F4] pl-4">{dates.map((date, index) => <button className="nodrag relative block w-full rounded-[9px] border border-transparent bg-[#FAFBFC] px-2.5 py-2 text-left transition hover:border-[#DDEAF5] hover:bg-[#F4F9FD] hover:shadow-[0_2px_5px_rgba(42,82,115,.06)]" key={`${date.file.id}-${date.label}`} onClick={() => emit('aether:focus-source-file', date.file.id)} type="button"><span className="absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#4A90D9] shadow-[0_1px_3px_rgba(34,92,145,.3)]" /><div className="flex items-center gap-2"><span className="rounded-[5px] bg-[#EAF3FB] px-1.5 py-0.5 text-[8px] font-semibold text-[#477EAE]">{date.display}</span><b className="truncate text-[10px] text-[#414149]">{date.label}</b><span className="ml-auto text-[8px] text-[#A09FA5]">{index + 1}</span></div><span className="mt-1 block truncate text-[9px] text-[#8A8990]">Sourced from {date.file.fileName}</span></button>)}</div></div>
          {module.interactions.includes('copy') && <button className="nodrag flex items-center gap-1.5 rounded-[7px] border border-[#D9E6F1] bg-[#F8FBFE] px-2.5 py-1.5 text-[10px] font-medium text-[#4F789D] transition hover:border-[#BFD6EA] hover:bg-[#F0F7FD]" onClick={() => { void navigator.clipboard.writeText(`${module.compact.primary} → ${module.compact.secondary}\n${module.compact.tertiary}`); emit('aether:toast', 'Journey details copied'); }} type="button"><Clipboard size={12} />Copy journey</button>}
        </div>
      );
    }
    if (module.visual === 'ring-metric') return <BudgetDetail currency={currency} editable={module.interactions.includes('edit-values')} importedAggregate={importedAggregate} onChange={(rows) => patch({ budgetRows: rows })} onExport={() => emit('aether:export-budget', { currency, rows: budgetRows })} planned={total} rows={budgetRows} spent={actual} />;
    if (module.visual === 'progress') return <div className="space-y-3.5"><div className="rounded-[12px] border border-[#E8E0F0] bg-[linear-gradient(145deg,#FDFBFF_0%,#F7F2FB_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.95)]"><div className="flex items-end justify-between"><span><b className="text-[24px] leading-none tracking-[-0.06em] text-[#342E3A]">{packed} / {items.length}</b><small className="ml-1.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#85768F]">complete</small></span><span className="text-[10px] font-semibold text-[#7A58A0]">{items.length ? Math.round(packed / items.length * 100) : 0}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E1EC] shadow-[inset_0_1px_2px_rgba(40,25,50,.08)]"><motion.div animate={{ width: `${items.length ? packed / items.length * 100 : 0}%` }} className="relative h-full rounded-full bg-[linear-gradient(90deg,#9B72CF,#8258B5)]" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}><span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/80 bg-white/60 shadow-[0_1px_3px_rgba(55,34,70,.24)]" /></motion.div></div></div><div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">{items.map((item) => <motion.button className={`nodrag flex w-full items-center gap-2.5 rounded-[9px] border px-2.5 py-2 text-left text-[10px] transition ${item.checked ? 'border-[#E8E6EA] bg-[#F8F7F9] text-[#929097]' : 'border-[#E7E4E9] bg-white text-[#48464D] hover:border-[#D8CEE2] hover:bg-[#FCFAFE]'}`} disabled={!module.interactions.includes('toggle-item')} key={item.id} layout onClick={() => patch({ packingItems: items.map((entry) => entry.id === item.id ? { ...entry, checked: !entry.checked } : entry) })} type="button"><motion.span animate={{ scale: item.checked ? 1 : 0.96 }} className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition ${item.checked ? 'border-[#9B72CF] bg-[#9B72CF] text-white shadow-[0_2px_5px_rgba(155,114,207,.22)]' : 'border-[#B8B3BD] bg-white'}`}>{item.checked && <Check size={12} strokeWidth={2.6} />}</motion.span><span className={item.checked ? 'line-through decoration-[#AAA3B0]' : 'font-medium'}>{item.text}</span></motion.button>)}</div>{module.interactions.includes('add-item') && <div className="relative"><Plus className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9B72CF]" size={13} /><input className="nodrag w-full rounded-[9px] border border-[#E1DCE6] bg-[#FBF9FD] py-2 pl-8 pr-3 text-[10px] outline-none transition placeholder:text-[#AAA4AF] focus:border-[#9B72CF]/45 focus:bg-white focus:ring-2 focus:ring-[#9B72CF]/10" onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && newItem.trim()) { patch({ packingItems: [...items, { id: crypto.randomUUID(), text: newItem.trim(), checked: false, source: 'user' }] }); setNewItem(''); } }} placeholder="Add another item…" value={newItem} /></div>}</div>;
    if (module.visual === 'pin-map') return <div className="mt-3"><InteractiveMap expanded locations={locations} onLocationFocus={(location) => emit('aether:focus-source-file', data.files.find((file) => file.fileName === location.fileName)?.id ?? '')} onOpenDirections={(place) => void window.aether.openExternal(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`)} suggestions={dashboard.aiCache?.map ?? []} /></div>;
    if (module.visual === 'milestone-list') { const dates = data.files.flatMap((file) => file.entities.dates.map((date) => ({ ...date, file }))).sort((left, right) => left.date.localeCompare(right.date)); return <div className="mt-3 space-y-2 border-l-2 border-[#C9DCEF] pl-3">{dates.slice(0, 7).map((date) => <button className="nodrag block text-left text-[10px]" key={`${date.file.id}-${date.label}`} onClick={() => emit('aether:focus-source-file', date.file.id)} type="button"><b className="text-[#3A3A3F]">{date.display}</b><span className="ml-2 text-[#77777D]">{date.label}</span></button>)}</div>; }
    return <div className="mt-3"><p className="text-[10px] leading-4 text-[#626268]">{module.summary}</p><div className="mt-2 space-y-1">{moduleSources.map((file) => <button className="nodrag flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-[10px] text-[#56565C] hover:bg-[#F5F4F2]" key={file.id} onClick={() => emit('aether:focus-source-file', file.id)} type="button"><FileText size={12} />{file.title}</button>)}</div></div>;
  };

  return (
    <motion.article
      animate={{ opacity: 1, x: 0 }}
      className={`relative w-[340px] overflow-visible rounded-[22px] border bg-[linear-gradient(145deg,#FFFFFF_0%,#FCFCFD_68%,#F8F8FA_100%)] p-[17px] shadow-[0_24px_56px_rgba(23,23,28,0.14),0_4px_12px_rgba(23,23,28,0.055),inset_0_1px_0_rgba(255,255,255,1)] ${selected ? 'border-[#4A90D9] ring-2 ring-[#4A90D9]/15' : 'border-[#D7D6DB]'}`}
      initial={{ opacity: 0, x: 80 }}
      transition={{ delay: data.assemblyDelay ?? 1.2, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]"><span className="absolute -right-14 -top-16 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${headerColor}12` }} /><span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" /></div>
      <header className="relative mb-[18px] flex items-start gap-3.5 px-0.5 pt-0.5">
        <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.5),0_6px_14px_rgba(40,40,46,.18)]" style={{ background: `linear-gradient(145deg, ${headerColor}, ${headerColor}D0)` }}><Sparkles size={23} strokeWidth={2.1} /></span>
        <div className="min-w-0 flex-1 pt-0.5">
          {editing ? <input autoFocus className="nodrag w-full rounded-[7px] bg-[#F4F3F1] px-1.5 py-0.5 text-[23px] font-semibold tracking-[-0.05em] outline-none ring-2 ring-[#4A90D9]/30" onBlur={() => { if (title.trim()) emit('aether:rename-cluster', { summaryId: id, name: title.trim() }); setEditing(false); }} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setEditing(false); }} value={title} /> : <h2 className="truncate text-[23px] font-semibold leading-[1.03] tracking-[-0.055em] text-[#27272C]" onDoubleClick={() => setEditing(true)}>{plan.title || data.cluster.name}</h2>}
          <p className="mt-1.5 text-[11px] font-medium tracking-[0.005em] text-[#74737A]">{plan.subtitle || data.cluster.dateRange}</p>
        </div>
        <button aria-label="Summary menu" className="nodrag grid h-8 w-8 place-items-center rounded-full text-[#77777E] transition hover:bg-[#F1F0F2] hover:text-[#424249]" onClick={() => setMenu((current) => !current)} type="button"><MoreHorizontal size={19} /></button>
        {menu && <div className="absolute right-0 top-10 z-30 w-44 rounded-[11px] border border-[#DFDEE2] bg-white p-1.5 shadow-[0_12px_28px_rgba(25,25,30,.15)]"><button className="nodrag block w-full rounded-[7px] px-2.5 py-2 text-left text-[10px] font-medium text-[#4B4B52] transition hover:bg-[#F5F4F3]" onClick={() => { setMenu(false); setEditing(true); }} type="button">Rename</button><button className="nodrag flex w-full items-center gap-1.5 rounded-[7px] px-2.5 py-2 text-left text-[10px] font-medium text-[#4B4B52] transition hover:bg-[#F5F4F3]" onClick={() => emit('aether:export-summary', { cluster: { ...data.cluster, name: plan.title || data.cluster.name }, files: data.files, budgetRows, packingItems: items, locations })} type="button"><Download size={12} />Export summary</button><button className="nodrag flex w-full items-center gap-1.5 rounded-[7px] px-2.5 py-2 text-left text-[10px] font-medium text-[#C43E34] transition hover:bg-[#FFF0EE]" onClick={() => emit('aether:remove-cluster', id)} type="button"><X size={12} />Remove cluster</button></div>}
      </header>
      <div className="relative space-y-2.5">{displayModules.map((module) => <ModuleShell key={module.id} module={module} onHover={(active) => focus(module, active)} onToggle={() => toggle(module)} open={openModule === module.id}>{content(module)}</ModuleShell>)}</div>
      <footer className="relative mt-4 flex justify-center border-t border-[#ECEBF0] pt-3.5"><button className="nodrag flex items-center gap-1.5 rounded-full border border-[#E2E0E4] bg-[linear-gradient(180deg,#FFFFFF,#F6F6F8)] px-3.5 py-1.5 text-[10px] font-medium text-[#66666D] shadow-[inset_0_1px_0_rgba(255,255,255,.98),0_2px_5px_rgba(25,25,30,.045)] transition duration-200 hover:-translate-y-px hover:border-[#D2D0D6] hover:text-[#44444B] hover:shadow-[0_5px_12px_rgba(25,25,30,.09)]" onClick={() => emit('aether:highlight-sources', data.files.map((file) => file.id))} type="button"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#F1EBF7] text-[#815EA8]"><SparklesIcon size={10} /></span>Generated from {data.files.length} files</button></footer>
    </motion.article>
  );
}
