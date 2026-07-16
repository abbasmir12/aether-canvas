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
  locations: Array<{ name: string; type: string }>;
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

export interface FileAnalysis {
  title: string;
  category: FileCategory;
  entities: AnalysisEntities;
  summary: string;
  smartPreview: SmartPreview;
}

export interface AnalyzedFile extends FileAnalysis {
  id: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
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
