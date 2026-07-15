import { useCallback, useMemo, useState, type DragEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  useNodesState,
  useReactFlow,
  useViewport,
  type NodeTypes,
} from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';

import FileCardNode, { type FileCardNodeType } from './nodes/FileCardNode';

const initialNodes: FileCardNodeType[] = [];

function ControlIcon({ name }: { name: 'minus' | 'plus' | 'fit' }) {
  if (name === 'fit') {
    return (
      <svg aria-hidden="true" className="h-[17px] w-[17px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return <span className="text-[22px] font-light leading-none">{name === 'minus' ? '−' : '+'}</span>;
}

function CanvasControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <Panel className="!bottom-5 !left-4 !m-0" position="bottom-left">
      <div className="flex h-11 items-stretch overflow-hidden rounded-[11px] border border-[#D7D7DC] bg-white/95 shadow-[0_3px_12px_rgba(32,32,35,0.08)] backdrop-blur-md">
        <button
          aria-label="Zoom out"
          className="grid w-11 place-items-center text-[#4C4C51] transition-colors hover:bg-[#F4F4F6]"
          onClick={() => zoomOut({ duration: 180 })}
          type="button"
        >
          <ControlIcon name="minus" />
        </button>
        <div className="grid min-w-[58px] place-items-center border-x border-[#E3E3E6] px-2 text-[11px] font-medium tabular-nums text-[#4E4E53]">
          {Math.round(zoom * 100)}%
        </div>
        <button
          aria-label="Zoom in"
          className="grid w-11 place-items-center text-[#4C4C51] transition-colors hover:bg-[#F4F4F6]"
          onClick={() => zoomIn({ duration: 180 })}
          type="button"
        >
          <ControlIcon name="plus" />
        </button>
        <button
          aria-label="Fit canvas to content"
          className="grid w-11 place-items-center border-l border-[#E3E3E6] text-[#4C4C51] transition-colors hover:bg-[#F4F4F6]"
          onClick={() => fitView({ duration: 300, padding: 0.3 })}
          type="button"
        >
          <ControlIcon name="fit" />
        </button>
      </div>
    </Panel>
  );
}

export default function AetherCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      fileCard: FileCardNode,
    }),
    [],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as globalThis.Node | null)) {
      return;
    }
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      setDropError(null);

      const droppedFiles = Array.from(event.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      const basePosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const results = await Promise.allSettled(
        droppedFiles.map(async (file, index): Promise<FileCardNodeType> => {
          const filePath = await window.aether.getDroppedFilePath(file);
          const metadata = await window.aether.getFileMetadata(filePath);

          return {
            id: crypto.randomUUID(),
            type: 'fileCard',
            position: {
              x: basePosition.x + index * 22,
              y: basePosition.y + index * 58,
            },
            data: {
              fileName: metadata.name,
              mimeType: metadata.type,
              filePath: metadata.path,
            },
          };
        }),
      );

      const acceptedNodes = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      const firstFailure = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      if (acceptedNodes.length > 0) {
        setNodes((currentNodes: FileCardNodeType[]) => [
          ...currentNodes,
          ...acceptedNodes,
        ]);
      }

      if (firstFailure) {
        setDropError(
          firstFailure.reason instanceof Error
            ? firstFailure.reason.message
            : 'Aether could not add one of the dropped files.',
        );
      }
    },
    [screenToFlowPosition, setNodes],
  );

  return (
    <div
      className="relative h-full w-full bg-[#F8F8FA]"
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        colorMode="light"
        defaultViewport={{ x: 70, y: 45, zoom: 1 }}
        deleteKeyCode={['Backspace', 'Delete']}
        fitViewOptions={{ padding: 0.25 }}
        maxZoom={2.2}
        minZoom={0.25}
        nodeTypes={nodeTypes}
        nodes={nodes}
        onNodesChange={onNodesChange}
        panOnDrag
        panOnScroll
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={false}
        zoomOnDoubleClick={false}
      >
        <Background
          bgColor="#F8F8FA"
          color="#D8D6D1"
          gap={18}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <MiniMap
          className="!bottom-5 !right-5 !m-0 !h-[112px] !w-[176px] !rounded-[13px] !border !border-[#D3D3D8] !bg-white/90 !shadow-[0_3px_14px_rgba(33,33,36,0.08)]"
          maskColor="rgba(242, 242, 245, 0.58)"
          nodeBorderRadius={5}
          nodeColor="#8AB99A"
          pannable
          zoomable
        />
        <CanvasControls />

        {nodes.length === 0 && !isDragActive && (
          <Panel className="!m-0" position="top-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-7 flex items-center gap-2 rounded-full border border-[#E1E0DD] bg-white/70 px-4 py-2 text-[12px] font-medium text-[#77777D] shadow-[0_2px_10px_rgba(0,0,0,0.035)] backdrop-blur-md"
              initial={{ opacity: 0, y: -4 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#4A90D9]" />
              Drop local files anywhere on the canvas
            </motion.div>
          </Panel>
        )}
      </ReactFlow>

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[18px] border-2 border-dashed border-[#4A90D9]/55 bg-[#EAF3FC]/50 backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <motion.div
              animate={{ scale: 1, y: 0 }}
              className="rounded-[16px] border border-white/90 bg-white/90 px-7 py-5 text-center shadow-[0_12px_38px_rgba(42,91,137,0.14)]"
              initial={{ scale: 0.97, y: 4 }}
            >
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-[12px] bg-[#4A90D9] text-2xl font-light text-white shadow-[0_4px_12px_rgba(74,144,217,0.28)]">
                +
              </div>
              <p className="text-[14px] font-semibold text-[#2B2B2E]">Place files in this space</p>
              <p className="mt-1 text-[11px] text-[#7D7D83]">Release to add them at this position</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dropError && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 top-5 z-40 -translate-x-1/2 rounded-[11px] border border-[#EA4335]/20 bg-white px-4 py-2.5 text-[12px] font-medium text-[#9A322A] shadow-[0_5px_18px_rgba(0,0,0,0.09)]"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: -4 }}
          >
            {dropError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
