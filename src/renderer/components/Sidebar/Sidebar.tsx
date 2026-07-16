import { BookOpen, Briefcase, Clock, Code2, Coffee, Folder, Heart, HelpCircle, Home, Layers, LayoutGrid, MapPin, Music, Plus, Settings, Star } from 'lucide-react';
import { useState } from 'react';
import type { WorkspaceListItem } from '../../../shared/types';

export type NavItem = 'canvas' | 'spaces' | 'recent' | 'local-files';

type SidebarProps = {
  activeNavItem: NavItem;
  onNavChange: (item: NavItem) => void;
  onFocusTokyoTrip: () => void;
  workspaces: WorkspaceListItem[];
  activeWorkspaceId: string | null;
  onCreateWorkspace: () => void;
  onSelectWorkspace: (id: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onSettings: () => void;
  onHelp: () => void;
};

const navigation: Array<{ id: NavItem; label: string; Icon: typeof LayoutGrid }> = [
  { id: 'canvas', label: 'Canvas', Icon: LayoutGrid },
  { id: 'spaces', label: 'Spaces', Icon: Layers },
  { id: 'recent', label: 'Recent', Icon: Clock },
  { id: 'local-files', label: 'Local Files', Icon: Folder },
];

const spaceIcons = { 'map-pin': MapPin, home: Home, 'book-open': BookOpen, briefcase: Briefcase, heart: Heart, star: Star, coffee: Coffee, music: Music, camera: MapPin, code: Code2 } as const;

export default function Sidebar({ activeNavItem, onNavChange, onFocusTokyoTrip, workspaces, activeWorkspaceId, onCreateWorkspace, onSelectWorkspace, onRenameWorkspace, onSettings, onHelp }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <aside className="z-20 flex h-full w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[#F0EFED] bg-[#FAFAF9] px-3 py-3">
      <nav aria-label="Primary navigation" className="space-y-1">
        {navigation.map(({ id, label, Icon }) => {
          const active = activeNavItem === id;
          return <button className={`flex h-[38px] w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[14px] transition-colors duration-150 ${active ? 'bg-[#EEEDEB] font-semibold text-[#1A1A1A]' : 'font-medium text-[#66666B] hover:bg-[#F5F4F2] hover:text-[#333337]'}`} key={id} onClick={() => onNavChange(id)} type="button"><Icon size={20} strokeWidth={active ? 2.25 : 1.85} /><span>{label}</span></button>;
        })}
      </nav>

      <div className="mx-1 my-4 h-px bg-[#E3E1DE]" />
      <div className="mb-2 flex items-center justify-between px-3"><span className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#99999E]">Saved Spaces</span><button aria-label="Create new space" className="grid h-6 w-6 place-items-center rounded-full text-[#99999E] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" onClick={onCreateWorkspace} title="Create new space" type="button"><Plus size={14} /></button></div>
      <div className="space-y-1">
        {workspaces.map((workspace) => { const Icon = spaceIcons[workspace.icon as keyof typeof spaceIcons] ?? MapPin; const active = workspace.id === activeWorkspaceId; return <div className={`relative flex h-[38px] items-center gap-2.5 rounded-[8px] px-3 text-[14px] font-medium transition-colors ${active ? 'bg-[#EEEDEB] text-[#252529]' : 'text-[#55555B] hover:bg-[#F5F4F2]'}`} key={workspace.id} style={active ? { borderLeft: `3px solid ${workspace.iconColor}` } : undefined}><button className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => { onSelectWorkspace(workspace.id); if (workspace.name === 'Tokyo Trip') onFocusTokyoTrip(); }} onDoubleClick={() => setEditingId(workspace.id)} type="button"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-white" style={{ backgroundColor: workspace.iconColor }}><Icon size={15} strokeWidth={2.3} /></span>{editingId === workspace.id ? <input autoFocus className="min-w-0 flex-1 bg-transparent outline-none" defaultValue={workspace.name} onBlur={(event) => { onRenameWorkspace(workspace.id, event.target.value); setEditingId(null); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setEditingId(null); }} /> : <span className="truncate">{workspace.name}</span>}</button></div>; })}
      </div>

      <div className="mt-auto flex gap-2 pt-5"><button aria-label="Settings" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#99999E] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" onClick={onSettings} title="Settings" type="button"><Settings size={18} /></button><button aria-label="Help" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#99999E] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" onClick={onHelp} title="Help" type="button"><HelpCircle size={18} /></button></div>
    </aside>
  );
}
