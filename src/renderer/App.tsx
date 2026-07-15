import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import AetherCanvas from './components/Canvas/AetherCanvas';
import Sidebar from './components/Sidebar/Sidebar';

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-aether-canvas text-aether-ink">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />
      <section className="relative min-w-0 flex-1 bg-aether-canvas">
        <ReactFlowProvider>
          <AetherCanvas />
        </ReactFlowProvider>
      </section>
    </main>
  );
}
