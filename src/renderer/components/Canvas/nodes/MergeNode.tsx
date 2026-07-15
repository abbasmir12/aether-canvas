import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export type MergeNodeType = Node<Record<string, never>, 'merge'>;

export default function MergeNode(_: NodeProps<MergeNodeType>) {
  return <div className="h-px w-px opacity-0"><Handle className="!h-px !w-px !border-0 !opacity-0" position={Position.Left} type="target" /><Handle className="!h-px !w-px !border-0 !opacity-0" position={Position.Right} type="source" /></div>;
}
