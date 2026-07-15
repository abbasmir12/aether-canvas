import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

type IconProps = {
  children: ReactNode;
  viewBox?: string;
};

function Icon({ children, viewBox = '0 0 24 24' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className="h-[19px] w-[19px] shrink-0"
      fill="none"
      viewBox={viewBox}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {children}
    </svg>
  );
}

const navigation = [
  {
    label: 'Canvas',
    icon: (
      <Icon>
        <rect x="4" y="4" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
        <rect x="15" y="4" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
        <rect x="4" y="15" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
        <rect x="15" y="15" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
      </Icon>
    ),
  },
  {
    label: 'Spaces',
    icon: (
      <Icon>
        <path d="M3.8 7.5h6l1.8 2H20v8.7a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.2Z" />
        <path d="M4 9.5V6.2a1.8 1.8 0 0 1 1.8-1.8h4.4l1.7 2H18a1.8 1.8 0 0 1 1.8 1.8v1.3" />
      </Icon>
    ),
  },
  {
    label: 'Recent',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.4 2" />
      </Icon>
    ),
  },
  {
    label: 'Local Files',
    icon: (
      <Icon>
        <path d="M7 3.8h6l4 4V20H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" />
        <path d="M13 3.8v4h4" />
      </Icon>
    ),
  },
];

const spaces = [
  { label: 'Tokyo Trip', icon: '⛩', color: '#EA6335' },
  { label: 'Home', icon: '⌂', color: '#34A853' },
  { label: 'Study', icon: '◆', color: '#9B72CF' },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 240 }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-[#DEDEE2] bg-[rgba(244,243,241,0.96)] px-3 pb-4 pt-4 shadow-[1px_0_0_rgba(255,255,255,0.7)]"
      initial={false}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5 flex h-10 items-center px-2">
        <button
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="group flex min-w-0 items-center gap-3 text-left"
          onClick={onToggle}
          type="button"
        >
          <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#2D2D2F] shadow-[0_2px_5px_rgba(0,0,0,0.18)]">
            <span className="absolute h-[18px] w-[5px] -translate-x-[4px] -rotate-[28deg] rounded-full bg-white/95" />
            <span className="absolute h-[13px] w-[4px] translate-x-[5px] translate-y-[3px] -rotate-[28deg] rounded-full bg-white/75" />
          </span>
          {!isCollapsed && (
            <span className="truncate text-[20px] font-semibold tracking-[-0.025em] text-[#242426]">
              Aether
            </span>
          )}
        </button>
      </div>

      <nav aria-label="Primary navigation" className="space-y-1">
        {navigation.map((item, index) => (
          <button
            className={`flex h-[46px] w-full items-center gap-3 rounded-[11px] px-3 text-[14px] transition-colors ${
              index === 0
                ? 'bg-[rgba(49,49,52,0.085)] font-semibold text-[#242426]'
                : 'font-normal text-[#444449] hover:bg-[rgba(49,49,52,0.05)]'
            }`}
            key={item.label}
            title={isCollapsed ? item.label : undefined}
            type="button"
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="mx-1 my-4 h-px bg-[#D7D7DB]" />

      {!isCollapsed && (
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[11px] font-medium tracking-[0.01em] text-[#77777D]">
            Saved Spaces
          </span>
          <button
            aria-label="Create saved space"
            className="grid h-6 w-6 place-items-center rounded-md text-[20px] font-light text-[#646469] transition-colors hover:bg-black/5 hover:text-[#242426]"
            type="button"
          >
            +
          </button>
        </div>
      )}

      <div className="space-y-1">
        {spaces.map((space, index) => (
          <button
            className={`flex h-[46px] w-full items-center gap-3 rounded-[11px] px-3 text-[14px] text-[#38383C] transition-colors ${
              index === 0 ? 'bg-[rgba(49,49,52,0.07)]' : 'hover:bg-black/[0.035]'
            }`}
            key={space.label}
            title={isCollapsed ? space.label : undefined}
            type="button"
          >
            <span
              className="grid h-5 w-5 shrink-0 place-items-center text-[18px] font-semibold leading-none"
              style={{ color: space.color }}
            >
              {space.icon}
            </span>
            {!isCollapsed && <span>{space.label}</span>}
          </button>
        ))}
      </div>

      <div className="mt-auto border-t border-[#D7D7DB] pt-3">
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-1' : 'gap-1'}`}>
          <button
            aria-label="Settings"
            className="grid h-10 w-10 place-items-center rounded-[10px] text-[#4D4D52] transition-colors hover:bg-black/5"
            title="Settings"
            type="button"
          >
            <Icon>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.2 13.6a7.8 7.8 0 0 0 0-3.2l2-1.5-2-3.4-2.5 1a8 8 0 0 0-2.7-1.6L13.7 2h-4l-.4 2.9a8 8 0 0 0-2.7 1.6l-2.5-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 3.2l-2 1.5 2 3.4 2.5-1a8 8 0 0 0 2.7 1.6l.4 2.9h4l.4-2.9a8 8 0 0 0 2.7-1.6l2.5 1 2-3.4Z" />
            </Icon>
          </button>
          <button
            aria-label="Help"
            className="grid h-10 w-10 place-items-center rounded-[10px] text-[#4D4D52] transition-colors hover:bg-black/5"
            title="Help"
            type="button"
          >
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M9.7 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.4 1-1.4 2" />
              <path d="M12 17h.01" />
            </Icon>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
