import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import AetherCanvas from './components/Canvas/AetherCanvas';
import Sidebar, { type NavItem } from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import WorkspacePlaceholder from './components/WorkspacePlaceholder';

export default function App() {
  const [activeNavItem, setActiveNavItem] = useState<NavItem>('canvas');
  const [focusRequest, setFocusRequest] = useState(0);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F8FA] text-aether-ink">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeNavItem={activeNavItem} onFocusTokyoTrip={() => { setActiveNavItem('canvas'); setFocusRequest((request) => request + 1); }} onNavChange={setActiveNavItem} />
        <section className="relative min-w-0 flex-1 bg-[#F8F8FA]">
          {activeNavItem === 'canvas' ? <ReactFlowProvider><AetherCanvas focusRequest={focusRequest} /></ReactFlowProvider> : <WorkspacePlaceholder view={activeNavItem} />}
        </section>
      </div>
    </main>
  );
}
