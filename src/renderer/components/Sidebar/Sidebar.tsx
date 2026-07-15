import { motion } from 'framer-motion';
import { BookOpen, Clock, Folder, HelpCircle, Home, Layers, LayoutGrid, MapPin, Plus, Settings } from 'lucide-react';

type SidebarProps = { isCollapsed: boolean; onToggle: () => void };

const navigation = [
  { label: 'Canvas', Icon: LayoutGrid },
  { label: 'Spaces', Icon: Layers },
  { label: 'Recent', Icon: Clock },
  { label: 'Local Files', Icon: Folder },
];

const spaces = [
  { label: 'Tokyo Trip', Icon: MapPin, color: '#EA6335' },
  { label: 'Home', Icon: Home, color: '#34A853' },
  { label: 'Study', Icon: BookOpen, color: '#9B72CF' },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside animate={{ width: isCollapsed ? 76 : 240 }} className="relative z-20 flex h-full shrink-0 flex-col border-r border-[#DEDEE2] bg-[rgba(244,243,241,0.96)] px-3 pb-4 pt-4 shadow-[1px_0_0_rgba(255,255,255,0.7)]" initial={false} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-5 flex h-10 items-center px-2"><button aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="group flex min-w-0 items-center gap-3 text-left" onClick={onToggle} type="button"><span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#2D2D2F] shadow-[0_2px_5px_rgba(0,0,0,0.18)]"><span className="absolute h-[18px] w-[5px] -translate-x-[4px] -rotate-[28deg] rounded-full bg-white/95" /><span className="absolute h-[13px] w-[4px] translate-x-[5px] translate-y-[3px] -rotate-[28deg] rounded-full bg-white/75" /></span>{!isCollapsed && <span className="truncate text-[20px] font-semibold tracking-[-0.025em] text-[#242426]">Aether</span>}</button></div>
      <nav aria-label="Primary navigation" className="space-y-1">{navigation.map(({ label, Icon }, index) => <button className={`flex h-[46px] w-full items-center gap-3 rounded-[11px] px-3 text-[14px] transition-colors ${index === 0 ? 'bg-[rgba(49,49,52,0.085)] font-semibold text-[#242426]' : 'font-normal text-[#444449] hover:bg-[rgba(49,49,52,0.05)]'}`} key={label} title={isCollapsed ? label : undefined} type="button"><Icon size={20} strokeWidth={index === 0 ? 2.3 : 1.8} />{!isCollapsed && <span>{label}</span>}</button>)}</nav>
      <div className="mx-1 my-4 h-px bg-[#D7D7DB]" />
      {!isCollapsed && <div className="mb-2 flex items-center justify-between px-3"><span className="text-[11px] font-medium tracking-[0.01em] text-[#77777D]">Saved Spaces</span><button aria-label="Create saved space" className="grid h-6 w-6 place-items-center rounded-md text-[#646469] transition-colors hover:bg-black/5 hover:text-[#242426]" type="button"><Plus size={16} /></button></div>}
      <div className="space-y-1">{spaces.map(({ label, Icon, color }, index) => <button className={`flex h-[46px] w-full items-center gap-3 rounded-[11px] px-3 text-[14px] text-[#38383C] transition-colors ${index === 0 ? 'bg-[rgba(49,49,52,0.07)]' : 'hover:bg-black/[0.035]'}`} key={label} title={isCollapsed ? label : undefined} type="button"><Icon color={color} size={20} strokeWidth={2} />{!isCollapsed && <span>{label}</span>}</button>)}</div>
      <div className="mt-auto border-t border-[#D7D7DB] pt-3"><div className={`flex items-center ${isCollapsed ? 'flex-col gap-1' : 'gap-1'}`}><button aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-[10px] text-[#4D4D52] transition-colors hover:bg-black/5" title="Settings" type="button"><Settings size={20} strokeWidth={1.8} /></button><button aria-label="Help" className="grid h-10 w-10 place-items-center rounded-[10px] text-[#4D4D52] transition-colors hover:bg-black/5" title="Help" type="button"><HelpCircle size={20} strokeWidth={1.8} /></button></div></div>
    </motion.aside>
  );
}
