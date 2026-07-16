# Hackathon Judging Evidence

Update this document continuously with specific, demonstrable evidence. Prefer links to files, commit identifiers, screenshots, test output, and demo timestamps over broad claims.

## Submission Context

- **Track:** Apps for Your Life
- **Deadline:** Tuesday, July 21, 2026 at 5:00 PM PT
- **Core runtime model:** GPT-5.6
- **Codex `/feedback` Session ID:** _Add from the core build session_
- **Repository URL:** _Add when available_
- **Demo video URL:** _Add when published; must be under three minutes and include audio_

## 1. Technological Implementation

### Codex usage examples

- _Milestone:_ Phase 1 Electron + React Flow shell.
  - **Human decision:** Prioritize the hero OS file drop, TypeScript, security, and north-star fidelity before intelligent previews.
  - **Evidence:** `src/main`, `src/renderer`, `src/shared`, and configuration files; strict type checks and live Electron captures passed on July 15.
- _Electron/React infrastructure:_ Codex created the three-process Electron boundary, Vite watchers/builds, React Flow shell, shared contracts, and custom renderer experience in one milestone.
- _Debugging evidence:_ Codex reproduced a Sharp native-binding failure in the built main process, identified Vite bundling as the cause, externalized native modules, rebuilt `better-sqlite3` for Electron 37, and reran live smoke tests.
- _Add an example showing Codex implementing and testing parsing or persistence._
- _Add an example showing Codex helping design the clustering or structured-output contract._
- _Structured-output contract:_ Codex designed and implemented the Dashboard Visual System v2 schema, prompt, TypeScript contract, and local primitive renderer. A live five-file GPT-5.6 call returned schema-valid Journey, Budget, Packing, and Places compositions and persisted them into the local workspace.
- _Source intelligence contract:_ Codex added a bounded GPT-5.6 contract for grounded file takeaways, semantic facts, highlights, and next steps, plus type-aware local rendering and backward-compatible entity fallbacks.
- _Add an example showing iterative debugging based on real app behavior._

### GPT-5.6 runtime integration

- GPT-5.6 is the product's file-understanding layer: files are sent directly through Responses `input_file` or `input_image`; PDFs include actual page images, spreadsheets use native augmentation, and images use vision. This is not a wrapper around local text extraction.
- Runtime selection is explicit and testable: Aether defaults to latency-efficient `gpt-5.6-luna` with low reasoning for the live file-drop loop, while environment configuration permits controlled Luna/Terra/Sol and reasoning-effort comparisons without rebuilding the desktop app.
- _Show structured file understanding with input, JSON Schema, runtime-validated output, and visible smart preview result._
- _Show relationship or cluster reasoning that cannot be reduced to file extensions._
- _Show generated Summary Dashboard content grounded in multiple source files._
- _Interactive dashboard evidence:_ The generated card persists user-entered actual expenses, checklist state, item additions, AI suggestion choices, cached context-aware Responses API insights, and real map interactions inside the local workspace—not in a separate web account or database.
- _Show metadata-only relationship discovery after two or more files and explain how spatial proximity will remain a user-controlled signal._

### Verification evidence

- _Automated tests and coverage:_ Native dependency smoke test opened an in-memory `better-sqlite3` database and successfully queried SQLite `3.53.2` under Node `22.23.1` on July 15, 2026.
- _Packaged build / clean clone result:_ Renderer/main/preload production builds and Electron's unpacked Linux package succeed. The packaged executable launched and accepted `city-guide.txt` through its packaged preload bridge; final clean-clone and AppImage execution remain submission-readiness tasks.
- _Failure and recovery behavior:_ Codex separated a missing native compiler tool (`make`) from a Node engine mismatch, documented the reproducible Node/toolchain contract, and verified the repaired installation rather than suppressing warnings.
- _Platform acceptance:_ EC2 Linux/Xvfb evidence is engineering smoke coverage. Add separate Windows evidence for File Explorer drop, native dialogs, display scaling, window chrome, native modules, and the packaged installer before submission.

## 2. Design

### UX decisions and polish details

- North-star reference: `agent_assets/aether_design.png`.
- Fixed semantic language: dates blue `#4A90D9`, cost green `#34A853`, place coral `#EA4335`, tasks purple `#9B72CF`.
- Explainable visual trace from source files through labeled ribbons to dashboard sections.
- Explicit **Connect** / **Keep separate** suggestion flow preserves user agency.
- Phase 1 visual shell uses the mockup's 240px hierarchy, warm neutral sidebar, exact `#F8F8FA` dotted canvas, 12px white file cards, restrained borders/shadows, inset percentage controls, and styled minimap.
- OS drag entry uses a subtle blue wash and compact animated placement card rather than browser-default feedback.
- Semantic ribbons, animated card assembly, Lucide-consistent iconography, and auto-generated summary dashboards create a cohesive premium product experience that goes well beyond a proof of concept. Each ribbon exposes a specific semantic category and each dashboard section remains traceable to analyzed source files.
- File-level inspection now carries the same premium hierarchy: domain-specific hero visuals, semantic fact tiles, restrained layered materials, and actions that trace the source back into the canvas graph.
- The post-analysis briefing uses semantic-color tags, bento fact composition, ranked signal rows, and a numbered action rail so structured GPT output reads as an intentional desktop product rather than formatted model text.
- Checklist sources compile into a departure-readiness briefing rather than a prose dump: authoritative progress, open-item queue, risk signals, and next-step sequencing demonstrate how the same intelligence contract becomes a purpose-built mini-interface.
- The hub-and-spoke connection architecture, flowing semi-transparent ribbons, and orchestrated 2.5-second assembly animation demonstrate a level of design craft rarely seen in hackathon projects. Files visibly organize into a clean three-column narrative: raw artifacts, semantic categories, then a generated workspace.
- Every connection is a custom variable-width SVG contour: asymmetric translucent color halves, nested inner channel, subtle white boundary lines, optical center divider, and directional packet details. React Flow owns the live geometry while dragging, so files, hubs, and ribbons move as one system; hub-to-dashboard streams visibly carry more weight than source tributaries.
- Dashboard sections own visible color-matched terminal ports, ensuring every semantic stream has a clear, traceable endpoint even though the React Flow edge layer sits beneath the card surface.
- Ribbon contrast and elevation are intentional product details: card-equivalent shadow, high-contrast center rails, irregular layered flow packets, and white gap-ring hubs keep the semantic system legible at a glance without breaking the canvas’s premium spatial feel.
- The connector hierarchy is deliberately controlled: each relationship is one saturated destination-directed pipe with fine white/semantic contour treatment and a dark-edged white center rail, rather than a diffuse decorative color cloud.
- The connector system demonstrates performance-aware craft: rich Liquid Glass SVG material is visible at rest, while interaction automatically switches to a single-path rendering mode during dragging and restores the full refractive treatment when movement ends.
- Every UI element uses consistent Lucide icons, custom window chrome, and clear hover, active, focus, and disabled affordances. The top bar and sidebar form a cohesive native-desktop frame rather than exposing generic Electron chrome.
- Sidebar navigation is functional rather than decorative: local persisted spaces can be reopened from a visual grid, recent GPT-5.6-analyzed files are traceable to their workspace, and the Local Files view carries native-picker selections into the same canvas import pipeline as drag-and-drop.
- The blank canvas uses the Aether mark itself as its animated invitation, reinforcing a recognizable product identity before a user has added a file.
- Source cards expose layered, white-ringed semantic ports above their right edge, matching the visible connection start points in the design reference and making the relationship system readable before a ribbon is followed.
- Local Files is a purposeful consumer workflow rather than a generic file browser: users pin repeat-use folders with the native directory picker, see only supported files ordered by recency, and can send an item straight into the active GPT-5.6 canvas analysis flow.
- Local folder browsing uses progressive disclosure and responsive density controls: clear folder-name headers, an optional location/details popover, and polished List, Grid, and Compact representations of the same local files.
- Local Files and Recent default to a visual Grid layout while respecting independently persisted browsing-density choices. Recent also carries the product’s semantic file-type icon language, so mixed PDFs, spreadsheets, images, documents, and notes are quickly scannable.
- Spaces cards preserve each workspace’s semantic identity and show a compact, color-coded inventory of its source-file types, with an explicit `+X` indicator that scales cleanly beyond nine files.
- The canvas is genuinely explorable, not a static visualization: right-click menus, Quick Preview, source-file open/reveal, re-analysis, non-destructive canvas removal, semantic hub highlighting, source-linked Journey/Map controls, and persistent packing progress turn the generated dashboard into a usable mini-workspace.
- The Summary Dashboard is now an interactive mini-app: its sections expand into a timeline/countdown and airport actions, a live editable budget and CSV export, a checkable list with AI-assisted additions, and a real Leaflet map with source/AI pins and external directions. Section hover traces the semantic relationship back through the canvas.
- GPT-5.6 now determines the dashboard information architecture itself through a structured plan: source-grounded modules, names, summaries, and file provenance can vary between travel, study, work, medical, and household clusters while Aether retains a safe, interactive local component library.
- Each GPT-planned module carries a design-system icon and semantic accent selected from a constrained Aether vocabulary, so adaptive dashboards remain visually coherent with the original premium Summary Card rather than becoming generic AI-generated panels.
- The dashboard planner receives the complete Tokyo Trip card as a compositional reference—header, route rail, budget ring, packing progress, map, semantic ports, and provenance footer—then adapts those familiar mini-app patterns to the user’s actual files.
- The generated workspace has a clear AI/compiler boundary: GPT-5.6 returns a schema-constrained dashboard UI plan, then Aether renders it through a tested local component library with real editable/traceable interactions rather than trusting model-authored executable UI.
- Progressive disclosure reinforces the premium desktop design: compact Journey, Budget, Packing, and Map previews convey the workspace instantly; detailed lists, editors, and controls appear only when a user opens the relevant section.
- Section details preserve canvas clarity: opening a generated dashboard module pulls a focused mini-app into a connected detail card rather than inflating the primary dashboard. The dotted semantic tether makes that interaction and provenance legible at a glance.
- The Summary Card demonstrates deliberate visual craft beyond a generic dashboard: semantic header tile, layered desktop materials, tuned compact information visualizations, hairline separators, controlled elevation, and low-friction hover/focus feedback make generated workspaces presentation-ready.
- The final Summary Card art-direction pass was evaluated in the actual Electron/React Flow runtime with the five-file sample cluster—not only from component code. Its compact and expanded states now share one cohesive material, typography, icon, metric, checklist, and map language suitable for close-up demo footage.
- The GPT-5.6 dashboard compiler has a deliberately broad yet safe visual vocabulary: it can select route, metric, progress, map, milestone, brief, stat-grid, priority, calendar, activity, and comparison presentations while Aether preserves a coherent local design system and authoritative live values.
- Dashboard Visual System v2 turns that vocabulary into a composable grammar: GPT-5.6 combines up to three grounded primitives per module while Aether renders every pixel locally. The same renderer can produce route+timeline, ring+status, progress+ranked-list, or future cross-domain compositions without arbitrary model-authored UI.
- Ribbon interaction is performance-aware rather than decorative: hover changes a stable edge’s opacity in place, and direct manipulation uses a single-path live representation before returning to the full material treatment on release.
- **Quality of Idea:** The workspace model shows that users do not need to pre-organize files into folders. Aether locally preserves the evolving canvas, its AI analysis cache, and its semantic workspace identity, so the product organizes itself around the user’s projects.
- **Visual verification:** A live five-file GPT-5.6 Electron capture on July 15 shows blue, green, coral, and purple tributaries converging into semantic hubs, then heavier trunks entering their matching dashboard sections. This is captured from the actual native drag/drop and analysis flow, not a static design mockup.
- **Demo reliability:** Summary section handles are explicitly remeasured after their Framer Motion entrance, preventing hub-to-dashboard ribbons from anchoring at the card’s pre-animation offset.
- _Add before/after screenshots proving fidelity for the shell, nodes, ribbons, dashboard, and minimap._
- _Add animation, loading, empty, error, accessibility, and keyboard-navigation evidence._
- _Add demo timestamp showing the complete polished interaction loop._

## 3. Potential Impact

### Problem and audience

Aether addresses the repeated work of reconstructing context from personal files scattered across downloads, folders, screenshots, PDFs, notes, and spreadsheets. It is aimed at people managing everyday projects—travel, household spending, study, moves, purchases—who need outcomes without first designing a productivity system.

### Evidence to collect

- _User quote or observation validating the pain point._
- _Measured time or steps from raw files to a useful dashboard._
- _Example domains beyond travel that reuse the same core interaction._
- _Privacy explanation showing local persistence and an explicit OpenAI API boundary._

## 4. Quality of the Idea

### What is novel

“Space is the prompt” makes physical arrangement part of the model input. Unlike a folder, file graph, or chat attachment list, proximity expresses evolving intent; semantic ribbons explain why artifacts relate; and a cluster compiles into a functional workspace rather than merely receiving a label or summary.

### Evidence to collect

- _Demo moment where moving or adding a file changes a suggestion or workspace._
- _Comparison showing why folders, search, and chat attachments do not produce the same interaction._
- _Example of a generated dashboard adapting its modules to the cluster's goal._
- _General-purpose evidence:_ The card renders only the sections grounded in discovered dates, costs, tasks, and locations. The same persisted interaction model supports trips, coursework, work projects, household jobs, and other clusters; travel is the visual demo dataset rather than a hard-coded data source.
- _Evidence that the output remains grounded in and traceable to its source files._

## Submission Checklist

- [ ] Working project built with Codex using GPT-5.6
- [ ] Apps for Your Life category selected
- [ ] Final project description
- [ ] Under-three-minute YouTube demo with audio covering Codex and GPT-5.6
- [ ] Public repository or judge access configured
- [ ] README includes setup instructions and sample data
- [ ] Codex acceleration, human decisions, and runtime GPT-5.6 use are explicit
- [ ] `/feedback` Codex Session ID included
- [ ] Clean clone reaches a working app in under five minutes
