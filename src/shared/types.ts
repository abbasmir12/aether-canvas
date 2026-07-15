export type CanvasPosition = {
  x: number;
  y: number;
};

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence?: number;
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

export interface AetherBridge {
  readFile: (filePath: string) => Promise<string>;
  getFileMetadata: (filePath: string) => Promise<LocalFileMetadata>;
  parseFile: (filePath: string) => Promise<string>;
  getThumbnail: (filePath: string) => Promise<string | null>;
  openFileDialog: () => Promise<OpenFileDialogResult>;
  getDroppedFilePath: (file: File) => Promise<string>;
}
