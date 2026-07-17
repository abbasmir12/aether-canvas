import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, ChevronDown, Clock3, MessageCircleQuestion, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type QueryHistoryItem = { id: string; question: string; answerHeadline?: string };

export default function QueryBar({ disabled, history, loading, onClear, onSelectHistory, onSubmit }: {
  disabled?: boolean;
  history: QueryHistoryItem[];
  loading: boolean;
  onClear: () => void;
  onSelectHistory: (id: string) => void;
  onSubmit: (question: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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
        setHistoryOpen(false);
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
            className="mb-2 overflow-hidden rounded-[14px] border border-[#E3E1E5] bg-white/95 shadow-[0_12px_30px_rgba(28,28,34,.11)] backdrop-blur-xl"
            exit={{ opacity: 0, y: 5 }}
            initial={{ opacity: 0, y: 8 }}
          >
            <div className="flex h-9 items-center px-2">
              <button
                aria-label="Toggle recent questions"
                aria-expanded={historyOpen}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[8px] px-1.5 py-1 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-[#85828B] transition hover:bg-[#F5F3F6]"
                onClick={() => setHistoryOpen((open) => !open)}
                type="button"
              >
                <Clock3 size={11} />
                <span>Recent questions</span>
                <span className="rounded-full bg-[#F0ECF4] px-1.5 py-0.5 text-[8px] tracking-normal text-[#806397]">{history.length}</span>
                <ChevronDown className={`ml-auto transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} size={12} />
              </button>
              <button aria-label="Clear query history" className="ml-1 grid h-6 w-6 place-items-center rounded-full text-[#AAA8AE] transition hover:bg-[#F1F0F2] hover:text-[#66646B]" onClick={onClear} type="button"><Trash2 size={12} /></button>
            </div>
            <AnimatePresence initial={false}>
              {historyOpen && (
                <motion.div
                  animate={{ height: 'auto', opacity: 1 }}
                  className="max-h-[210px] overflow-y-auto border-t border-[#EFEDF1] p-1.5"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  {history.slice().reverse().map((item) => (
                    <button
                      className="group block w-full rounded-[9px] px-2.5 py-2 text-left transition hover:bg-[#F6F4F8]"
                      data-aether-query-history={item.id}
                      key={item.id}
                      onClick={() => { onSelectHistory(item.id); setHistoryOpen(false); }}
                      type="button"
                    >
                      <span className="block truncate text-[11px] font-medium text-[#56535C] group-hover:text-[#3F3549]">{item.question}</span>
                      <span className="mt-0.5 block truncate text-[9px] text-[#A09DA5]">{item.answerHeadline ?? 'Aether is preparing this answer…'}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
        <motion.span
          animate={loading || expanded ? { scale: [1, 1.055, 1], boxShadow: ['0 3px 9px rgba(45,39,53,.18)', '0 4px 14px rgba(74,144,217,.3)', '0 3px 9px rgba(45,39,53,.18)'] } : { scale: 1, boxShadow: '0 3px 9px rgba(45,39,53,.18)' }}
          className="relative mr-2.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/70 bg-[linear-gradient(145deg,#27252C_5%,#4C4059_58%,#586F91_115%)] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.32),0_3px_9px_rgba(45,39,53,.18)]"
          transition={{ duration: loading ? 1.15 : 2.6, repeat: loading || expanded ? Infinity : 0, ease: 'easeInOut' }}
        >
          <MessageCircleQuestion size={16} strokeWidth={2.05} />
        </motion.span>
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
            <button aria-label="Collapse query bar" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#A09EA5] transition hover:bg-[#F2F1F3] hover:text-[#66646B]" key="close" onClick={() => { if (!loading) { setHistoryOpen(false); setExpanded(false); setQuestion(''); } }} type="button"><X size={14} /></button>
          ) : (
            <span className="rounded-[6px] border border-[#E5E3E6] bg-[#F7F6F7] px-1.5 py-0.5 text-[9px] font-medium text-[#99979E]" key="shortcut">{navigator.platform.toLowerCase().includes('mac') ? '⌘ J' : 'Ctrl J'}</span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
