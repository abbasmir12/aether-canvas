export type CanvasPosition = {
  x: number;
  y: number;
};

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence?: number;
}

export type FileCategory =
  | 'travel'
  | 'finance'
  | 'health'
  | 'work'
  | 'education'
  | 'personal';

export interface AnalysisEntities {
  dates: Array<{ label: string; date: string; display: string }>;
  costs: Array<{ label: string; amount: number; currency: string }>;
  locations: Array<{ name: string; type: string; lat?: number; lng?: number }>;
  people: string[];
  tasks: Array<{ item: string; completed: boolean }>;
}

export type SmartPreviewType =
  | 'flight'
  | 'hotel'
  | 'budget'
  | 'checklist'
  | 'guide'
  | 'document'
  | 'image';

export interface SmartPreview {
  type: SmartPreviewType;
  displayData: Record<string, unknown>;
}

export type FileInsightAccent = 'dates' | 'cost' | 'place' | 'tasks' | 'neutral';

export interface FileIntelligence {
  headline: string;
  status: string;
  keyFacts: Array<{ label: string; value: string; accent: FileInsightAccent }>;
  highlights: string[];
  suggestedActions: string[];
}

export interface FileAnalysis {
  title: string;
  category: FileCategory;
  entities: AnalysisEntities;
  summary: string;
  smartPreview: SmartPreview;
  intelligence?: FileIntelligence;
}

export interface AnalyzedFile extends FileAnalysis {
  id: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  contentHash?: string;
}

export type FileSyncStatus = 'unwatched' | 'synced' | 'pending' | 'syncing' | 'deleted' | 'paused';

export interface FileSyncChange {
  kind: 'number' | 'text' | 'items';
  label: string;
  before?: string;
  after?: string;
  delta?: number;
  added?: number;
  removed?: number;
}

export interface FileChangedEvent {
  fileId: string;
  filePath: string;
  contentHash: string;
  timestamp: number;
}

export interface FileDeletedEvent {
  fileId: string;
  filePath: string;
  timestamp: number;
}

export interface DiscoveredRelationship {
  sourceFileId: string;
  targetFileId: string;
  type: RelationshipType;
  label: string;
  strength: number;
}

export interface SuggestedCluster {
  name: string;
  dateRange: string;
  icon: string;
  category: string;
}

export interface RelationshipDiscovery {
  relationships: DiscoveredRelationship[];
  suggestedCluster: SuggestedCluster | null;
  shouldCluster: boolean;
  dashboard: DashboardPlan | null;
}

export type DashboardModuleKind = 'overview' | 'timeline' | 'budget' | 'checklist' | 'map' | 'tasks' | 'topics' | 'resources' | 'results';
export type DashboardModuleIcon = 'sparkles' | 'plane' | 'wallet' | 'check-square' | 'map' | 'list-checks' | 'book-open' | 'file-text';
export type DashboardModuleAccent = 'dates' | 'cost' | 'place' | 'tasks' | 'neutral';
export type DashboardModuleVisual = 'source-list' | 'route-rail' | 'ring-metric' | 'progress' | 'pin-map' | 'milestone-list' | 'key-points' | 'stat-grid' | 'priority-stack' | 'calendar-strip' | 'activity-stream' | 'comparison-bars';
export type DashboardModuleInteraction = 'expand' | 'focus-source' | 'copy' | 'edit-values' | 'add-item' | 'toggle-item' | 'export' | 'open-map' | 'ai-insights';
export type DashboardCompositionLayout = 'stack' | 'split' | 'hero-stack' | 'grid';
export type DashboardPrimitiveType = 'metric' | 'route' | 'ring' | 'progress' | 'map' | 'timeline' | 'ranked-list' | 'comparison' | 'source-evidence' | 'status' | 'calendar';

export interface DashboardPrimitive {
  id: string;
  type: DashboardPrimitiveType;
  label: string;
  primary: string;
  secondary: string;
  tertiary: string;
  values: string[];
}

export interface DashboardComposition {
  layout: DashboardCompositionLayout;
  primitives: DashboardPrimitive[];
}

export interface DashboardModuleCompact {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface DashboardModule {
  id: string;
  kind: DashboardModuleKind;
  title: string;
  summary: string;
  icon: DashboardModuleIcon;
  accent: DashboardModuleAccent;
  visual: DashboardModuleVisual;
  interactions: DashboardModuleInteraction[];
  compact: DashboardModuleCompact;
  composition?: DashboardComposition;
  sourceFileIds: string[];
}

export interface DashboardPlan {
  title: string;
  subtitle: string;
  category: string;
  headerIcon: DashboardModuleIcon;
  headerAccent: DashboardModuleAccent;
  modules: DashboardModule[];
}

export interface VisualQueryBreakdownItem {
  label: string;
  value: string;
}

export interface VisualQueryAnswer {
  headline: string;
  detail: string;
  value: string | null;
  valueLabel: string | null;
  breakdown: VisualQueryBreakdownItem[];
}

export interface VisualQuerySource {
  type: 'section' | 'file';
  sectionId: string | null;
  sectionLabel: string | null;
  fileId: string | null;
  fileName: string | null;
  relevance: string;
  color: string;
}

export interface VisualQueryResult {
  answer: VisualQueryAnswer;
  sources: VisualQuerySource[];
  confidence: number;
  followUpSuggestions: string[];
}

export interface AetherFile {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  modifiedAt: string;
  parsedContent: string | null;
  entities: ExtractedEntity[];
  embedding: number[] | null;
  canvasPosition: CanvasPosition;
}

export type SummarySectionType = 'journey' | 'budget' | 'packing' | 'map';

export interface SummarySection {
  type: SummarySectionType;
  data: unknown;
}

export interface SummaryCard {
  title: string;
  dateRange: string;
  sections: SummarySection[];
}

export type DashboardInsightKind = 'journey' | 'budget' | 'packing' | 'map';

export interface DashboardBudgetRow {
  id: string;
  category: string;
  estimate: number;
  actual?: number;
}

export interface DashboardPackingItem {
  id: string;
  text: string;
  checked: boolean;
  source: 'file' | 'user' | 'ai';
  reason?: string;
}

export interface DashboardAiInsight {
  title: string;
  body: string;
  category: string;
  lat: number | null;
  lng: number | null;
}

export interface DashboardState {
  expandedSection?: string;
  expandedSections?: string[];
  budgetRows?: DashboardBudgetRow[];
  packingItems?: DashboardPackingItem[];
  aiCache?: Partial<Record<DashboardInsightKind, DashboardAiInsight[]>>;
  aiCacheInputs?: Partial<Record<DashboardInsightKind, string>>;
  aiLoading?: DashboardInsightKind;
  dismissedAiItems?: string[];
}

export interface FileCluster {
  id: string;
  name: string;
  files: AetherFile[];
  clusterType: string;
  summaryCard: SummaryCard | null;
}

export type RelationshipType = 'dates' | 'cost' | 'place' | 'tasks';

export interface SemanticRibbon {
  id: string;
  sourceFileId: string;
  targetId: string;
  relationshipType: RelationshipType;
  color: string;
  label: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  files: AetherFile[];
  clusters: FileCluster[];
  ribbons: SemanticRibbon[];
  viewport: CanvasViewport;
}

export interface LocalFileMetadata {
  name: string;
  path: string;
  type: string;
  size: number;
  modifiedAt: string;
}

export interface OpenFileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface PinnedFolder {
  path: string;
  addedAt: string;
}

export interface PinnedFolderFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  type: string;
}

export interface PinnedFolderContents extends PinnedFolder {
  files: PinnedFolderFile[];
}

export interface WorkspaceListItem {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
}

export interface WorkspaceIndex {
  workspaces: WorkspaceListItem[];
  activeWorkspaceId: string | null;
}

export interface WorkspaceData extends WorkspaceListItem {
  nodes: unknown[];
  edges: unknown[];
  analyzedFiles: AnalyzedFile[];
  relationships: DiscoveredRelationship[];
  viewport: CanvasViewport;
}

export interface AetherBridge {
  readFile: (filePath: string) => Promise<string>;
  getFileMetadata: (filePath: string) => Promise<LocalFileMetadata>;
  getThumbnail: (filePath: string) => Promise<string | null>;
  openFileDialog: () => Promise<OpenFileDialogResult>;
  getDroppedFilePath: (file: File) => Promise<string>;
  analyzeFile: (filePath: string, fileId: string) => Promise<AnalyzedFile>;
  findRelationships: (fileIds: string[]) => Promise<RelationshipDiscovery>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  openOriginalFile: (filePath: string) => Promise<void>;
  revealFile: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  saveTextFile: (defaultName: string, contents: string) => Promise<boolean>;
  getDashboardInsights: (kind: DashboardInsightKind, context: string) => Promise<DashboardAiInsight[]>;
  askWorkspace: (question: string, fileIds: string[], dashboard: DashboardPlan | null) => Promise<VisualQueryResult>;
  hydrateAnalyzedFiles: (files: AnalyzedFile[]) => Promise<void>;
  fileWatcher: {
    watch: (filePath: string, fileId: string, contentHash?: string) => Promise<string | null>;
    unwatch: (filePath: string, fileId?: string) => Promise<void>;
    onFileChanged: (callback: (event: FileChangedEvent) => void) => () => void;
    onFileDeleted: (callback: (event: FileDeletedEvent) => void) => () => void;
  };
  fs: {
    addPinnedFolder: () => Promise<PinnedFolder | null>;
    removePinnedFolder: (folderPath: string) => Promise<void>;
    getPinnedFolders: () => Promise<PinnedFolderContents[]>;
    readPinnedFolder: (folderPath: string) => Promise<PinnedFolderContents>;
  };
  workspace: {
    list: () => Promise<WorkspaceIndex>;
    create: (name?: string) => Promise<WorkspaceData>;
    load: (id: string) => Promise<WorkspaceData>;
    save: (workspace: WorkspaceData) => Promise<void>;
    delete: (id: string) => Promise<void>;
    rename: (id: string, name: string) => Promise<void>;
    setIcon: (id: string, icon: string, color: string) => Promise<void>;
  };
}
