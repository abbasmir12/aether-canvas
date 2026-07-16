import { ChevronLeft, ChevronRight, Minus, Search, ShieldCheck, Square, X } from 'lucide-react';

function AetherMark() {
  return (
    <span aria-hidden="true" className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#2D2D2F] shadow-[0_2px_5px_rgba(0,0,0,0.16)]">
      <span className="absolute h-[18px] w-[5px] -translate-x-[4px] -rotate-[28deg] rounded-full bg-white/95" />
      <span className="absolute h-[13px] w-[4px] translate-x-[5px] translate-y-[3px] -rotate-[28deg] rounded-full bg-white/75" />
    </span>
  );
}

const windowButton = '[-webkit-app-region:no-drag] grid h-11 w-11 place-items-center text-[#58585D] transition-colors hover:bg-[#F0EFED] hover:text-[#252529]';

export default function TopBar() {
  return (
    <header className="relative z-30 flex h-11 shrink-0 select-none border-b border-[#F0EFED] bg-[#FAFAF9] text-[#242426] [-webkit-app-region:drag]">
      <div className="flex w-[240px] shrink-0 items-center gap-3 border-r border-[#F0EFED] px-5">
        <AetherMark />
        <span className="text-[18px] font-bold tracking-[-0.035em]">Aether</span>
      </div>

      <div className="flex w-[82px] shrink-0 items-center justify-center gap-1 [-webkit-app-region:no-drag]">
        <button aria-label="Back" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#99999D] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" type="button"><ChevronLeft size={17} /></button>
        <button aria-label="Forward" className="grid h-8 w-8 place-items-center rounded-[8px] text-[#C0C0C4] transition-colors hover:bg-[#F0EFED] hover:text-[#333337]" type="button"><ChevronRight size={17} /></button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-5">
        <label className="flex h-8 w-full max-w-[430px] items-center gap-2 rounded-[8px] border border-[#E4E2DF] bg-[#F0EFED] px-2.5 text-[#77777D] [-webkit-app-region:no-drag]">
          <Search size={16} strokeWidth={2} />
          <input aria-label="Search files, spaces, and content" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#333337] outline-none placeholder:text-[#85858A]" placeholder="Search files, spaces, and content" readOnly />
          <kbd className="rounded-[5px] border border-[#DEDCDA] bg-[#FAFAF9] px-1.5 py-0.5 text-[10px] font-medium text-[#77777D]">⌘ K</kbd>
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-4 pr-2 [-webkit-app-region:no-drag]">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#68686D]"><ShieldCheck className="text-[#34A853]" size={16} strokeWidth={2.1} />Private <span className="text-[#AAAAB0]">·</span> Local Only</span>
        <span aria-label="Current user AO" className="grid h-7 w-7 place-items-center rounded-full bg-[#E8E8EC] text-[11px] font-semibold text-[#66666C]">AO</span>
        <div className="ml-1 flex self-stretch border-l border-[#E6E4E1]">
          <button aria-label="Minimize window" className={windowButton} onClick={() => void window.aether.minimizeWindow()} type="button"><Minus size={15} /></button>
          <button aria-label="Maximize window" className={windowButton} onClick={() => void window.aether.maximizeWindow()} type="button"><Square size={13} /></button>
          <button aria-label="Close window" className={`${windowButton} hover:!bg-[#E81123] hover:!text-white`} onClick={() => void window.aether.closeWindow()} type="button"><X size={16} /></button>
        </div>
      </div>
    </header>
  );
}
