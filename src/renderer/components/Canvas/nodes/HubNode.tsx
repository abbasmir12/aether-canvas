import { motion } from 'framer-motion';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Calendar, CheckSquare, DollarSign, MapPin } from 'lucide-react';

import type { RelationshipType } from '../../../../shared/types';

export type HubNodeData = { relationshipType: RelationshipType; delay?: number };
export type HubNodeType = Node<HubNodeData, 'hub'>;

const HUBS = {
  dates: { color: '#4A90D9', shade: '#2B74BD', label: 'DATES', Icon: Calendar },
  cost: { color: '#34A853', shade: '#208643', label: 'COST', Icon: DollarSign },
  place: { color: '#EA4335', shade: '#C93428', label: 'PLACE', Icon: MapPin },
  tasks: { color: '#9B72CF', shade: '#7951AE', label: 'TASKS', Icon: CheckSquare },
} as const;

export default function HubNode({ data }: NodeProps<HubNodeType>) {
  const hub = HUBS[data.relationshipType];
  const Icon = hub.Icon;
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex h-[50px] w-[112px] items-center gap-2 rounded-full border border-white/90 px-2.5 text-white"
      initial={{ opacity: 0, scale: 0.72 }}
      style={{ background: `linear-gradient(135deg, ${hub.color} 0%, ${hub.color} 62%, ${hub.shade} 100%)`, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.28)` }}
      transition={{ delay: data.delay ?? 0.3, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/75 bg-white/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"><Icon size={16} strokeWidth={2.6} /></span>
      <span className="text-[12px] font-semibold tracking-[0.035em]">{hub.label}</span>
      <Handle className="!h-[8px] !w-[8px] !border-0 !bg-transparent !opacity-0" position={Position.Left} type="target" />
      <Handle className="!h-[8px] !w-[8px] !border-0 !bg-transparent !opacity-0" position={Position.Right} type="source" />
    </motion.div>
  );
}
