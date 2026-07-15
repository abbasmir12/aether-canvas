# Codex Build Log

This log distinguishes Codex acceleration, human product judgment, and verified outcomes. Update it after every major milestone with concrete files, features, commands, and results that can later support the hackathon submission and demo narrative.

## Day 1 — July 14, 2026: Foundation and Shared Context

### Codex contributions

- Inspected the full-resolution north-star mockup and translated its layout, hierarchy, semantic color system, card treatment, and local-first cues into durable project guidance.
- Structured the product specification, MVP boundary, architecture, IPC contract, proposed SQLite schema, judging-evidence template, and seven-day build log.
- Created the repository-level agent instructions, judge-oriented README foundation, package manifest, and five deterministic Tokyo Trip placeholder files.
- Proposed a cache-friendly data flow that separates parsing, GPT-5.6 structured extraction, embeddings, spatial clustering, and dashboard synthesis.

### Human decisions

- Defined “Space is the prompt” as the core interaction thesis and selected Aether Canvas for the “Apps for Your Life” track.
- Supplied the visual north star and required premium desktop aesthetic.
- Selected Electron, React Flow, Tailwind CSS, Framer Motion, file parsing libraries, GPT-5.6, OpenAI embeddings, better-sqlite3, and Context + `useReducer`.
- Directed a documentation-first setup session and explicitly deferred application code and `npm install`.
- Defined the six initial architectural/product decisions recorded in `docs/decisions.md`.

### Verification

- Confirmed `agent_assets/aether_design.png` is present and visually reviewed it at full resolution.
- Confirmed the requested documentation and sample-data directories exist.
- Confirmed no application source code was introduced and dependencies were not installed.
- Confirmed the JSON package manifest parses successfully and all expected scaffold files are present.

## Day 2 — July 15, 2026

### Codex contributions

- Diagnosed the failed dependency installation as two distinct issues: the missing GNU Make executable blocked `better-sqlite3` compilation, while the resolved `@electron/rebuild` toolchain required Node `>=22.12.0`.
- Verified the repaired environment, complete top-level dependency tree, and a real in-memory `better-sqlite3` query.
- Added `.nvmrc`, explicit Node/npm engine requirements, repository ignore rules, and concrete Linux native-toolchain setup instructions.
- Built the first runnable application foundation: strict TypeScript/Vite/Tailwind configuration, Electron main and sandboxed preload processes, React entry point, shared domain contracts, and electron-builder packaging configuration.
- Implemented a calm React Flow spatial canvas with a dot grid, pan/zoom, styled minimap, custom percentage controls, animated drag feedback, multi-file OS drop, and custom FileCard nodes placed at exact flow coordinates.
- Implemented the premium collapsible 240px sidebar with Aether identity, navigation hierarchy, saved spaces, restrained active states, and bottom utility actions based on the north-star mockup.
- Added a narrow `window.aether` bridge and matching main-process handlers for authorized local paths, metadata, text reads, basic text parsing, image thumbnails, and the native file picker.
- Diagnosed and fixed two runtime/build integration issues found during verification: Sharp must remain external to the Vite main bundle, and `better-sqlite3` must be rebuilt against Electron's ABI.
- Replaced the planned local parsing layer with GPT-5.6 native file input through the Responses API; removed `pdf-parse`, `xlsx`, `tesseract.js`, and the obsolete parse IPC channel.
- Built typed file preparation, MIME detection, Base64 upload, high-detail PDF/image requests, JSON Schema outputs, runtime validation, metadata-only relationship discovery, and secure IPC orchestration in the main process.
- Built animated shimmer-to-preview FileCards for flights, hotels/images, budgets, checklists, guides, and documents, plus temporary semantic-colored relationship edges.
- Used current official OpenAI file-input guidance and upgraded the OpenAI SDK because the installed older types did not yet expose PDF `input_file.detail`.

### Human decisions

- Approved upgrading the development environment to Node 22 and installing the required native build toolchain rather than pinning the new project to older Electron packaging dependencies.
- Ran the system-level Node and build-tool installation commands successfully.
- Directed Phase 1 scope around the hero file-drop interaction and required design fidelity to `agent_assets/aether_design.png`.
- Required TypeScript throughout application code, Tailwind component styling, Framer Motion animation, secure prefixed IPC, and no “coming soon” UI.
- Clarified that development runs on an AWS EC2 Linux instance over SSH, while the local Windows PC is the authoritative UX and release-testing environment.
- Chose GPT-5.6 native Responses API file input instead of local parsing libraries, removing three runtime dependencies and making the model—not a text extraction wrapper—the document understanding layer.

### Verification

- `node --version` returned `v22.23.1`, satisfying the declared `>=22.12.0` requirement.
- `make --version` returned GNU Make 4.4.1.
- `npm ls --depth=0` found all declared direct dependencies installed.
- An in-memory `better-sqlite3` database successfully executed `select sqlite_version()` and returned SQLite `3.53.2`.
- `npm run lint` passes strict renderer and Node-process TypeScript checks.
- Vite production builds succeed for the renderer, Electron main process, and preload bridge.
- `npm run dev` starts Vite on port 5173, builds the main/preload watchers, and opens Electron.
- An Xvfb-driven live Electron test dropped `flight-ticket.txt` through Chromium's real OS drag protocol; the screenshot confirmed a text FileCard at the drop coordinates alongside the sidebar, dotted canvas, zoom controls, and minimap.
- A second development-mode smoke test dropped `budget.csv` and rendered the spreadsheet-colored FileCard.
- Electron Builder successfully rebuilds `better-sqlite3` for Electron 37 and produces `release/linux-unpacked`. The packaged executable was launched under Xvfb and successfully rendered the shell and accepted a real `city-guide.txt` drop through its packaged preload bridge. AppImage finalization remains to be confirmed in a normal interactive shell because the automated command runner detaches from the compressor subprocess.
- The only production bundle warning is the renderer's initial 513 KB chunk; code splitting is deferred until feature boundaries exist.
- Phase 2 strict TypeScript and Vite builds pass. Offline file preparation correctly identified and encoded `flight-ticket.txt`; non-image thumbnail generation correctly returned `null`.
- With no EC2 API key configured, the live Electron drop test transitioned into a recoverable card-level error instead of hanging or crashing. Real GPT-5.6 sample-file assertions remain pending `OPENAI_API_KEY` configuration.

## Day 3 — July 16, 2026

### Codex contributions

_Record what Codex built or proposed, including affected files._

### Human decisions

_Record choices, overrides, constraints, and product direction from the human._

### Verification

_Record commands run, tests passed, and observable behavior._

## Day 4 — July 17, 2026

### Codex contributions

_Record what Codex built or proposed, including affected files._

### Human decisions

_Record choices, overrides, constraints, and product direction from the human._

### Verification

_Record commands run, tests passed, and observable behavior._

## Day 5 — July 18, 2026

### Codex contributions

_Record what Codex built or proposed, including affected files._

### Human decisions

_Record choices, overrides, constraints, and product direction from the human._

### Verification

_Record commands run, tests passed, and observable behavior._

## Day 6 — July 19, 2026

### Codex contributions

_Record what Codex built or proposed, including affected files._

### Human decisions

_Record choices, overrides, constraints, and product direction from the human._

### Verification

_Record commands run, tests passed, and observable behavior._

## Day 7 — July 20, 2026: Submission Readiness

### Codex contributions

_Record what Codex built or proposed, including affected files._

### Human decisions

_Record choices, overrides, constraints, and product direction from the human._

### Verification

_Record final build, packaging, demo rehearsal, README clone test, and submission checks._

## Deadline — July 21, 2026, 5:00 PM PT

_Record only final submission fixes, evidence capture, `/feedback` Session ID, and submission confirmation._
