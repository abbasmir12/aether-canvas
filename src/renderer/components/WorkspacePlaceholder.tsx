import { Clock, FolderOpen, Layers } from 'lucide-react';

import type { NavItem } from './Sidebar/Sidebar';

const content: Record<Exclude<NavItem, 'canvas'>, { title: string; detail: string; Icon: typeof Layers; action?: string }> = {
  spaces: { title: 'Spaces', detail: 'Saved spaces will appear here.', Icon: Layers },
  recent: { title: 'Recent', detail: 'Recent files will appear here.', Icon: Clock },
  'local-files': { title: 'Browse local files', detail: 'Choose files to add them to your canvas.', Icon: FolderOpen, action: 'Open local files' },
};

export default function WorkspacePlaceholder({ view }: { view: Exclude<NavItem, 'canvas'> }) {
  const item = content[view];
  const Icon = item.Icon;
  return <div className="grid h-full place-items-center bg-[#F8F8FA]"><div className="flex max-w-xs flex-col items-center text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-[14px] border border-[#E6E4E1] bg-white text-[#77777D] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"><Icon size={22} /></span><h1 className="text-[16px] font-semibold text-[#333337]">{item.title}</h1><p className="mt-1.5 text-[13px] text-[#88888E]">{item.detail}</p>{item.action && <button className="mt-4 rounded-[8px] bg-[#2D2D2F] px-3 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90" type="button">{item.action}</button>}</div></div>;
}
