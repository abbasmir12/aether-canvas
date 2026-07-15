# Aether Canvas

> Space is the prompt.

Aether Canvas is a generative desktop where spatially grouping ordinary files creates the mini-app you need. Drop PDFs, images, spreadsheets, and notes onto an infinite local canvas; Aether understands their contents, draws explainable semantic relationships, and turns coherent clusters into useful summary dashboards.

Built for the OpenAI Build Week **Apps for Your Life** track.

## Status

The Phase 1 desktop shell is runnable. It includes a secure Electron main/preload boundary, a React + Tailwind renderer, a polished collapsible sidebar, an infinite React Flow canvas, custom zoom controls, a minimap, and real OS file drop that creates typed FileCard nodes at the drop position.

Development currently runs on a headless AWS EC2 Linux instance over SSH. Linux/Xvfb checks validate the engineering path, while the human's local Windows PC is the primary product UX and release-test environment. Windows File Explorer drag-and-drop, display scaling, native modules, and packaging must be verified on Windows before submission.

## Setup

Prerequisites:

- Node.js `>=22.12.0` (the repository includes `.nvmrc` for Node 22)
- npm `>=10`
- Python 3, GNU Make, and a C/C++ compiler for native Electron dependencies
- An OpenAI API key once runtime intelligence is implemented

On Debian/Kali Linux, install the native toolchain if needed:

```bash
sudo apt update
sudo apt install build-essential python3
```

Select the repository's Node version and install dependencies:

```bash
nvm use
npm install
npm run dev
```

Production workflow:

```bash
npm run build
npm start
```

`npm run build` type-checks the main and renderer processes, creates production bundles, rebuilds native dependencies for Electron, and currently packages a Linux AppImage on EC2. A Windows packaging target and Windows-native verification will be added before submission. Runtime OpenAI environment variables will be documented when the intelligence layer is implemented.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite and the Electron app with live rebuilding |
| `npm run lint` | Strictly type-check renderer, shared, main, preload, and configuration code |
| `npm run build` | Type-check, build, rebuild native modules, and package the app |
| `npm start` | Run the previously built Electron application |

## Sample Data

Deterministic Tokyo Trip placeholders live in `agent_assets/sample-files/`:

- `flight-ticket.txt`
- `hotel-booking.txt`
- `budget.csv`
- `packing-list.txt`
- `city-guide.txt`

These stand in for real PDFs, images, and spreadsheets during early parser and clustering work. The north-star mockup is `agent_assets/aether_design.png`.

## Tech Stack

- Electron and electron-builder
- Vite, vite-plugin-electron, React, and TypeScript
- React Flow (`@xyflow/react`) for the infinite canvas
- Tailwind CSS and Framer Motion
- `pdf-parse`, `xlsx`, `tesseract.js`, and `sharp` for file understanding and previews
- OpenAI GPT-5.6 and OpenAI embeddings
- `better-sqlite3` for local metadata, embeddings, and canvas state
- React Context + `useReducer` for renderer state

## Product Architecture

The intended pipeline is:

```text
File Drop → Parser → GPT-5.6 → Structured JSON → React Flow Nodes
                                      ↓
                               Embeddings + Space
                                      ↓
                         Clustering → Summary Dashboard
```

See [`docs/product-spec.md`](docs/product-spec.md) for scope and [`docs/architecture.md`](docs/architecture.md) for the process boundary, IPC design, component tree, and proposed SQLite schema.

## Current Interaction

Drag one or more local files from the operating-system file explorer onto the canvas. Aether authorizes only those explicit paths through the preload bridge, reads their metadata in the main process, and creates FileCard nodes at the spatial drop point. Pan by dragging the open canvas, scroll to pan, use the inset controls to zoom or fit content, and use the minimap to navigate larger spaces.

## Screenshots

_Phase 1 application screenshots and demo media will be added to the repository during the dedicated demo-evidence pass._

Design reference:

![Aether Canvas north-star design](agent_assets/aether_design.png)

## How Codex Was Used

Codex is the primary engineering collaborator for the build. Its contributions and the human decisions that guide or override them are recorded separately after every major milestone in [`docs/codex-build-log.md`](docs/codex-build-log.md). Significant choices are preserved in [`docs/decisions.md`](docs/decisions.md), and concrete proof for the judging criteria is collected in [`docs/judging-evidence.md`](docs/judging-evidence.md).

This separation is deliberate: the final submission will show where Codex accelerated implementation and debugging, while making human product and design judgment visible.

## How GPT-5.6 Powers the Runtime

GPT-5.6 will transform parsed file content into validated structured data: document type, salient entities, preview content, relationship evidence, cluster intent, and dashboard modules. OpenAI embeddings will provide semantic similarity, while canvas proximity supplies the user's spatial intent. Together they create explainable connections and grounded, goal-specific Summary Dashboard Cards.

Runtime OpenAI calls will remain in the Electron main process so credentials never enter the renderer. Durable metadata and workspace state stay local in SQLite.

## Privacy

Aether is local-first: it references source files without moving or modifying them and stores derived workspace state on the user's machine. Before the runtime integration is considered complete, the app will clearly disclose which parsed content is sent to OpenAI for analysis.
