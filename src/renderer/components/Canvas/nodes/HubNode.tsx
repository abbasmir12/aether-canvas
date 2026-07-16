import { motion } from 'framer-motion';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Calendar, CheckSquare, DollarSign, MapPin } from 'lucide-react';

import type { RelationshipType } from '../../../../shared/types';

export type HubNodeData = { relationshipType: RelationshipType; delay?: number };
export type HubNodeType = Node<HubNodeData, 'hub'>;

const HUBS = {
  dates: { color: '#4A90D9', label: 'DATES', Icon: Calendar },
  cost: { color: '#34A853', label: 'COST', Icon: DollarSign },
  place: { color: '#EA4335', label: 'PLACE', Icon: MapPin },
  tasks: { color: '#9B72CF', label: 'TASKS', Icon: CheckSquare },
} as const;

export default function HubNode({ data }: NodeProps<HubNodeType>) {
  const hub = HUBS[data.relationshipType];
  const Icon = hub.Icon;
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex h-[44px] w-[106px] items-center gap-2 rounded-full border border-white/80 px-3 text-white"
      initial={{ opacity: 0, scale: 0.72 }}
      style={{ backgroundColor: hub.color, boxShadow: `0 5px 16px ${hub.color}66` }}
      transition={{ delay: data.delay ?? 0.3, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/18 ring-1 ring-white/35"><Icon size={16} strokeWidth={2.5} /></span>
      <span className="text-[12px] font-semibold tracking-[0.035em]">{hub.label}</span>
      <Handle className="!h-[6px] !w-[6px] !border !border-white/70 !bg-white/35 transition-transform hover:!scale-125" position={Position.Left} type="target" />
      <Handle className="!h-[6px] !w-[6px] !border !border-white/70 !bg-white/35 transition-transform hover:!scale-125" position={Position.Right} type="source" />
    </motion.div>
  );
}
