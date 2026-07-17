import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  Map,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AetherSettings, AetherSettingsUpdate, AIReasoningEffort, CanvasTone } from '../../../shared/types';
import AetherLogo from '../Brand/AetherLogo';

type SettingsTab = 'appearance' | 'intelligence' | 'behavior' | 'about';

const tabs = [
  { id: 'appearance' as const, label: 'Canvas', Icon: Palette },
  { id: 'intelligence' as const, label: 'Intelligence', Icon: BrainCircuit },
  { id: 'behavior' as const, label: 'Behavior', Icon: Zap },
  { id: 'about' as const, label: 'About', Icon: ShieldCheck },
];

const modelOptions = [
  { id: 'gpt-5.6-luna', label: 'Luna', note: 'Fast, polished everyday intelligence' },
  { id: 'gpt-5.6-terra', label: 'Terra', note: 'Balanced depth for richer synthesis' },
  { id: 'gpt-5.6-sol', label: 'Sol', note: 'Highest-quality complex reasoning' },
];

const reasoningOptions: Array<{ id: AIReasoningEffort; label: string; note: string }> = [
  { id: 'none', label: 'Instant', note: 'Fastest' },
  { id: 'low', label: 'Light', note: 'Default' },
  { id: 'medium', label: 'Medium', note: 'Balanced' },
  { id: 'high', label: 'High', note: 'Deeper' },
  { id: 'xhigh', label: 'X-High', note: 'Intensive' },
  { id: 'max', label: 'Max', note: 'Maximum' },
];

function Toggle({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-4 rounded-[13px] border border-[#E8E5E9] bg-white px-3.5 py-3 shadow-[0_2px_7px_rgba(30,30,34,.035)]">
      <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-[#353239]">{label}</p><p className="mt-0.5 text-[10px] leading-4 text-[#918E96]">{description}</p></div>
      <button aria-checked={checked} aria-label={label} className={`relative h-[25px] w-[43px] shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-[#4A90D9]' : 'bg-[#D8D5DA]'}`} onClick={() => onChange(!checked)} role="switch" type="button"><motion.span animate={{ x: checked ? 20 : 2 }} className="absolute left-0 top-[2px] h-[21px] w-[21px] rounded-full bg-white shadow-[0_2px_5px_rgba(20,20,24,.22)]" initial={false} /></button>
    </div>
  );
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="mb-5"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9B72CF]">{eyebrow}</p><h2 className="mt-1 text-[22px] font-semibold tracking-[-0.045em] text-[#29272D]">{title}</h2><p className="mt-1.5 max-w-[420px] text-[11px] leading-[1.6] text-[#85828B]">{copy}</p></header>;
}

export default function SettingsPanel({ settings, onClose, onUpdate }: { settings: AetherSettings; onClose: () => void; onUpdate: (update: AetherSettingsUpdate) => Promise<void> }) {
  const [tab, setTab] = useState<SettingsTab>('appearance');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testState, setTestState] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  const update = async (patch: AetherSettingsUpdate) => {
    setSaving(true);
    try {
      await onUpdate(patch);
      return true;
    } catch {
      setTestState({ status: 'error', message: 'That preference could not be saved right now.' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    const saved = await update({ apiKey: apiKey.trim() });
    if (!saved) return;
    setApiKey('');
    setTestState({ status: 'success', message: 'Key encrypted and applied' });
  };

  const testConnection = async () => {
    setTestState({ status: 'testing', message: 'Checking model access…' });
    try {
      const result = await window.aether.settings.testAI();
      setTestState({ status: result.ok ? 'success' : 'error', message: `${result.message} · ${result.model}` });
    } catch {
      setTestState({ status: 'error', message: 'Couldn’t test the connection right now.' });
    }
  };

  return (
    <motion.div animate={{ opacity: 1 }} className="absolute inset-0 z-[80] flex justify-end bg-[#252329]/18 backdrop-blur-[5px]" data-aether-settings-panel initial={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section animate={{ x: 0 }} className="flex h-full w-[620px] max-w-[92vw] overflow-hidden border-l border-white/80 bg-[#F8F7F6] shadow-[-20px_0_60px_rgba(28,25,32,.18)]" initial={{ x: 70 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
        <aside className="flex w-[154px] shrink-0 flex-col border-r border-[#E7E4E6] bg-[#F2F0F1]/90 px-3 py-4">
          <div className="mb-5 flex items-center gap-2 px-2"><AetherLogo alt="" size={32} /><div><p className="text-[12px] font-semibold text-[#302D34]">Aether</p><p className="text-[8px] uppercase tracking-[.12em] text-[#9B979F]">Preferences</p></div></div>
          <nav className="space-y-1">{tabs.map(({ id, label, Icon }) => <button className={`flex h-9 w-full items-center gap-2 rounded-[9px] px-2.5 text-left text-[11px] font-medium transition ${tab === id ? 'bg-white text-[#37313D] shadow-[0_2px_7px_rgba(32,28,36,.07)]' : 'text-[#817E86] hover:bg-white/60 hover:text-[#48444C]'}`} key={id} onClick={() => setTab(id)} type="button"><Icon size={15} /><span>{label}</span>{tab === id && <ChevronRight className="ml-auto text-[#9B72CF]" size={12} />}</button>)}</nav>
          <div className="mt-auto rounded-[11px] border border-[#E4DFE8] bg-white/70 p-2.5"><div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#5A5360]"><ShieldCheck className="text-[#34A853]" size={12} />Local-first</div><p className="mt-1 text-[8px] leading-3.5 text-[#96919A]">Workspace data stays in your OS application directory.</p></div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto px-7 py-6">
          <div className="mb-4 flex justify-end"><button aria-label="Close settings" className="grid h-8 w-8 place-items-center rounded-full border border-[#E3E0E4] bg-white text-[#858189] transition hover:rotate-90 hover:text-[#343137]" onClick={onClose} type="button"><X size={15} /></button></div>
          <AnimatePresence mode="wait">
            {tab === 'appearance' && <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} key="appearance">
              <SectionTitle copy="Tune the spatial language without losing the semantic meaning of your workspace." eyebrow="Appearance" title="Canvas presentation" />
              <div className="mb-4 overflow-hidden rounded-[15px] border border-[#E6E2E7] bg-[radial-gradient(circle_at_center,#FFFFFF,#F2EEF3)] p-4 shadow-[inset_0_1px_0_white]">
                <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#4B4750]"><Waves size={13} className="text-[#9B72CF]" />Semantic connections</span><span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold uppercase tracking-[.09em] text-[#837889] shadow-sm">{settings.ribbonMode === 'rich' ? 'Rich material' : 'Simple lines'}</span></div>
                <svg className="h-16 w-full" viewBox="0 0 360 64"><path d="M8 48 C95 2 190 66 352 15" fill="none" opacity={settings.ribbonMode === 'rich' ? .13 : .55} stroke="#4A90D9" strokeWidth={settings.ribbonMode === 'rich' ? 18 : 2.5} /><path d="M8 48 C95 2 190 66 352 15" fill="none" opacity={settings.ribbonMode === 'rich' ? .75 : 0} stroke="white" strokeWidth="2" /><path d="M8 30 C120 64 215 4 352 42" fill="none" opacity={settings.ribbonMode === 'rich' ? .14 : .55} stroke="#9B72CF" strokeWidth={settings.ribbonMode === 'rich' ? 13 : 2.5} /><path d="M8 30 C120 64 215 4 352 42" fill="none" opacity={settings.ribbonMode === 'rich' ? .68 : 0} stroke="white" strokeWidth="1.5" /></svg>
              </div>
              <div className="space-y-2.5">
                <Toggle checked={settings.ribbonMode === 'rich'} description="Liquid, layered semantic streams. Turn off for lightweight colored lines." label="Design-rich ribbons" onChange={(checked) => void update({ ribbonMode: checked ? 'rich' : 'simple' })} />
                <Toggle checked={settings.showMinimap} description="Keep a live overview of files, hubs, dashboards, answers, and viewport." label="Canvas overview map" onChange={(checked) => void update({ showMinimap: checked })} />
                <Toggle checked={settings.minimapConnectors} description="Include semantic paths inside the overview map." label="Connections in overview" onChange={(checked) => void update({ minimapConnectors: checked })} />
              </div>
              <div className="mt-5"><p className="mb-2 text-[10px] font-semibold text-[#55515A]">Canvas tone</p><div className="grid grid-cols-3 gap-2">{(['warm', 'cool', 'paper'] as CanvasTone[]).map((tone) => <button className={`rounded-[11px] border p-2 text-left transition ${settings.canvasTone === tone ? 'border-[#9B72CF] ring-2 ring-[#9B72CF]/10' : 'border-[#E4E1E5] hover:border-[#CFCAD1]'}`} key={tone} onClick={() => void update({ canvasTone: tone })} type="button"><span className={`mb-2 block h-9 rounded-[7px] border ${tone === 'warm' ? 'border-[#E2DCCF] bg-[#F4F1E9]' : tone === 'cool' ? 'border-[#DDE2E9] bg-[#F2F5F8]' : 'border-[#E5E4E1] bg-[#FCFCFB]'}`} /><span className="flex items-center justify-between text-[9px] font-semibold capitalize text-[#625E67]">{tone}{settings.canvasTone === tone && <Check size={11} className="text-[#9B72CF]" />}</span></button>)}</div></div>
              <div className="mt-5 rounded-[13px] border border-[#E7E4E8] bg-white p-3.5"><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#4D4952]"><Gauge size={13} />Default zoom</span><b className="text-[10px] text-[#4A90D9]">{Math.round(settings.defaultZoom * 100)}%</b></div><input aria-label="Default canvas zoom" className="mt-3 w-full accent-[#4A90D9]" max="2" min=".5" onChange={(event) => void update({ defaultZoom: Number(event.target.value) })} step=".1" type="range" value={settings.defaultZoom} /></div>
            </motion.div>}

            {tab === 'intelligence' && <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} key="intelligence">
              <SectionTitle copy="Choose the runtime intelligence used for file understanding, dashboard compilation, and Ask the Canvas." eyebrow="OpenAI" title="Intelligence engine" />
              <div className={`mb-4 flex items-center gap-3 rounded-[13px] border px-3.5 py-3 ${settings.apiKeyConfigured ? 'border-[#CDE8D3] bg-[#F2F9F4]' : 'border-[#F1D8A9] bg-[#FFF8EA]'}`}><span className={`grid h-8 w-8 place-items-center rounded-[9px] ${settings.apiKeyConfigured ? 'bg-[#34A853] text-white' : 'bg-[#F59E0B] text-white'}`}><KeyRound size={15} /></span><div><p className="text-[11px] font-semibold text-[#3D3A40]">{settings.apiKeyConfigured ? 'API key configured' : 'API key needed'}</p><p className="mt-0.5 text-[9px] text-[#817D84]">{settings.apiKeySource === 'environment' ? 'Using OPENAI_API_KEY from .env' : settings.apiKeySource === 'encrypted-local' ? 'Encrypted with the operating system credential service' : 'Add a key to enable GPT file intelligence'}</p></div></div>
              <div className="rounded-[14px] border border-[#E6E3E7] bg-white p-3.5"><label className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#96929A]">Replace API key</label><div className="mt-2 flex gap-2"><div className="flex h-10 min-w-0 flex-1 items-center rounded-[9px] border border-[#DEDBE0] bg-[#FAF9FA] px-3 focus-within:border-[#4A90D9]"><input className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#B4B1B7]" onChange={(event) => setApiKey(event.target.value)} placeholder={settings.apiKeyConfigured ? '••••••••••••••••••••' : 'sk-…'} type={showKey ? 'text' : 'password'} value={apiKey} /><button aria-label={showKey ? 'Hide API key' : 'Show API key'} className="text-[#949099]" onClick={() => setShowKey((show) => !show)} type="button">{showKey ? <EyeOff size={14} /> : <Eye size={14} />}</button></div><button className="rounded-[9px] bg-[#343139] px-3 text-[10px] font-semibold text-white transition hover:bg-[#4B4551] disabled:opacity-40" disabled={!apiKey.trim() || saving} onClick={() => void saveKey()} type="button">Save</button></div>{!settings.secureStorageAvailable && <p className="mt-2 text-[9px] text-[#B46A3D]">OS credential encryption is unavailable, so Aether will not persist a key here.</p>}</div>

              <div className="mt-5"><p className="mb-2 text-[10px] font-semibold text-[#55515A]">Model</p><div className="space-y-2">{modelOptions.map((model) => <button className={`flex w-full items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition ${settings.model === model.id ? 'border-[#9B72CF] bg-[#F8F4FB] shadow-[0_3px_10px_rgba(90,65,110,.07)]' : 'border-[#E5E2E6] bg-white hover:border-[#CDC8D0]'}`} key={model.id} onClick={() => void update({ model: model.id })} type="button"><span className={`grid h-8 w-8 place-items-center rounded-[9px] ${settings.model === model.id ? 'bg-[#9B72CF] text-white' : 'bg-[#F1EFF2] text-[#807B84]'}`}><BrainCircuit size={15} /></span><span className="min-w-0 flex-1"><b className="block text-[11px] font-semibold text-[#3D3941]">GPT-5.6 {model.label}</b><small className="text-[9px] text-[#97939B]">{model.note}</small></span>{settings.model === model.id && <Check size={14} className="text-[#9B72CF]" />}</button>)}</div></div>

              <div className="mt-5"><p className="mb-2 text-[10px] font-semibold text-[#55515A]">Thinking effort</p><div className="grid grid-cols-3 gap-2">{reasoningOptions.map((effort) => <button className={`rounded-[10px] border px-2 py-2.5 text-left transition ${settings.reasoningEffort === effort.id ? 'border-[#4A90D9] bg-[#F1F7FC]' : 'border-[#E5E2E6] bg-white hover:border-[#CAC6CD]'}`} key={effort.id} onClick={() => void update({ reasoningEffort: effort.id })} type="button"><b className="block text-[10px] text-[#47434B]">{effort.label}</b><small className="text-[8px] text-[#9C98A0]">{effort.note}</small></button>)}</div></div>

              <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#DCD8DF] bg-white text-[10px] font-semibold text-[#4F4A53] shadow-[0_2px_7px_rgba(25,25,30,.04)] transition hover:border-[#BEB7C4] hover:shadow-[0_4px_12px_rgba(25,25,30,.08)] disabled:opacity-60" disabled={testState.status === 'testing' || !settings.apiKeyConfigured} onClick={() => void testConnection()} type="button">{testState.status === 'testing' ? <RefreshCw className="animate-spin" size={13} /> : <Zap size={13} className="text-[#4A90D9]" />}Test GPT connection</button>
              {testState.status !== 'idle' && <p className={`mt-2 text-center text-[9px] ${testState.status === 'error' ? 'text-[#C34B42]' : testState.status === 'success' ? 'text-[#2D8A49]' : 'text-[#77737B]'}`}>{testState.message}</p>}
            </motion.div>}

            {tab === 'behavior' && <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} key="behavior">
              <SectionTitle copy="Control how closely Aether follows the real files behind your generated workspace." eyebrow="Workspace" title="Living-file behavior" />
              <Toggle checked={settings.liveFileSync} description="Watch source files and recompile cards when they change outside Aether." label="Live file synchronization" onChange={(checked) => void update({ liveFileSync: checked })} />
              <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-[14px] border border-[#DDE9E0] bg-[#F4FAF5] p-3.5"><RefreshCw size={16} className="text-[#34A853]" /><b className="mt-3 block text-[11px] text-[#3E5544]">Content-aware updates</b><p className="mt-1 text-[9px] leading-4 text-[#728078]">SHA-256 checks avoid unnecessary GPT calls when an editor saves without changing content.</p></div><div className="rounded-[14px] border border-[#E2E3EF] bg-[#F6F6FC] p-3.5"><ShieldCheck size={16} className="text-[#6366F1]" /><b className="mt-3 block text-[11px] text-[#45465D]">Guarded API usage</b><p className="mt-1 text-[9px] leading-4 text-[#76778B]">Cooldown, batching, and rate guards keep reactive analysis predictable.</p></div></div>
              <div className="mt-4 rounded-[14px] border border-[#ECE7DF] bg-[#FBF8F3] p-4"><p className="flex items-center gap-2 text-[10px] font-semibold text-[#645A4D]"><Map size={14} className="text-[#EA4335]" />What stays local</p><ul className="mt-2 space-y-1.5 text-[9px] leading-4 text-[#81776A]"><li>• Workspace positions, cached analysis, and interactions</li><li>• Pinned-folder paths and file-watch state</li><li>• API key encrypted by Electron safeStorage when entered here</li></ul></div>
            </motion.div>}

            {tab === 'about' && <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} key="about">
              <SectionTitle copy="A generative desktop where space becomes the prompt." eyebrow="Aether Canvas" title="Built for your real files" />
              <div className="relative overflow-hidden rounded-[16px] bg-[linear-gradient(145deg,#302C35,#675477)] p-5 text-white shadow-[0_12px_28px_rgba(50,42,58,.2)]"><div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/[.055] blur-2xl" /><AetherLogo alt="" className="relative" size={44} /><h3 className="relative mt-5 text-[20px] font-semibold tracking-[-.04em]">Space is the prompt.</h3><p className="relative mt-2 text-[10px] leading-5 text-white/65">Files become living, traceable mini-apps through GPT-5.6 understanding and Codex-built spatial interaction.</p><div className="relative mt-5 flex gap-2"><span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-semibold">Build Week 2026</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-semibold">v0.1.0</span></div></div>
              <div className="mt-4 rounded-[13px] border border-[#E6E3E7] bg-white p-3.5"><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9B979F]">Settings storage</p><p className="mt-2 break-all text-[9px] leading-4 text-[#6D6971]">{settings.settingsPath}</p></div>
            </motion.div>}
          </AnimatePresence>
          {saving && <div className="fixed bottom-5 right-5 flex items-center gap-1.5 rounded-full bg-[#302D34] px-3 py-1.5 text-[9px] font-medium text-white shadow-lg"><RefreshCw className="animate-spin" size={10} />Saving</div>}
        </div>
      </motion.section>
    </motion.div>
  );
}
