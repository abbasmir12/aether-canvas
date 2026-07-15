# Architecture and Product Decisions

Use this log for consequential technical, product, design, algorithm, and scope choices. Preserve superseded decisions and link the replacement rather than silently rewriting history.

## 001. Electron instead of a native OS shell

**Status:** Accepted  
**Date:** July 14, 2026  
**Decision owner:** Human

We chose Electron for a real installable desktop experience within the hackathon timeline. A true OS shell replacement would add risk without improving the core demonstration.

## 002. React Flow instead of raw Canvas/SVG

**Status:** Accepted  
**Date:** July 14, 2026  
**Decision owner:** Human

React Flow provides custom nodes, custom edges, built-in minimap, pan/zoom, and drag-drop—exactly what our mockup needs. Building from raw canvas would take days we do not have.

## 003. GPT-5.6 for both build tool and runtime intelligence

**Status:** Accepted  
**Date:** July 14, 2026  
**Decision owner:** Human

Codex (powered by GPT-5.6) builds the app. The GPT-5.6 API also powers file understanding and clustering at runtime. This dual usage demonstrates deep integration, which judges specifically evaluate.

## 004. Semantic ribbons instead of plain graph edges

**Status:** Accepted  
**Date:** July 14, 2026  
**Decision owner:** Human

Color-coded flowing bezier curves categorized by relationship type (dates, cost, place, tasks) communicate meaning at a glance. Plain lines would make this look like every other graph tool.

## 005. Summary Dashboard Cards instead of simple labels

**Status:** Accepted  
**Date:** July 14, 2026  
**Decision owner:** Human

Auto-generating a functional dashboard—with budget charts, packing progress, maps, and other goal-specific modules—from raw files is the “wow moment” that separates this from a file organizer.

## 006. Local-first with SQLite

**Status:** Accepted  
**Date:** July 14, 2026  
**Decision owner:** Human

All durable app data stays on the user's machine. Privacy is a feature. We will not add cloud sync complexity during the hackathon. Content required for runtime intelligence may be sent explicitly to the OpenAI API, while metadata, embeddings, canvas positions, and generated workspace state persist locally.

## 007. Standardize development on Node 22

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Codex proposal accepted by human

The project requires Node `>=22.12.0` and provides `.nvmrc` targeting Node 22. The current Electron native-module rebuild toolchain requires this floor, and using a current supported Node line avoids pinning a new hackathon project to outdated packaging dependencies. Linux development environments must also provide Python 3, GNU Make, and a C/C++ compiler for native dependencies such as `better-sqlite3`.

The consequence is a slightly stricter prerequisite, documented in the README, in exchange for deterministic installation and compatibility with the selected Electron toolchain.

## 008. Authorize local file paths at the preload boundary

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Codex proposal accepted through implementation

The renderer cannot access Node or arbitrary filesystem APIs. For OS drops, the preload uses Electron's `webUtils.getPathForFile`, then the main process resolves, validates, stats, and records that explicit path in an in-memory authorization set. File reading, parsing, metadata, and thumbnail handlers reject any path that did not originate from a drop or native picker action.

This preserves the first-try native drop experience without exposing unrestricted filesystem capability through `window.aether`. Authorization is session-scoped for Phase 1; persisted permissions can be designed alongside saved spaces.

## 009. Keep native modules external to the Electron main bundle

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Codex proposal accepted through verification

Vite must not bundle `sharp` or `better-sqlite3` into the Electron main-process JavaScript. Their native bindings rely on runtime module resolution and Electron-specific ABI artifacts. Both remain external dependencies, and electron-builder unpacks their native files from ASAR and rebuilds `better-sqlite3` for the selected Electron version.

This adds a native rebuild step to packaging but prevents dynamic binding failures and keeps development and packaged execution aligned.

## 010. Package Linux as AppImage for the hackathon

**Status:** Accepted  
**Date:** July 15, 2026  
**Decision owner:** Codex proposal accepted through implementation

Linux packaging explicitly targets AppImage rather than relying on Electron Builder's platform defaults, which attempted multiple formats. A single portable artifact minimizes packaging variability for EC2 smoke builds. Windows packaging is a required pre-submission validation target; macOS remains future work.

## 011. Develop remotely on EC2 and validate the product on Windows

**Status:** Accepted  
**Date:** July 15, 2026  
**Decision owner:** Human

Development currently runs on a headless AWS EC2 Linux instance accessed over SSH from the human's local PC. Linux checks—strict TypeScript, builds, IPC smoke tests, Xvfb captures, and the unpacked Electron executable—provide fast engineering validation, but they are not the final UX acceptance environment.

The application will be tested on the human's Windows PC before submission. Windows validation must cover native window chrome, display scaling, fonts, drag-and-drop from File Explorer, absolute path handling, minimap and animation rendering, native file dialogs, `better-sqlite3` and Sharp binaries, and Windows packaging. Platform-specific findings must be recorded separately rather than inferred from Xvfb behavior.

## 012. GPT-5.6 native file input instead of local parsing libraries

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

GPT-5.6's Responses API receives files directly. For PDFs it supplies extracted text and page images; for spreadsheets it parses up to the first 1,000 rows per sheet and adds generated summary/header metadata; for text documents it extracts text; and for images it provides full vision understanding. We removed `pdf-parse`, `xlsx`, and `tesseract.js`. Sharp remains only for local UI thumbnails.

This reduces bundle surface and orchestration complexity while improving contextual extraction: GPT-5.6 sees the document representation used for reasoning instead of consuming locally flattened parser output. Non-PDF embedded charts are a known API limitation; important chart-heavy Office documents should be converted to PDF for visual fidelity.

## 013. Responses API instead of Chat Completions

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

Aether uses `client.responses.create()` for file analysis and relationship discovery. Responses provides native `input_file`, PDF detail control, multimodal content, JSON Schema structured output, and a path to stateful/tool-using workflows. Chat Completions is not used by the runtime intelligence layer.

The originally proposed “40–80% better cache utilization” figure was not recorded as evidence because current official documentation reviewed during implementation did not substantiate that exact range. We will cite measured Aether latency/caching data or an exact official source if this becomes a submission claim.

## 014. GPT-5.6 Luna with low reasoning as the configurable default

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

Aether defaults runtime file analysis and relationship discovery to `gpt-5.6-luna` with `reasoning.effort: "low"`. Luna fits the repeated, latency-sensitive analysis performed during live file drops, while low reasoning is the API equivalent of the product's “light” setting. Both values are configurable through `AI_MODEL` and `AI_REASONING_EFFORT` without a rebuild.

Official GPT-5.6 options remain available for evaluation: Terra balances intelligence and cost, while Sol targets frontier capability. Supported effort values are `none`, `low`, `medium`, `high`, `xhigh`, and `max`; invalid configuration fails early with an actionable error instead of silently changing behavior. We will raise model capability or reasoning effort only when representative sample-file tests show a quality benefit worth the added latency and cost.

## 015. Custom SVG semantic ribbons instead of React Flow default edges

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

Default graph edges read as implementation scaffolding and make relationship labels compete with the source documents. Aether now renders a custom SVG edge for each semantic relationship: a three-pixel animated Bezier stroke, a restrained colored glow, terminal dots, and an icon-led relationship badge. The full relationship statement moves to the badge tooltip, preserving the canvas's visual calm.

This makes meaning immediately scannable—dates blue, cost green, place coral, and tasks purple—and turns the connection system into a product-defining visual language rather than generic diagram chrome.

## 016. Auto-generated Summary Dashboard Card

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

When GPT-5.6 determines that analyzed files form a cluster, Aether generates and auto-positions a functional dashboard to the right of the group. Its Journey, Budget, Packing, and Map sections are conditionally assembled from the grounded file-analysis entities, then linked back to source files by semantic ribbons.

This changes the product from a file organizer into a workspace generator: the user sees a useful mini-app emerge from files they spatially grouped, while the source cards and ribbons make every dashboard datum traceable.

## 017. Hub mediator node architecture instead of direct connections

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

Direct file-to-file and file-to-dashboard edges create visual spaghetti as a cluster grows. Aether now routes each extracted entity category through one colored mediator hub: source files flow into DATES, COST, PLACE, or TASKS; each hub then flows to the matching Journey, Budget, Map, or Packing section of the generated dashboard.

The funnel makes the synthesis process legible in one glance—raw files are categorized, then compiled into a workspace—and gives the demo a stronger visual narrative. Hubs are only created when at least one analyzed file contains the corresponding entity type.

## 018. Auto-layout with animated organization

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

After clustering, Aether moves source cards into an ordered left column, category hubs into an evenly spaced middle column, and the generated dashboard into a right column. This replaces arbitrary drop coordinates with a stable, explainable composition while preserving the initial free-form drop interaction.

The 500ms material-eased reorganization is intentional product feedback: the canvas appears to think through the files, reinforcing the core message that “Space is the prompt.”

## 019. Multi-layer SVG ribbon rendering

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

Each merged semantic stream is rendered as three stacked SVG paths following the same organic horizontal cubic Bezier: a barely visible blurred atmosphere, a translucent colored main body, and a delayed white highlight. Path-length sampling places tiny, low-opacity white flow dots only on those merged streams after the draw animation completes.

This produces a translucent river-of-light treatment rather than a flat graph line without visible concentric bands. Hub-to-dashboard ribbons use a wider 48px/22px/4px variant so the merged stream visibly carries more weight than its file-to-hub tributaries.

## 020. Resilient workspace assembly after file analysis

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Codex proposal accepted through implementation

GPT relationship discovery remains the source of a preferred cluster name and date range, but its `shouldCluster` boolean is not allowed to leave a clearly related analyzed set visually inert. Once two files have completed analysis, Aether assembles a conservative local workspace fallback from grounded locations, dates, and categories when the model does not return a positive cluster flag in time.

This preserves the demo's core “canvas thinks” moment while keeping all visible content traceable to file analysis. It also makes the interaction robust to a low-confidence or delayed relationship response.

## 021. Merged tributary-to-river ribbons

**Status:** Accepted
**Date:** July 15, 2026
**Decision owner:** Human

Rendering a full multi-layer band for every file-to-hub connection made otherwise correct ribbons visually noisy. Aether now creates an invisible merge anchor per active category: individual files send thin, lightly varied tendrils to that anchor, and exactly one three-layer river continues from the anchor to the hub. The same category hub then sends one prominent trunk to its matching dashboard section.

This makes the connection system read as a natural data funnel instead of parallel graph edges. It also keeps the category colors and hand-drawn curve variation while substantially reducing visual weight on a five-file workspace.

## Decision Template

## NNN. Decision title

**Status:** Proposed / Accepted / Superseded  
**Date:** YYYY-MM-DD  
**Decision owner:** Human / Codex proposal accepted by human

**Context:** What forced a choice?

**Decision:** What did we choose?

**Reasoning:** Why is it appropriate for the product and deadline?

**Consequences:** What tradeoffs or follow-up work does it create?
