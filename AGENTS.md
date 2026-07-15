# Aether Canvas — Codex Agent Instructions

## Project Overview

**One-line pitch:** A generative desktop where spatially grouping ordinary files creates the mini-app you need.

**Core concept:** Space is the prompt.

Aether Canvas is a local-first Electron application built around an infinite spatial canvas. It understands files placed near one another, reveals their semantic relationships, and compiles useful clusters into interactive summary dashboards.

## Design Reference

- ALWAYS check `agent_assets/aether_design.png` before building any UI component.
- Follow the design tokens in this file exactly.
- Never use default Tailwind colors for semantic elements (ribbons, pills, cards).
- Match the mockup's premium, minimal, Apple-level aesthetic.
- Preserve the mockup's visual hierarchy: quiet application chrome, compact source-file cards, expressive translucent ribbons, and a prominent but restrained summary dashboard.

## Design Tokens

### Colors

- Dates ribbon blue: `#4A90D9`
- Cost ribbon green: `#34A853`
- Place ribbon coral: `#EA4335`
- Tasks ribbon purple: `#9B72CF`
- Canvas background: `#F8F8FA`
- Card background: `#FFFFFF`
- Primary text: near-black neutral, selected for accessible contrast
- Secondary text and dividers: neutral grays sampled or derived to match the mockup
- Ribbon glows may use translucent tints of their semantic color; their solid anchors and pills must use the exact colors above.

### Typography

- Clean system sans-serif stack
- Font weights: `400` for body, `500` for controls and labels, `600` for headings
- Use compact, legible sizing and restrained hierarchy consistent with native desktop software.

### Shape and Elevation

- Standard card radius: `12px`
- Summary dashboard radius: `16px`
- Category pill radius: `20px` (full-round), with white text on the semantic ribbon color
- Card shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Use thin neutral borders, subtle translucent ribbon layers, and small colored connection dots as shown in the reference.

## Build Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`

## Code Conventions

- Use TypeScript for all new files.
- Use functional React components with hooks.
- Keep components small and focused (one file per component).
- Use Tailwind for styling, no separate CSS files.
- Use Framer Motion for all animations.
- Prefix all IPC channels with `aether:`.

## File Structure Convention

```text
src/
├── main/           (Electron main process)
├── renderer/       (React app)
│   ├── components/ (React components)
│   ├── hooks/      (Custom React hooks)
│   ├── services/   (GPT-5.6 integration, file parsing, DB)
│   ├── stores/     (State management)
│   ├── types/      (TypeScript interfaces)
│   └── utils/      (Helper functions)
└── shared/         (Types/utils shared between main and renderer)
```

## CRITICAL RULES — Follow these every session

### Rule 1: Update the build log after every major milestone

After completing any significant feature or module, append to `docs/codex-build-log.md` with what Codex contributed and what the human decided. Never skip this.

### Rule 2: Record architectural decisions

When making any significant technical choice (library selection, data structure design, algorithm choice, feature scoping), append to `docs/decisions.md` with the decision and its reasoning.

### Rule 3: Update judging evidence

When completing something that maps to a judging criterion, update `docs/judging-evidence.md` with the specific example.

### Rule 4: Design fidelity

Before building any visual component, reference `agent_assets/aether_design.png`. If the output does not match the mockup's quality level, iterate until it does.

### Rule 5: Test with sample files

Always test file parsing and AI features using the sample files in `agent_assets/sample-files/`. If that folder does not exist, remind the human to add test files.

### Rule 6: Commit messages

Use descriptive commit messages that indicate whether the work was Codex-generated or human-directed. Format: `[codex] description` or `[human] description`.

### Rule 7: README maintenance

Keep `README.md` updated with current setup instructions. A judge must be able to clone this repository and run the app in under five minutes.
