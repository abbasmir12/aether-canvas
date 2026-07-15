# Aether Canvas Product Specification

## Product Thesis

**One-line pitch:** A generative desktop where spatially grouping ordinary files creates the mini-app you need.

**Core concept:** Space is the prompt.

## Problem Statement

People accumulate useful context across downloads, folders, screenshots, PDFs, notes, and spreadsheets. Traditional file managers can store and retrieve these artifacts, but they do not understand why the files belong together or what the person is trying to accomplish. Users must repeatedly reconstruct that context and manually translate it into plans, trackers, and summaries.

## Solution

Aether Canvas replaces rigid folders with an infinite, pannable desktop canvas. A user drops ordinary local files onto the canvas and arranges them naturally. Aether parses their content, uses GPT-5.6 to extract structured meaning, computes semantic similarity, and interprets spatial proximity as intent. It renders categorized relationship ribbons and, when a cluster becomes coherent, compiles the files into an interactive Summary Dashboard Card suited to the shared goal.

The result is not merely an organized collection. It is a lightweight, generated mini-workspace such as a trip planner, expense tracker, or study dashboard.

## Target User Persona

The primary user is a digitally busy individual who manages real-life projects from mixed file types and dislikes maintaining elaborate productivity systems. They may be planning travel, tracking household expenses, studying a topic, organizing a move, or comparing purchases. They value visual thinking, fast setup, privacy, and tools that adapt to the task rather than requiring a predefined schema.

## Core Features

### File drop

Drag local PDFs, images, spreadsheets, and text files directly onto an infinite canvas. Preserve their spatial position and source metadata locally.

### Smart previews

Render compact, content-aware file cards rather than generic icons: itinerary details for a ticket, a thumbnail for an image, table rows for a spreadsheet, and checklist items for a text file.

### Semantic ribbons

Connect related files and generated cards with flowing, labeled bezier ribbons. Relationships are legible at a glance through fixed categories: dates (`#4A90D9`), cost (`#34A853`), place (`#EA4335`), and tasks (`#9B72CF`).

### Auto-clustering

Combine semantic similarity, extracted entities, and canvas proximity to identify groups that likely represent one user goal. Spatial grouping is an intentional input, not a cosmetic layout choice.

### Summary cards

Generate a functional dashboard for a coherent cluster. The Tokyo trip reference includes journey details, budget status, packing progress, and a map, all traceable to the contributing files.

### Smart suggestions

When a new file appears relevant to an existing cluster, offer a clear, reversible choice such as “Add transport to this trip?” with **Connect** and **Keep separate** actions.

## MVP Scope for Build Week

### We will build

- An installable Electron desktop application with a Vite, React, and TypeScript renderer.
- A polished infinite React Flow canvas with pan, zoom, minimap, custom file nodes, semantic edges, and summary nodes.
- Drag-and-drop ingestion for PDF, image, spreadsheet, CSV, and text files.
- Local parsing through `pdf-parse`, `xlsx`, `tesseract.js`, and `sharp` where appropriate.
- GPT-5.6 structured extraction of entities, relationships, cluster intent, and dashboard content.
- OpenAI embeddings for semantic similarity.
- A pragmatic clustering strategy combining embeddings, extracted entities, and spatial distance.
- Local SQLite persistence for files, analysis, relationships, clusters, and canvas positions.
- The Tokyo Trip golden demo using the included placeholder data and later real sample assets.
- Smart connection suggestions with explicit user confirmation.
- Clear loading, success, empty, and recoverable error states suitable for a sub-three-minute demonstration.
- Documentation of Codex contributions, human decisions, runtime GPT-5.6 usage, and judging evidence.

### We will not build this week

- A true operating-system shell or replacement for Finder/File Explorer.
- Cloud sync, accounts, collaboration, or multi-device state.
- Background indexing of the user's entire filesystem.
- Autonomous file moves, deletion, or modification of source documents.
- A general-purpose plugin marketplace or arbitrary generated executable code.
- Production-grade support for every document format or every dashboard domain.
- Mobile or web clients.
- Fully offline AI inference.
- Enterprise permissions, administration, or compliance features beyond local-first storage and explicit API use.

## Experience Principles

- **Direct manipulation:** arranging files should feel like expressing intent, not configuring automation.
- **Explainable intelligence:** every relationship and generated result should remain visually traceable to source files.
- **User control:** suggestions are reversible and never silently merge unrelated work.
- **Local-first trust:** metadata and canvas state remain on-device; only necessary content is sent to configured OpenAI APIs.
- **Demo depth over breadth:** one complete, beautiful Tokyo Trip workflow is more valuable than many shallow templates.
