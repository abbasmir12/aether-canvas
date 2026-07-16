# Aether Canvas Architecture

## Phase 2 Architecture Update

GPT-5.6 native file input supersedes the originally proposed local PDF, spreadsheet, and OCR parser layer. `pdf-parse`, `xlsx`, and `tesseract.js` are no longer part of the application.

```text
OS file drop
    │
    ▼
Preload resolves OS-backed File → main process authorizes absolute path
    │
    ├──► Sharp thumbnail (images only, local UI asset)
    │
    ▼
FileReader: MIME detection + Base64 data URL
    │
    ▼
GPT-5.6 Responses API
    │  image → input_image(detail: high)
    │  PDF   → input_file(detail: high; text + page images)
    │  sheet → input_file(native spreadsheet augmentation)
    │  docs  → input_file(native text extraction)
    ▼
JSON Schema output → runtime validation → smart preview node
    │
    ▼ after 2+ analyzed files
Metadata-only GPT-5.6 relationship discovery → semantic React Flow edges
```

Raw files are uploaded once per analysis. Relationship discovery receives only the previously extracted IDs, titles, categories, entities, and summaries.

## System Overview

```text
┌──────────────────────────────── Electron Application ────────────────────────────────┐
│                                                                                      │
│  Renderer (sandboxed React)                    Preload / typed IPC bridge             │
│  ┌────────────────────────────┐                ┌──────────────────────────┐            │
│  │ React Flow canvas          │  invoke/events │ window.aether API        │            │
│  │ custom nodes and ribbons   ├───────────────►│ aether:* channels only   │            │
│  │ Context + useReducer       │◄───────────────┤ validated payloads       │            │
│  └────────────────────────────┘                └─────────────┬────────────┘            │
│                                                             │                         │
│                                                Electron main process                  │
│  ┌──────────────────────────────────────────────────────────▼──────────────────────┐  │
│  │ File access/orchestration                                                      │  │
│  │                                                                                │  │
│  │  file preparation        intelligence                 persistence              │  │
│  │  ┌──────────────┐       ┌────────────────────┐       ┌─────────────────────┐   │  │
│  │  │ Base64/MIME  │──────►│ GPT-5.6 native file│──────►│ better-sqlite3      │   │  │
│  │  │ authorization│       │ analysis + summary │       │ local metadata      │   │  │
│  │  │ thumbnails   │       ├────────────────────┤       │ vectors + positions │   │  │
│  │  └──────────────┘       │ relationship pass  │       └─────────────────────┘   │  │
│  │                         └────────────────────┘                                  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ explicit network boundary
                              OpenAI API (GPT-5.6 + embeddings)
```

## Primary Data Flow

```text
File Drop
   │
   ▼
Main-process validation and local file registration
   │
   ▼
MIME detection + Base64 file preparation
   │  PDF/input_file │ spreadsheet/input_file │ image/input_image │ thumbnail
   ▼
GPT-5.6 structured analysis
   │
   ▼
Validated structured JSON
   │  document kind │ title │ preview │ entities │ relationship candidates
   ├──────────────────────────────► React Flow file node
   │
   ▼
OpenAI embedding generation
   │
   ▼
Clustering: semantic similarity + shared entities + spatial proximity
   │
   ├──────────────────────────────► categorized semantic ribbon edges
   │
   ▼
GPT-5.6 cluster synthesis
   │
   ▼
Validated dashboard JSON
   │
   ├──► information architecture (modules, accents, provenance, interactions)
   └──► bounded visual composition (layout + 1–3 primitives per module)
            │
            ▼
      local Aether primitive renderer ─────────► React Flow Summary Dashboard Card
```

Each expensive stage persists its result so moving a node does not reparse or re-embed a file. Position changes can cheaply rerun only the clustering score and suggestion logic.

## Proposed Component Tree

```text
App
├── AppChrome
│   ├── TitleBar
│   ├── SearchBar
│   └── PrivacyStatus
├── Sidebar
│   ├── PrimaryNavigation
│   ├── SavedSpaces
│   └── SidebarActions
├── CanvasWorkspace
│   ├── FileDropZone
│   ├── AetherFlow
│   │   ├── FileNode
│   │   │   └── SmartFilePreview
│   │   ├── SummaryDashboardNode
│   │   │   ├── DashboardComposition
│   │   │   │   └── 1–3 bounded visual primitives
│   │   │   │       ├── Metric / Ring / Progress / Status
│   │   │   │       ├── Route / Timeline / Calendar
│   │   │   │       ├── Map / Ranked List / Comparison
│   │   │   │       └── Source Evidence
│   │   │   └── Detached interactive detail panel
│   │   ├── SemanticRibbonEdge
│   │   │   └── RelationshipPill
│   │   ├── SmartSuggestion
│   │   ├── CanvasControls
│   │   └── Minimap
│   └── ProcessingStatus
└── ErrorBoundary
```

Cross-cutting renderer modules will include `CanvasProvider` backed by Context + `useReducer`, typed service clients for IPC, parsing/analysis status hooks, and shared domain types.

## IPC Bridge Design

Electron's renderer remains sandboxed with `contextIsolation` enabled and Node integration disabled. The preload script exposes a narrow, typed `window.aether` API. The renderer never receives unrestricted filesystem or Electron primitives.

All channels use the required `aether:` prefix:

| Channel | Direction | Purpose |
| --- | --- | --- |
| `aether:file:import` | renderer → main | Validate and register user-dropped file paths; begin processing |
| `aether:file:list` | renderer → main | Load persisted files for a space |
| `aether:file:remove` | renderer → main | Remove Aether metadata after explicit confirmation; never delete the source file |
| `aether:analysis:run` | renderer → main | Request or retry parsing, structured analysis, and embedding |
| `aether:analysis:progress` | main → renderer | Stream stage/status updates for a registered job |
| `aether:space:load` | renderer → main | Load one space, its nodes, edges, and clusters |
| `aether:space:save-viewport` | renderer → main | Persist viewport state |
| `aether:node:update-position` | renderer → main | Persist a debounced node position update |
| `aether:cluster:recompute` | renderer → main | Re-evaluate cluster membership after meaningful spatial changes |
| `aether:suggestion:resolve` | renderer → main | Record connect or keep-separate intent |

Bridge rules:

- Validate every request and response against shared runtime schemas before crossing the boundary.
- Use opaque IDs rather than passing database handles or service objects.
- Permit file reads only for paths explicitly introduced by a user drop or picker action.
- Return serializable data and normalized error objects.
- Keep OpenAI credentials and all SDK calls in the main process.
- Debounce high-frequency position writes and use transactions for related updates.

## SQLite Schema

SQLite is the durable source of truth. JSON columns store evolving AI payloads during the hackathon while query-critical fields remain normalized.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  viewport_x REAL NOT NULL DEFAULT 0,
  viewport_y REAL NOT NULL DEFAULT 0,
  viewport_zoom REAL NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL,
  modified_at TEXT,
  content_hash TEXT NOT NULL,
  parse_status TEXT NOT NULL,
  extracted_text TEXT,
  thumbnail_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE file_analyses (
  file_id TEXT PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  document_kind TEXT,
  title TEXT,
  preview_json TEXT NOT NULL,
  entities_json TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  analyzed_at TEXT NOT NULL
);

CREATE TABLE embeddings (
  file_id TEXT PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  vector BLOB NOT NULL,
  embedded_at TEXT NOT NULL
);

CREATE TABLE canvas_nodes (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  file_id TEXT REFERENCES files(id) ON DELETE CASCADE,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  width REAL,
  height REAL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (space_id, file_id)
);

CREATE TABLE clusters (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence REAL NOT NULL,
  summary_json TEXT NOT NULL,
  summary_model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE cluster_members (
  cluster_id TEXT NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  membership_score REAL NOT NULL,
  PRIMARY KEY (cluster_id, file_id)
);

CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('dates', 'cost', 'place', 'tasks')),
  label TEXT NOT NULL,
  confidence REAL NOT NULL,
  evidence_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE suggestions (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'connected', 'separate', 'dismissed')),
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX idx_canvas_nodes_space ON canvas_nodes(space_id);
CREATE INDEX idx_clusters_space ON clusters(space_id);
CREATE INDEX idx_relationships_space ON relationships(space_id);
CREATE INDEX idx_suggestions_space_status ON suggestions(space_id, status);
```

## Security and Privacy Boundaries

- Source files are read-only; Aether stores references, derived metadata, and cached thumbnails.
- The API key lives outside renderer state and is never written to the project repository.
- Before runtime API calls, the UI will communicate what content is sent to OpenAI.
- Logs must avoid raw document content and credentials.
- Content hashes support cache reuse and change detection without treating a path as immutable identity.

## Implemented Phase 1 File Structure

```text
.
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── main
    │   ├── main.ts               # BrowserWindow, authorized paths, IPC handlers
    │   ├── preload.ts            # narrow contextBridge API + OS path resolution
    │   └── services
    │       ├── aiService.ts      # GPT-5.6 analysis + relationships
    │       └── fileReader.ts     # MIME/Base64 preparation + thumbnails
    ├── renderer
    │   ├── App.tsx               # sidebar/canvas layout + ReactFlowProvider
    │   ├── main.tsx              # React entry
    │   ├── styles.css            # Tailwind/React Flow entry and design tokens
    │   ├── vite-env.d.ts         # typed window.aether declaration
    │   └── components
    │       ├── Canvas
    │       │   ├── AetherCanvas.tsx
    │       │   ├── FileIntelligenceHero.tsx # type-aware source intelligence visual
    │       │   ├── FileQuickPreview.tsx     # source details and provenance actions
    │       │   ├── PackingReadinessBrief.tsx # checklist-specific readiness briefing
    │       │   └── nodes
    │       │       ├── DashboardComposition.tsx # bounded visual-grammar renderer
    │       │       ├── FileCardNode.tsx
    │       │       ├── SummaryCardNode.tsx
    │       │       └── previews  # type-specific smart preview components
    │       └── Sidebar
    │           └── Sidebar.tsx
    └── shared
        └── types.ts              # product domain and bridge contracts
```

### Actual Phase 2 IPC behavior

The bridge includes `aether:read-file`, `aether:get-file-metadata`, `aether:get-thumbnail`, `aether:open-file-dialog`, `aether:get-dropped-file-path`, `aether:analyze-file`, and `aether:find-relationships`. Local `aether:parse-file` was removed when native GPT-5.6 file input replaced local parsing.

`aether:get-dropped-file-path` is not a general path resolver. The preload obtains an OS-backed path from Electron `webUtils`, and the main handler authorizes it only after absolute-path normalization and a successful file stat. All subsequent file operations check the session authorization set. The native picker authorizes its returned paths through the same function.

`aether:analyze-file` accepts only a session-authorized path, prepares Base64 in the main process, and keeps the API key out of the renderer. `aether:find-relationships` accepts file IDs and resolves them against the main process's analyzed-file cache, preventing the renderer from injecting arbitrary metadata into the relationship prompt.
