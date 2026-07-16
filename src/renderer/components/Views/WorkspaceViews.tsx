import { ChevronDown, ChevronRight, Clock, File, FileText, Folder, FolderPlus, Image as ImageIcon, Layers, Plus, Table, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { PinnedFolderContents, PinnedFolderFile, WorkspaceListItem } from '../../../shared/types';

export function SpacesView({ workspaces, onCreate, onSelect }: { workspaces: WorkspaceListItem[]; onCreate: () => void; onSelect: (id: string) => void }) {
  return <div className="h-full overflow-auto bg-[#F8F8FA] p-8"><h1 className="text-[22px] font-semibold text-[#29292D]">Spaces</h1><p className="mt-1 text-[13px] text-[#85858B]">Your saved canvases, locally stored.</p><div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">{workspaces.map((space) => <button className="h-[160px] rounded-[12px] border border-[#E5E3E1] bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.09)]" key={space.id} onClick={() => onSelect(space.id)} type="button"><span className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ backgroundColor: space.iconColor }}><Layers size={19} /></span><p className="mt-4 truncate text-[16px] font-semibold">{space.name}</p><p className="mt-1 text-[12px] text-[#8A8A90]">{space.fileCount} files · Updated {new Date(space.updatedAt).toLocaleDateString()}</p><div className="mt-4 flex gap-1"><i className="h-2 w-2 rounded-full bg-[#4A90D9]" /><i className="h-2 w-2 rounded-full bg-[#34A853]" /><i className="h-2 w-2 rounded-full bg-[#9B72CF]" /></div></button>)}<button className="grid h-[160px] place-items-center rounded-[12px] border border-dashed border-[#CFCBC7] text-[#88888E] transition hover:bg-white" onClick={onCreate} type="button"><span className="flex flex-col items-center gap-2"><Plus size={22} />Create new space</span></button></div></div>;
}

export function RecentView({ workspaces, onSelect }: { workspaces: WorkspaceListItem[]; onSelect: (id: string) => void }) {
  const [files, setFiles] = useState<Array<{ workspace: WorkspaceListItem; name: string; summary: string }>>([]);
  useEffect(() => {
    void Promise.all(workspaces.map(async (workspace) => ({ workspace, data: await window.aether.workspace.load(workspace.id) }))).then((items) => {
      const recent = items.flatMap(({ workspace, data }) => data.analyzedFiles.map((file) => ({ workspace, name: file.fileName, summary: file.summary }))).slice(0, 50);
      setFiles(recent);
    });
  }, [workspaces]);
  return <div className="h-full overflow-auto bg-[#F8F8FA] p-8"><h1 className="text-[22px] font-semibold">Recent</h1><div className="mt-6 max-w-3xl space-y-2">{files.length ? files.map((file, index) => <button className="flex w-full items-center gap-3 rounded-[10px] border border-[#E6E4E1] bg-white p-3 text-left hover:bg-[#FCFBFA]" key={`${file.workspace.id}-${index}`} onClick={() => onSelect(file.workspace.id)} type="button"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#EAF3FC] text-[#4A90D9]"><FileText size={17} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[13px]">{file.name}</b><small className="block truncate text-[12px] text-[#88888E]">{file.summary}</small></span><span className="rounded-full bg-[#F1EFED] px-2 py-1 text-[10px] text-[#66666B]">{file.workspace.name}</span></button>) : <div className="grid place-items-center py-24 text-center text-[#98989D]"><Clock size={28} /><p className="mt-3 text-[14px]">No recent files yet</p></div>}</div></div>;
}

function fileIcon(file: PinnedFolderFile) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return { Icon: FileText, color: '#EA4335' };
  if (['xlsx', 'xls', 'csv'].includes(extension ?? '')) return { Icon: Table, color: '#34A853' };
  if (['png', 'jpg', 'jpeg'].includes(extension ?? '')) return { Icon: ImageIcon, color: '#4A90D9' };
  if (extension === 'docx') return { Icon: File, color: '#77777D' };
  return { Icon: FileText, color: '#4A90D9' };
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function modifiedLabel(value: string) {
  const date = new Date(value);
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function LocalFilesView({ onAddFiles }: { onAddFiles: (filePaths: string[]) => void }) {
  const [folders, setFolders] = useState<PinnedFolderContents[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setFolders(await window.aether.fs.getPinnedFolders()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const addFolder = async () => {
    const folder = await window.aether.fs.addPinnedFolder();
    if (!folder) return;
    setExpanded((current) => ({ ...current, [folder.path]: true }));
    await refresh();
  };
  const removeFolder = async (folder: PinnedFolderContents) => {
    if (!window.confirm(`Unpin “${folder.path}”? Files will remain on your computer.`)) return;
    await window.aether.fs.removePinnedFolder(folder.path);
    await refresh();
  };

  if (!loading && folders.length === 0) {
    return <div className="grid h-full place-items-center bg-[#F8F8FA]"><div className="max-w-[370px] text-center"><span className="relative mx-auto grid h-16 w-16 place-items-center rounded-[18px] border border-[#E5E3E1] bg-white text-[#6D6D73] shadow-[0_4px_14px_rgba(0,0,0,0.07)]"><Folder size={29} /><span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#F8F8FA] bg-[#4A90D9] text-white"><Plus size={14} /></span></span><h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#29292D]">Pin folders to watch</h1><p className="mt-2 text-[13px] leading-6 text-[#88888E]">Add folders from your computer. Their files will appear here, ready to add to any canvas.</p><button className="mt-6 inline-flex items-center gap-2 rounded-[8px] bg-[#29292D] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_3px_9px_rgba(0,0,0,0.14)] transition hover:bg-[#3B3B40]" onClick={() => void addFolder()} type="button"><Plus size={16} />Add folder</button></div></div>;
  }

  return <div className="h-full overflow-auto bg-[#F8F8FA] p-8"><div className="flex items-end justify-between"><div><h1 className="text-[22px] font-semibold tracking-[-0.025em] text-[#29292D]">Local files</h1><p className="mt-1 text-[13px] text-[#85858B]">Pinned folders, ready for your canvas.</p></div><button className="inline-flex items-center gap-2 rounded-[8px] border border-[#DCD9D5] bg-white px-3 py-2 text-[12px] font-medium text-[#515157] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:bg-[#F5F4F2]" onClick={() => void addFolder()} type="button"><FolderPlus size={16} />Add folder</button></div><div className="mt-6 max-w-4xl space-y-3">{folders.map((folder) => { const isExpanded = expanded[folder.path] ?? true; const visibleFiles = isExpanded ? folder.files.slice(0, 8) : []; return <section className="overflow-hidden rounded-[12px] border border-[#E4E2E0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]" key={folder.path}><header className="flex items-center"><button aria-expanded={isExpanded} className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3 text-left hover:bg-[#FCFBFA]" onClick={() => setExpanded((current) => ({ ...current, [folder.path]: !isExpanded }))} type="button">{isExpanded ? <ChevronDown className="text-[#8B8B91]" size={16} /> : <ChevronRight className="text-[#8B8B91]" size={16} />}<span className="grid h-7 w-7 place-items-center rounded-[7px] bg-[#EEF4FB] text-[#4A90D9]"><Folder size={16} /></span><span className="min-w-0"><b className="block truncate text-[13px] font-semibold text-[#36363B]">{folder.path.split('/').filter(Boolean).slice(-2).join('/') || folder.path}</b><small className="block truncate text-[11px] text-[#919197]">{folder.files.length} supported files</small></span></button><button aria-label={`Unpin ${folder.path}`} className="mr-3 grid h-7 w-7 place-items-center rounded-md text-[#9A9A9F] transition hover:bg-[#FFF0EE] hover:text-[#C84A3E]" onClick={() => void removeFolder(folder)} type="button"><X size={16} /></button></header>{isExpanded && <div className="border-t border-[#EFEEEC]">{visibleFiles.length ? visibleFiles.map((file) => { const { Icon, color } = fileIcon(file); return <div className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-[#FAFAF9]" draggable key={file.path} onDoubleClick={() => onAddFiles([file.path])} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-aether-file-path', file.path); }}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${color}18`, color }}><Icon size={15} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[12px] font-medium text-[#444449]">{file.name}</b><small className="block text-[10px] text-[#96969B]">{humanSize(file.size)} · {modifiedLabel(file.modifiedAt)}</small></span><button aria-label={`Add ${file.name} to canvas`} className="grid h-7 w-7 place-items-center rounded-[7px] text-[#77777D] opacity-0 transition hover:bg-[#EAF3FC] hover:text-[#4A90D9] group-hover:opacity-100 focus:opacity-100" onClick={() => onAddFiles([file.path])} type="button"><Plus size={16} /></button></div>; }) : <p className="px-4 py-5 text-[12px] text-[#96969B]">No supported files found in this folder.</p>}{folder.files.length > visibleFiles.length && <p className="border-t border-[#F0EFED] px-4 py-2.5 text-[11px] font-medium text-[#85858B]">{folder.files.length - visibleFiles.length} more files</p>}</div>}</section>; })}</div></div>;
}
