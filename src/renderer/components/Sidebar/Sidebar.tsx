import { BookOpen, Clock, Folder, HelpCircle, Home, Layers, LayoutGrid, MapPin, Plus, Settings } from 'lucide-react';

export type NavItem = 'canvas' | 'spaces' | 'recent' | 'local-files';

type SidebarProps = {
  activeNavItem: NavItem;
  onNavChange: (item: NavItem) => void;
  onFocusTokyoTrip: () => void;
};

const navigation: Array<{ id: NavItem; label: string; Icon: typeof LayoutGrid }> = [
  { id: 'canvas', label: 'Canvas', Icon: LayoutGrid },
  { id: 'spaces', label: 'Spaces', Icon: Layers },
  { id: 'recent', label: 'Recent', Icon: Clock },
  { id: 'local-files', label: 'Local Files', Icon: Folder },
];

const spaces = [
  { label: 'Tokyo Trip', Icon: MapPin, color: '#EA4335', active: true },
  { label: 'Home', Icon: Home, color: '#34A853', active: false },
  { label: 'Study', Icon: BookOpen, color: '#9B72CF', active: false },
];

export default function Sidebar({ activeNavItem, onNavChange, onFocusTokyoTrip }: SidebarProps) {
  return (
    <aside className="z-20 flex h-full w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[#F0EFED] bg-[#FAFAF9] px-3 py-3">
      <nav aria-label="Primary navigation" className="space-y-1">
        {navigation.map(({ id, label, Icon }) => {
          const active = activeNavItem === id;
          return <button className={`flex h-[38px] w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[14px] transition-colors duration-150 ${active ? 'bg-[#EEEDEB] font-semibold text-[#1A1A1A]' : 'font-medium text-[#66666B] hover:bg-[#F5F4F2] hover:text-[#333337]'}`} key={id} onClick={() => onNavChange(id)} type="button"><Icon size={20} strokeWidth={active ? 2.25 : 1.85} /><span>{label}</span></button>;
        })}
      </nav>

      <div className="mx-1 my-4 h-px bg-[#E3E1DE]" />
      <div className="mb-2 flex items-center justify-between px-3"><span className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#99999E]">Saved Spaces</span><button aria-label="Create new space" className="grid h-6 w-6 place-items-center rounded-full text-[#99999E] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" title="Create new space" type="button"><Plus size={14} /></button></div>
      <div className="space-y-1">
        {spaces.map(({ label, Icon, color, active }) => <button className={`flex h-[38px] w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[14px] font-medium text-[#55555B] transition-colors duration-150 hover:bg-[#F5F4F2] ${active ? 'bg-[#F1EFED]' : ''}`} key={label} onClick={label === 'Tokyo Trip' ? onFocusTokyoTrip : undefined} type="button"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-white" style={{ backgroundColor: color }}><Icon size={15} strokeWidth={2.3} /></span><span>{label}</span></button>)}
      </div>

      <div className="mt-auto flex gap-2 pt-5"><button aria-label="Settings" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#99999E] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" title="Settings" type="button"><Settings size={18} /></button><button aria-label="Help" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#99999E] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" title="Help" type="button"><HelpCircle size={18} /></button></div>
    </aside>
  );
}
