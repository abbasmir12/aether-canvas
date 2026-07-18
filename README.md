<p align="center">
  <img src="public/aether-logo.png" alt="Aether Canvas" width="82" />
</p>

<h1 align="center">Aether Canvas</h1>

<p align="center"><strong>Space is the prompt.</strong></p>

<p align="center">
  A generative desktop where grouping ordinary files creates the mini-app you need.
</p>

<p align="center">
  <strong>OpenAI Build Week 2026 · Apps for Your Life</strong>
</p>

![Aether Canvas turns five travel files into a living Tokyo Trip workspace](docs/media/aether-canvas-hero.png)

<!-- Add the public YouTube demo URL here once supplied to the repository. -->

## Your files already describe what you are trying to do

A flight ticket, hotel confirmation, spreadsheet, packing list, and city guide are not five unrelated documents. Together, they describe a trip.

Traditional file managers can store those files. Aether understands the goal behind them.

Drop files onto an infinite canvas and Aether uses GPT-5.6 to:

1. read their text, tables, images, dates, costs, places, and tasks;
2. show each file as a useful smart preview;
3. organize shared meaning through **DATES**, **COST**, **PLACE**, and **TASKS** hubs;
4. compile the cluster into an interactive mini-workspace; and
5. keep that workspace current when the original files change.

Add another related file later and the workspace adapts—connections are recalculated and the generated dashboard is rebuilt around the new context.

## Three ideas make Aether different

### Space is the prompt

Files placed together express intent without requiring folders, tags, or a carefully written prompt. Aether turns that spatial signal into a coherent workspace.

### Files stay alive

Aether watches the original source files. Change a value in a spreadsheet or edit a note, save it, and the affected card and dashboard update through a guarded GPT-5.6 re-analysis flow.

### Answers show their work

**Ask the Canvas** answers questions across the entire workspace. Each answer becomes a movable canvas card with animated traces back to the exact dashboard sections and source files that supported it. Low-confidence answers deliberately avoid drawing misleading provenance.

## What you can do

| Experience | What it provides |
| --- | --- |
| Native file drop | Securely add PDFs, spreadsheets, documents, notes, and images from the OS |
| Smart file cards | See routes, costs, checklists, places, grounded takeaways, and source actions at a glance |
| Semantic ribbons | Follow dates, costs, places, and tasks from raw artifacts into generated outcomes |
| Adaptive dashboards | Get GPT-planned Journey, Budget, Packing, Map, Timeline, Progress, Key Points, and other relevant modules |
| Interactive mini-apps | Edit expenses, check packing items, inspect timelines, explore maps, export data, and trace sources |
| Live file sync | Reflect external edits with content hashing, write-stability guards, batching, and animated updates |
| Visual workspace Q&A | Ask cross-file questions and see a visible evidence trail for every grounded answer |
| Saved spaces | Persist multiple canvases, recent files, viewport state, analysis, relationships, and user edits locally |
| Pinned folders | Keep selected folders close without turning Aether into another full-disk file browser |
| Runtime controls | Choose GPT-5.6 model/reasoning settings and rich or lightweight connector rendering |

Travel is the demo, not the architecture. The same dashboard grammar can compile study material, project documents, renovation files, medical records, recipes, or personal finances into goal-specific workspaces.

## The demo path

The repository includes five small files in [`agent_assets/sample-files`](agent_assets/sample-files):

- `flight-ticket.txt`
- `hotel-booking.txt`
- `budget.csv`
- `packing-list.txt`
- `city-guide.txt`

Try this:

1. Create an empty space.
2. Drop all five files onto the canvas.
3. Watch GPT-5.6 analyze them and Aether assemble the Tokyo Trip workspace.
4. Open Journey, Budget, Packing, and Places.
5. Edit `budget.csv` in an external editor and save it; Aether should update the living workspace.
6. Press `Ctrl/⌘ J` and ask: **“How much can I spend on food each day?”**
7. Follow the animated answer traces back to their sources.

This is the core product loop shown in the public demo video.

## Run it in under five minutes

### Prerequisites

- Node.js `>=22.12.0` (`.nvmrc` targets Node 22)
- npm `>=10`
- An OpenAI API key
- A native build toolchain if npm cannot use prebuilt binaries

Clone and install:

```bash
git clone https://gitlab.com/abbasmir12/aether-canva.git
cd aether-canva
nvm use
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Then configure:

```env
OPENAI_API_KEY=sk-your-key-here
AI_MODEL=gpt-5.6-luna
AI_REASONING_EFFORT=low
```

Start Aether:

```bash
npm run dev
```

If native installation falls back to compilation on Debian/Kali:

```bash
sudo apt update
sudo apt install build-essential python3
```

The API key can also be entered from **Settings → Intelligence**. A key saved from the UI is protected with Electron `safeStorage`; if OS-backed encryption is unavailable, Aether refuses to persist it as plaintext.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite and Electron with live rebuilding |
| `npm run lint` | Strictly type-check renderer, shared, main, preload, and configuration code |
| `npm run build` | Type-check, build, rebuild native modules, and package the Linux AppImage |
| `npm start` | Run the previously built Electron bundle |

Development and product testing have been performed on Linux/EC2 and Windows 11. The current electron-builder target committed in this repository is Linux AppImage; judges on Windows should use `npm run dev`.

## How GPT-5.6 powers the product

GPT-5.6 is not a chat box added beside the app. It is the workspace compiler.

```text
User-approved file
        │
        ▼
Electron main process ── MIME detection + secure local read
        │
        ▼
GPT-5.6 Responses API ── native file/image understanding
        │
        ▼
Structured analysis ──── entities, preview, summary, source intelligence
        │
        ├── relationship discovery ──► semantic hubs and ribbons
        │
        └── dashboard planning ──────► bounded local UI composition
```

At runtime, GPT-5.6:

- reads supported files directly through Responses `input_file` or `input_image`;
- extracts structured entities and rich preview data through strict schemas;
- discovers cross-file relationships from analyzed metadata;
- plans the dashboard’s information architecture and visual composition;
- re-analyzes source files after meaningful external changes; and
- answers workspace questions with validated file and dashboard provenance.

The model never sends executable UI code to the renderer. It returns a schema-constrained plan assembled from Aether’s local component grammar—routes, rings, progress, maps, timelines, briefs, comparisons, priorities, and other tested primitives. GPT-5.6 decides what the workspace needs; Aether retains control of rendering, interaction, persistence, and safety.

The default is `gpt-5.6-luna` with low reasoning for a responsive file-drop loop. Settings also expose Terra and Sol for stronger quality/cost trade-offs and the supported reasoning levels without requiring a rebuild.

## How Codex accelerated the build

The first Codex prompt established the product idea, design reference, technical constraints, hackathon requirements, documentation system, and the rule that every major milestone must separate **Codex contributions**, **human decisions**, and **verification**.

Codex then accelerated the non-trivial engineering work:

- Electron/Vite/React Flow scaffolding and secure IPC boundaries;
- native file authorization and GPT-5.6 Responses integration;
- schema-constrained analysis and dashboard compilation;
- custom semantic ribbon rendering and drag-performance work;
- local workspace persistence and recovery;
- Chokidar live sync, SHA-256 diffing, batching, cooldowns, and Windows save handling;
- visual query answer nodes and animated provenance edges;
- native Electron smoke captures, regression checks, and Windows-specific debugging.

The human remained the product owner and made the defining decisions. Examples include replacing local parsing libraries with GPT-5.6 native file input, replacing graph spaghetti with semantic mediator hubs, making source files live rather than imported copies, and turning Q&A provenance into a spatial visual interaction.

The evidence is intentionally inspectable:

- [`docs/codex-build-log.md`](docs/codex-build-log.md) records what Codex built, what the human directed, and how each milestone was verified.
- [`docs/decisions.md`](docs/decisions.md) preserves architectural and product choices—including superseded approaches and the reasoning behind changes.
- [`docs/judging-evidence.md`](docs/judging-evidence.md) maps concrete implementation evidence to the hackathon’s four judging criteria.
- [`docs/architecture.md`](docs/architecture.md) documents the Electron trust boundary, GPT data flow, local persistence, and renderer architecture.
- [`docs/product-spec.md`](docs/product-spec.md) captures the problem, user, product thesis, and hackathon scope.

This history makes it possible to see not just the finished code, but where Codex saved time, where human judgment changed direction, and how the implementation was tested.

## Local-first, with an explicit AI boundary

Aether does not move, rename, or modify source files. Workspace layouts, cached analysis, relationships, dashboard state, pinned folders, and preferences are persisted as atomic JSON in Electron’s OS-standard application-data directory.

For clarity: **local-first does not mean offline-only**. Files explicitly selected through drop or a native picker are sent to the OpenAI Responses API for analysis. Relationship discovery uses the resulting metadata. Local path access is authorized at the preload/main-process boundary, Node integration is disabled in the renderer, and the OpenAI credential never enters renderer code.

Live sync watches only files already added to a workspace. Chokidar waits for writes to stabilize; SHA-256 comparison skips no-op saves; batching, per-file cooldowns, and a global request guard prevent accidental API storms.

## Supported file input

Direct canvas analysis supports:

- PDF
- Excel (`.xlsx`, `.xls`)
- CSV and TSV
- Word (`.docx`)
- PowerPoint (`.pptx`)
- plain text and Markdown
- PNG, JPEG, GIF, and WebP

Files are limited to 50 MB for direct analysis. Sharp generates local image thumbnails; GPT-5.6 handles semantic understanding.

## Architecture at a glance

```text
┌──────────────── Electron main process ────────────────┐
│ secure file access · OpenAI client · workspace store │
│ file watcher · settings · dialogs · OS integrations  │
└───────────────────────┬───────────────────────────────┘
                        │ typed, prefixed IPC
┌───────────────────────▼───────────────────────────────┐
│ context-isolated preload bridge                      │
└───────────────────────┬───────────────────────────────┘
                        │ window.aether
┌───────────────────────▼───────────────────────────────┐
│ React renderer                                       │
│ React Flow canvas · local UI grammar · Framer Motion │
│ workspaces · interactive dashboard · visual answers │
└───────────────────────────────────────────────────────┘

External save → Chokidar → stable write → SHA-256 diff
              → GPT-5.6 re-analysis → dashboard refresh

Canvas question → validated workspace context → GPT-5.6 answer
                → provenance validation → spatial answer traces
```

## Technology

Electron, TypeScript, React 19, Vite, React Flow, Tailwind CSS, Framer Motion, OpenAI Responses API, Chokidar, Leaflet, Sharp, and electron-builder.

## Repository map

```text
src/
├── main/                 Electron lifecycle, IPC, AI, files, persistence
├── renderer/
│   ├── components/       Canvas, cards, ribbons, dashboards, views
│   ├── hooks/            Auto-layout and renderer behavior
│   ├── services/         Renderer-side orchestration
│   ├── stores/           Workspace and UI state
│   ├── types/            Renderer contracts
│   └── utils/            Shared presentation helpers
└── shared/               Cross-process TypeScript contracts

agent_assets/
├── aether_design.png     North-star product mockup
└── sample-files/         Reproducible Tokyo Trip demo data

docs/                     Build history, decisions, architecture, evidence
```

## Hackathon submission

- **Category:** Apps for Your Life
- **Repository:** [gitlab.com/abbasmir12/aether-canva](https://gitlab.com/abbasmir12/aether-canva)
- **Built with:** Codex using GPT-5.6
- **Runtime intelligence:** OpenAI GPT-5.6 Responses API

---

<p align="center">
  <strong>Aether Canvas</strong><br />
  Space is the prompt.
</p>
