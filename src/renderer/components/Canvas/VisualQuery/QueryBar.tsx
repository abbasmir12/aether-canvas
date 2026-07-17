import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Clock3, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type QueryHistoryItem = { id: string; question: string };

export default function QueryBar({ disabled, history, loading, onClear, onSubmit }: {
  disabled?: boolean;
  history: QueryHistoryItem[];
  loading: boolean;
  onClear: () => void;
  onSubmit: (question: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setExpanded(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === 'Escape' && expanded && !loading) {
        setExpanded(false);
        setQuestion('');
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [expanded, loading]);

  const submit = () => {
    const clean = question.trim();
    if (!clean || loading || disabled) return;
    onSubmit(clean);
    setQuestion('');
  };

  return (
    <motion.div
      animate={{ width: expanded ? 480 : 360 }}
      className="absolute bottom-5 left-1/2 z-50 -translate-x-1/2"
      initial={false}
      transition={{ duration: expanded ? 0.3 : 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence>
        {expanded && history.length > 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 max-h-[150px] overflow-y-auto rounded-[14px] border border-[#E3E1E5] bg-white/95 p-2 shadow-[0_12px_30px_rgba(28,28,34,.11)] backdrop-blur-xl"
            exit={{ opacity: 0, y: 5 }}
            initial={{ opacity: 0, y: 8 }}
          >
            <div className="mb-1.5 flex items-center justify-between px-1.5">
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#99979E]"><Clock3 size={11} />Recent questions</span>
              <button aria-label="Clear query history" className="grid h-6 w-6 place-items-center rounded-full text-[#AAA8AE] transition hover:bg-[#F1F0F2] hover:text-[#66646B]" onClick={onClear} type="button"><Trash2 size={12} /></button>
            </div>
            {history.slice(-3).reverse().map((item) => (
              <button className="block w-full truncate rounded-[8px] px-2 py-1.5 text-left text-[11px] text-[#626168] transition hover:bg-[#F6F4F8] hover:text-[#4A3D58]" key={item.id} onClick={() => setQuestion(item.question)} type="button">{item.question}</button>
            ))}
            {history.length > 3 && <p className="px-2 pt-1 text-[9px] font-medium text-[#9B72CF]">{history.length - 3} previous answers</p>}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{
          borderColor: expanded ? '#4A90D9' : '#E2E1E5',
          boxShadow: expanded ? '0 7px 24px rgba(74,144,217,.18), 0 2px 7px rgba(25,25,30,.06)' : '0 3px 14px rgba(25,25,30,.09)',
          height: expanded ? 56 : 44,
        }}
        className="flex items-center rounded-full border bg-white/96 px-3 backdrop-blur-xl"
        initial={false}
      >
        <motion.span animate={loading || expanded ? { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 1 }} className="mr-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#EEF5FC,#F2ECF8)] text-[#8460B0]" transition={{ duration: loading ? 1.2 : 2.4, repeat: loading || expanded ? Infinity : 0 }}><Sparkles size={15} /></motion.span>
        {expanded ? (
          <input
            aria-label="Ask about this workspace"
            autoFocus
            className="nodrag min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#333238] outline-none placeholder:text-[#AEACB2]"
            data-aether-query-input
            disabled={disabled}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }}
            placeholder={disabled ? 'Add files to ask the canvas' : loading ? 'Aether is tracing the answer…' : 'Ask about your files…'}
            ref={inputRef}
            value={question}
          />
        ) : (
          <button className="flex min-w-0 flex-1 items-center text-left text-[13px] text-[#AAA8AF]" disabled={disabled} onClick={() => { setExpanded(true); requestAnimationFrame(() => inputRef.current?.focus()); }} type="button">Ask about your files…</button>
        )}
        <AnimatePresence mode="wait">
          {expanded && question.trim() && !loading ? (
            <motion.button animate={{ opacity: 1, scale: 1 }} aria-label="Ask Aether" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#4A90D9] text-white shadow-[0_4px_10px_rgba(74,144,217,.3)] transition hover:bg-[#347FC8]" exit={{ opacity: 0, scale: 0.8 }} initial={{ opacity: 0, scale: 0.8 }} key="send" onClick={submit} type="button"><ArrowUp size={16} strokeWidth={2.6} /></motion.button>
          ) : expanded ? (
            <button aria-label="Collapse query bar" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#A09EA5] transition hover:bg-[#F2F1F3] hover:text-[#66646B]" key="close" onClick={() => { if (!loading) { setExpanded(false); setQuestion(''); } }} type="button"><X size={14} /></button>
          ) : (
            <span className="rounded-[6px] border border-[#E5E3E6] bg-[#F7F6F7] px-1.5 py-0.5 text-[9px] font-medium text-[#99979E]" key="shortcut">{navigator.platform.toLowerCase().includes('mac') ? '⌘ J' : 'Ctrl J'}</span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
