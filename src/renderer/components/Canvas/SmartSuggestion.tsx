import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

type SmartSuggestionProps = {
  category: string;
  clusterName: string;
  onConnect: () => void;
  onKeepSeparate: () => void;
};

export default function SmartSuggestion({ category, clusterName, onConnect, onKeepSeparate }: SmartSuggestionProps) {
  return (
    <motion.aside
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-[256px] rounded-[14px] border border-[#E2D6C4] bg-white p-3 shadow-[0_10px_28px_rgba(53,47,38,0.13)]"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FFF0E7] text-[#EA8A25]"><Plus size={17} strokeWidth={2.4} /></span><p className="pt-1 text-[13px] font-medium leading-5 text-[#303034]">Add {category || 'this file'} to <span className="font-semibold">{clusterName}</span>?</p></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><button className="rounded-[8px] bg-[#D8920B] px-2 py-2 text-[11px] font-semibold text-white shadow-[0_2px_5px_rgba(184,118,0,0.22)] transition hover:bg-[#BF7D04]" onClick={onConnect} type="button">Connect</button><button className="rounded-[8px] border border-[#D9C5A6] px-2 py-2 text-[11px] font-medium text-[#4D4640] transition hover:bg-[#FFF9F0]" onClick={onKeepSeparate} type="button">Keep separate</button></div>
    </motion.aside>
  );
}
