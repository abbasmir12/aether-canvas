import { ChevronLeft, ChevronRight, Minus, Search, Square, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

import AetherLogo from '../Brand/AetherLogo';

const windowButton = '[-webkit-app-region:no-drag] grid h-11 w-11 place-items-center text-[#58585D] transition-colors hover:bg-[#F0EFED] hover:text-[#252529]';

export default function TopBar({ navigationWidth = 240 }: { navigationWidth?: number }) {
  const [query, setQuery] = useState('');
  const moveCanvas = (deltaX: number) => window.dispatchEvent(new CustomEvent('aether:canvas-pan-horizontal', { detail: deltaX }));
  return (
    <header className="relative z-30 flex h-12 shrink-0 select-none border-b border-[#F0EFED] bg-[#FAFAF9] text-[#242426] [-webkit-app-region:drag]">
      <motion.div
        animate={{ width: Math.max(180, navigationWidth) }}
        className="flex shrink-0 items-center gap-3 border-r border-[#F0EFED] px-5"
        initial={false}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        <AetherLogo alt="" size={32} />
        <span className="text-[18px] font-bold tracking-[-0.035em]">Aether</span>
      </motion.div>

      <div className="ml-4 flex w-[82px] shrink-0 items-center justify-center gap-1 [-webkit-app-region:no-drag]">
        <button aria-label="Move canvas left" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#8D8D92] transition-all hover:bg-[#F0EFED] hover:text-[#333337] active:scale-95" onClick={() => moveCanvas(-300)} title="Move canvas left" type="button"><ChevronLeft size={17} /></button>
        <button aria-label="Move canvas right" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#8D8D92] transition-all hover:bg-[#F0EFED] hover:text-[#333337] active:scale-95" onClick={() => moveCanvas(300)} title="Move canvas right" type="button"><ChevronRight size={17} /></button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-5 py-2">
        <label className="flex h-8 w-full max-w-[480px] items-center gap-2 rounded-[8px] border border-[#E4E2DF] bg-[#F0EFED] px-2.5 text-[#77777D] [-webkit-app-region:no-drag]">
          <Search size={16} strokeWidth={2} />
          <input aria-label="Search files, spaces, and content" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#333337] outline-none placeholder:text-[#85858A]" onChange={(event) => { setQuery(event.target.value); window.dispatchEvent(new CustomEvent('aether:search', { detail: event.target.value })); }} placeholder="Search files, spaces, and content" value={query} />
          <kbd className="rounded-[5px] border border-[#DEDCDA] bg-[#FAFAF9] px-1.5 py-0.5 text-[10px] font-medium text-[#77777D]">⌘ K</kbd>
        </label>
      </div>

      <div className="flex shrink-0 items-center pr-3 [-webkit-app-region:no-drag]">
        <div className="flex gap-2 self-stretch">
          <button aria-label="Minimize window" className={windowButton} onClick={() => void window.aether.minimizeWindow()} type="button"><Minus size={15} /></button>
          <button aria-label="Maximize window" className={windowButton} onClick={() => void window.aether.maximizeWindow()} type="button"><Square size={13} /></button>
          <button aria-label="Close window" className={`${windowButton} hover:!bg-[#E81123] hover:!text-white`} onClick={() => void window.aether.closeWindow()} type="button"><X size={16} /></button>
        </div>
      </div>
    </header>
  );
}
