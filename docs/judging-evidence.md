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
- _Add an example showing iterative debugging based on real app behavior._

### GPT-5.6 runtime integration

- GPT-5.6 is the product's file-understanding layer: files are sent directly through Responses `input_file` or `input_image`; PDFs include actual page images, spreadsheets use native augmentation, and images use vision. This is not a wrapper around local text extraction.
- _Show structured file understanding with input, JSON Schema, runtime-validated output, and visible smart preview result._
- _Show relationship or cluster reasoning that cannot be reduced to file extensions._
- _Show generated Summary Dashboard content grounded in multiple source files._
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
