import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, FileText, Layers3, Sparkles, X } from 'lucide-react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

import type { VisualQueryResult } from '../../../../shared/types';

export type VisualAnswerNodeData = {
  question: string;
  result: VisualQueryResult | null;
  loading: boolean;
  sequence: number;
};
export type VisualAnswerNodeType = Node<VisualAnswerNodeData, 'visualAnswer'>;

const event = (name: string, detail: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));

function Skeleton() {
  return <div className="space-y-3 p-4"><div className="h-2.5 w-20 animate-pulse rounded bg-[#E8E6EA]" /><div className="h-7 w-36 animate-pulse rounded-[7px] bg-[#E2E0E5]" /><div className="space-y-1.5"><div className="h-2.5 w-full animate-pulse rounded bg-[#ECEAED]" /><div className="h-2.5 w-4/5 animate-pulse rounded bg-[#ECEAED]" /></div><div className="space-y-2 rounded-[10px] bg-[#F2F0F3] p-3"><div className="h-2.5 w-full animate-pulse rounded bg-white" /><div className="h-2.5 w-5/6 animate-pulse rounded bg-white" /><div className="h-2.5 w-3/4 animate-pulse rounded bg-white" /></div></div>;
}

export default function VisualAnswerNode({ id, data, selected }: NodeProps<VisualAnswerNodeType>) {
  const result = data.result;
  const lowConfidence = Boolean(result && result.confidence < 0.5);
  const colors = result?.sources.filter((source) => source.type === 'section').map((source) => source.color) ?? [];
  const uniqueColors = [...new Set(colors)];
  const borderGradient = lowConfidence ? '#F59E0B' : uniqueColors.length > 1 ? `linear-gradient(180deg, ${uniqueColors.join(', ')})` : uniqueColors[0] ?? '#8B7AA8';
  const valueIsMoney = Boolean(result?.answer.value?.match(/[$€£¥]|USD|EUR|GBP|JPY/i));
  const noData = Boolean(result && result.sources.length === 0);

  return (
    <motion.article
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative w-[320px] overflow-hidden rounded-[16px] border bg-white shadow-[0_18px_42px_rgba(28,28,34,.13),0_3px_10px_rgba(28,28,34,.055)] transition-shadow hover:shadow-[0_22px_48px_rgba(28,28,34,.17),0_4px_12px_rgba(28,28,34,.07)] ${selected ? 'border-[#4A90D9] ring-2 ring-[#4A90D9]/15' : 'border-[#DCDADF]'}`}
      data-aether-query-answer
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Handle className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0" id="query-in" position={Position.Left} type="target" />
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: borderGradient }} />
      <header className="flex items-center border-b border-[#EFEDF1] px-4 py-3">
        <span className="mr-2 grid h-6 w-6 place-items-center rounded-[8px] bg-[#F1ECF7] text-[#8762B1]"><Sparkles size={13} /></span>
        <div className="min-w-0 flex-1"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9C99A1]">AI Answer</p><p className="mt-0.5 truncate text-[9px] text-[#B0AEB4]">{data.question}</p></div>
        <button aria-label="Close answer" className="nodrag grid h-7 w-7 place-items-center rounded-full text-[#96939B] transition hover:bg-[#F2F0F3] hover:text-[#55525A]" onClick={() => event('aether:query-close', id)} type="button"><X size={14} /></button>
      </header>
      <AnimatePresence mode="wait">
        {!result ? <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="loading"><Skeleton /></motion.div> : (
          <motion.div animate={{ opacity: data.loading ? 0.62 : 1 }} className="p-4" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={`answer-${data.sequence}-${result.answer.headline}`} transition={{ duration: 0.15 }}>
            {lowConfidence && <div className="mb-3 flex gap-2 rounded-[9px] border border-[#F4D58C] bg-[#FFF9EA] px-2.5 py-2 text-[10px] leading-4 text-[#8B671E]"><AlertTriangle className="mt-0.5 shrink-0" size={13} />This answer may be incomplete—relevant data may be missing from your files.</div>}
            {result.answer.valueLabel && <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#97949C]">{result.answer.valueLabel}</p>}
            {result.answer.value && <motion.p className={`mt-1 text-[28px] font-bold leading-none tracking-[-0.055em] ${lowConfidence ? 'text-[#C1841A]' : valueIsMoney ? 'text-[#249348]' : 'text-[#25252A]'}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>{result.answer.value}</motion.p>}
            <h3 className={`${result.answer.value ? 'mt-3' : ''} text-[17px] font-semibold tracking-[-0.035em] text-[#2D2C32]`}>{result.answer.headline}</h3>
            <p className="mt-1.5 text-[12px] leading-[1.58] text-[#68666E]">{result.answer.detail}</p>
            {result.answer.breakdown.length > 0 && <div className="mt-3 overflow-hidden rounded-[10px] border border-[#ECE9EE] bg-[#FAF9FA] p-2.5">{result.answer.breakdown.map((item, index) => <motion.div animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1.5 text-[10px] ${index ? 'border-t border-[#ECEAED]' : ''}`} initial={{ opacity: 0, x: -5 }} key={`${item.label}-${index}`} transition={{ delay: index * 0.05 }}><span className="min-w-0 flex-1 truncate text-[#8B8990]">{item.label}</span><ArrowRight className="text-[#D0CDD3]" size={11} /><b className="text-right font-semibold text-[#37363C]">{item.value}</b></motion.div>)}</div>}
            {result.sources.length > 0 && <motion.div animate={{ opacity: 1 }} className="mt-3" initial={{ opacity: 0 }} transition={{ delay: 0.2 }}><div className="mb-1.5 flex items-center gap-2"><span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#A09DA5]">Sources</span><span className="h-px flex-1 border-t border-dashed border-[#DDDADF]" /></div><div className="space-y-1">{result.sources.map((source, index) => <button className="nodrag flex w-full items-center gap-2 rounded-[8px] px-1.5 py-1.5 text-left transition hover:bg-[#F6F4F7]" key={`${source.type}-${source.fileId ?? source.sectionId}-${index}`} onClick={() => source.type === 'file' ? event('aether:focus-source-file', source.fileId) : event('aether:query-focus-section', source.sectionId)} type="button"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-white" style={{ backgroundColor: source.color }}>{source.type === 'file' ? <FileText size={11} /> : <Layers3 size={11} />}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10px] font-medium text-[#55535A]">{source.fileName ?? source.sectionLabel}</b><small className="block truncate text-[8px] text-[#9B989F]">{source.relevance}</small></span></button>)}</div></motion.div>}
            {result.followUpSuggestions.length > 0 && <div className="mt-3 border-t border-[#EFEDF1] pt-2.5"><p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#A19EA6]">Ask next</p>{result.followUpSuggestions.map((suggestion) => <button className="nodrag group flex w-full items-start gap-1.5 rounded-[7px] py-1 text-left text-[10px] leading-4 text-[#4A82B8] hover:underline" key={suggestion} onClick={() => event('aether:query-follow-up', { question: suggestion, answerId: id })} type="button"><span className="mt-[2px] text-[#8B6AAF]">›</span>{suggestion}</button>)}</div>}
            {noData && <p className="mt-3 rounded-[9px] bg-[#F7F5F8] px-2.5 py-2 text-[10px] text-[#77747D]">Try adding a source file containing the missing information.</p>}
          </motion.div>
        )}
      </AnimatePresence>
      {data.loading && result && <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px] bg-white/12"><motion.span animate={{ x: ['-120%', '220%'] }} className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/55 to-transparent" transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }} /></div>}
    </motion.article>
  );
}
