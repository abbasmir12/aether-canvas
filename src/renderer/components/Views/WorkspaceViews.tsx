import { ChevronDown, ChevronRight, Clock, File, FileText, Folder, FolderPlus, Grid2X2, Image as ImageIcon, Info, Layers, LayoutList, Plus, Rows3, Table, X } from 'lucide-react';
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

type LocalFilesLayout = 'list' | 'grid' | 'compact';

function folderName(folderPath: string) {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) || folderPath;
}

function PinnedFileItem({ file, layout, onAdd }: { file: PinnedFolderFile; layout: LocalFilesLayout; onAdd: (filePath: string) => void }) {
  const { Icon, color } = fileIcon(file);
  const dragProps = { draggable: true, onDoubleClick: () => onAdd(file.path), onDragStart: (event: React.DragEvent<HTMLDivElement>) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-aether-file-path', file.path); } };

  if (layout === 'grid') return <div {...dragProps} className="group relative min-w-0 rounded-[10px] border border-[#ECEAE7] bg-[#FCFCFB] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#D9D7D4] hover:bg-white hover:shadow-[0_5px_14px_rgba(0,0,0,0.07)]"><span className="grid h-9 w-9 place-items-center rounded-[9px]" style={{ backgroundColor: `${color}18`, color }}><Icon size={19} /></span><b className="mt-4 block truncate text-[12px] font-medium text-[#444449]">{file.name}</b><small className="mt-1 block text-[10px] text-[#96969B]">{humanSize(file.size)} · {modifiedLabel(file.modifiedAt)}</small><button aria-label={`Add ${file.name} to canvas`} className="absolute bottom-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-[7px] text-[#77777D] opacity-0 transition hover:bg-[#EAF3FC] hover:text-[#4A90D9] group-hover:opacity-100 focus:opacity-100" onClick={() => onAdd(file.path)} type="button"><Plus size={16} /></button></div>;

  return <div {...dragProps} className={`group flex items-center gap-3 px-4 transition hover:bg-[#FAFAF9] ${layout === 'compact' ? 'py-1.5' : 'py-2.5'}`}><span className={`grid shrink-0 place-items-center rounded-full ${layout === 'compact' ? 'h-6 w-6' : 'h-7 w-7'}`} style={{ backgroundColor: `${color}18`, color }}><Icon size={layout === 'compact' ? 13 : 15} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[12px] font-medium text-[#444449]">{file.name}</b>{layout === 'list' && <small className="block text-[10px] text-[#96969B]">{humanSize(file.size)} · {modifiedLabel(file.modifiedAt)}</small>}</span>{layout === 'compact' && <small className="text-[10px] text-[#96969B]">{modifiedLabel(file.modifiedAt)}</small>}<button aria-label={`Add ${file.name} to canvas`} className="grid h-7 w-7 place-items-center rounded-[7px] text-[#77777D] opacity-0 transition hover:bg-[#EAF3FC] hover:text-[#4A90D9] group-hover:opacity-100 focus:opacity-100" onClick={() => onAdd(file.path)} type="button"><Plus size={16} /></button></div>;
}

function PinnedFolderSection({ folder, expanded, layout, onAdd, onRemove, onToggle }: { folder: PinnedFolderContents; expanded: boolean; layout: LocalFilesLayout; onAdd: (filePaths: string[]) => void; onRemove: (folder: PinnedFolderContents) => void; onToggle: () => void }) {
  const [showInfo, setShowInfo] = useState(false);
  const visibleFiles = expanded ? folder.files.slice(0, 8) : [];
  const fileLayout = layout === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 p-3' : '';

  return <section className="relative overflow-visible rounded-[12px] border border-[#E4E2E0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]"><header className="flex items-center"><button aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-l-[12px] px-4 py-3 text-left hover:bg-[#FCFBFA]" onClick={onToggle} type="button">{expanded ? <ChevronDown className="text-[#8B8B91]" size={16} /> : <ChevronRight className="text-[#8B8B91]" size={16} />}<span className="grid h-7 w-7 place-items-center rounded-[7px] bg-[#EEF4FB] text-[#4A90D9]"><Folder size={16} /></span><span className="min-w-0"><b className="block truncate text-[13px] font-semibold text-[#36363B]">{folderName(folder.path)}</b><small className="block truncate text-[11px] text-[#919197]">{folder.files.length} supported files</small></span></button><div className="relative flex items-center gap-1 pr-3"><button aria-expanded={showInfo} aria-label={`Folder information for ${folderName(folder.path)}`} className="grid h-7 w-7 place-items-center rounded-md text-[#8B8B91] transition hover:bg-[#EEF4FB] hover:text-[#4A90D9]" onClick={() => setShowInfo((current) => !current)} type="button"><Info size={15} /></button><button aria-label={`Unpin ${folderName(folder.path)}`} className="grid h-7 w-7 place-items-center rounded-md text-[#9A9A9F] transition hover:bg-[#FFF0EE] hover:text-[#C84A3E]" onClick={() => onRemove(folder)} type="button"><X size={16} /></button>{showInfo && <div className="absolute right-3 top-9 z-20 w-[280px] rounded-[10px] border border-[#E1DFDC] bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.13)]"><p className="text-[11px] font-semibold text-[#444449]">Pinned folder</p><p className="mt-1 break-all text-[11px] leading-4 text-[#85858B]">{folder.path}</p><div className="mt-3 border-t border-[#EFEEEC] pt-2 text-[10px] text-[#919197]"><p>{folder.files.length} supported files</p><p className="mt-1">Pinned {modifiedLabel(folder.addedAt)}</p></div></div>}</div></header>{expanded && <div className="overflow-hidden rounded-b-[12px] border-t border-[#EFEEEC]">{visibleFiles.length ? <div className={fileLayout}>{visibleFiles.map((file) => <PinnedFileItem file={file} key={file.path} layout={layout} onAdd={(path) => onAdd([path])} />)}</div> : <p className="px-4 py-5 text-[12px] text-[#96969B]">No supported files found in this folder.</p>}{folder.files.length > visibleFiles.length && <p className="border-t border-[#F0EFED] px-4 py-2.5 text-[11px] font-medium text-[#85858B]">{folder.files.length - visibleFiles.length} more files</p>}</div>}</section>;
}

export function LocalFilesView({ onAddFiles }: { onAddFiles: (filePaths: string[]) => void }) {
  const [folders, setFolders] = useState<PinnedFolderContents[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<LocalFilesLayout>('list');

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

  const viewOptions: Array<{ id: LocalFilesLayout; label: string; Icon: typeof LayoutList }> = [{ id: 'list', label: 'List view', Icon: LayoutList }, { id: 'grid', label: 'Grid view', Icon: Grid2X2 }, { id: 'compact', label: 'Compact view', Icon: Rows3 }];

  return <div className="h-full overflow-auto bg-[#F8F8FA] p-8"><div className="flex items-end justify-between gap-4"><div><h1 className="text-[22px] font-semibold tracking-[-0.025em] text-[#29292D]">Local files</h1><p className="mt-1 text-[13px] text-[#85858B]">Pinned folders, ready for your canvas.</p></div><div className="flex items-center gap-2"><div aria-label="File layout" className="flex h-8 items-center rounded-[8px] border border-[#DEDCD9] bg-white p-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">{viewOptions.map(({ id, label, Icon }) => <button aria-label={label} className={`grid h-6 w-7 place-items-center rounded-[5px] transition ${layout === id ? 'bg-[#EEEDEB] text-[#343438]' : 'text-[#8A8A90] hover:bg-[#F5F4F2] hover:text-[#505055]'}`} key={id} onClick={() => setLayout(id)} title={label} type="button"><Icon size={15} /></button>)}</div><button className="inline-flex items-center gap-2 rounded-[8px] border border-[#DCD9D5] bg-white px-3 py-2 text-[12px] font-medium text-[#515157] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:bg-[#F5F4F2]" onClick={() => void addFolder()} type="button"><FolderPlus size={16} />Add folder</button></div></div><div className="mt-6 max-w-4xl space-y-3">{folders.map((folder) => <PinnedFolderSection expanded={expanded[folder.path] ?? true} folder={folder} key={folder.path} layout={layout} onAdd={onAddFiles} onRemove={(item) => void removeFolder(item)} onToggle={() => setExpanded((current) => ({ ...current, [folder.path]: !(current[folder.path] ?? true) }))} />)}</div></div>;
}
