# RZManager -- Modular RPG Development Studio

A comprehensive, modular RPG game development studio built with Next.js. RZManager provides isolated visual environments for NPC editing, item management, database viewing, visual node scripting, and full database deployment pipelines -- all within a single-page application.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
- [Environment Schemas](#environment-schemas)
- [View Navigation](#view-navigation)
- [Services](#services)
- [Libraries and Dependencies](#libraries-and-dependencies)
- [Configuration](#configuration)
- [Deployment](#deployment)

---

## Overview

RZManager is a browser-based RPG development studio that organizes game data editing into **isolated environments**. Each environment (NPC, Item, Monster, Quest, Skill, State) has its own node-based visual editor with typed connections, validation rules, and schema definitions. Beyond the environments, the app includes a suite of **top-level tool views** for database management, deployment, and conflict resolution.

### Key Features

- **6 Isolated Environments** -- NPC, Item, Monster, Quest, Skill, and State editors with node-based visual graphs
- **Visual Node Editor** -- Drag-and-drop node scripting with typed ports and connection validation via React Flow
- **Change Tracking** -- Local diff system that detects field-level, node-level, and edge-level changes against snapshots
- **Database Explorer** -- Hierarchical server/database/table tree with structure, data, and SQL preview tabs
- **RDB Export Tool** -- Batch export with hash-based change detection, encoding options, and progress tracking
- **Smart Apply / Merge Engine** -- Full deployment pipeline with dependency analysis, ID resolution, conflict detection, diff-aware SQL generation, and interactive conflict resolution
- **Workspace Management** -- Multiple workspace support with create, duplicate, and switch actions
- **Database Connections** -- Connection profile manager with SSH tunneling configuration
- **Commit and Deploy** -- Staged entity review, SQL preview, and transaction execution
- **DB Comparison** -- Schema and data diff between source and target databases

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI Components | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS 4 |
| Node Editor | @xyflow/react (React Flow) 12 |
| Charts | Recharts 2 |
| Fonts | Geist Sans + Geist Mono |
| Forms | React Hook Form + Zod |
| Resizable Panels | react-resizable-panels |
| Notifications | Sonner |
| Drawer | Vaul |
| Date Handling | date-fns |
| Carousel | Embla Carousel |
| Analytics | Vercel Analytics |
| AI SDK | Vercel AI SDK 5 + Google AI provider |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** (recommended package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd rzmanager

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server with HMR |
| `pnpm build` | Create an optimized production build |
| `pnpm start` | Run the production build locally |
| `pnpm lint` | Run ESLint on the codebase |

---

## Project Structure

```
rzmanager/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── demo-country/         # Demo country data endpoint
│   │   └── execute-workflow/     # Workflow execution endpoint
│   ├── globals.css               # Global styles, Tailwind config, design tokens
│   ├── layout.tsx                # Root layout (fonts, metadata, analytics)
│   ├── opengraph-image.tsx       # OG image generation
│   └── page.tsx                  # Main app entry -- view router
│
├── components/
│   ├── canvas/                   # Canvas/graph related components
│   │   ├── changes-panel.tsx     # Change tracking diff panel
│   │   ├── environment-canvas.tsx # Main node editor canvas
│   │   └── schema-nodes.tsx      # Schema-driven node renderers
│   │
│   ├── dashboard/                # Dashboard hub and loaders
│   │   ├── dashboard-hub.tsx     # Main dashboard with action bar
│   │   └── environment-loader.tsx # Animated environment loading screen
│   │
│   ├── environments/             # Isolated editing environments
│   │   ├── environment-shell.tsx # Unified environment container
│   │   ├── database-environment.tsx
│   │   ├── item-environment.tsx
│   │   ├── node-editor-environment.tsx
│   │   └── npc-environment.tsx
│   │
│   ├── managers/                 # CRUD manager dialogs
│   │   ├── items-manager.tsx
│   │   ├── monsters-manager.tsx
│   │   ├── npcs-manager.tsx
│   │   ├── quests-manager.tsx
│   │   ├── skills-manager.tsx
│   │   └── states-manager.tsx
│   │
│   ├── nodes/                    # Custom node type components
│   │   ├── audio-node.tsx
│   │   ├── conditional-node.tsx
│   │   ├── embedding-model-node.tsx
│   │   ├── end-node.tsx
│   │   ├── http-request-node.tsx
│   │   ├── image-generation-node.tsx
│   │   ├── javascript-node.tsx
│   │   ├── prompt-node.tsx
│   │   ├── start-node.tsx
│   │   ├── structured-output-node.tsx
│   │   ├── text-model-node.tsx
│   │   └── tool-node.tsx
│   │
│   ├── npc-canvas/               # NPC-specific canvas components
│   │   ├── npc-canvas.tsx
│   │   └── npc-nodes.tsx
│   │
│   ├── views/                    # Top-level navigation views
│   │   ├── workspaces-view.tsx
│   │   ├── database-connections-view.tsx
│   │   ├── commit-deploy-view.tsx
│   │   ├── explorer-view.tsx
│   │   ├── compare-view.tsx
│   │   ├── rdb-export-view.tsx
│   │   ├── smart-apply-view.tsx
│   │   └── settings-view.tsx
│   │
│   ├── ui/                       # shadcn/ui components (55+ components)
│   ├── app-sidebar.tsx           # Application sidebar
│   ├── code-export-dialog.tsx    # AI SDK code export dialog
│   ├── execution-panel.tsx       # Node execution panel
│   ├── node-config-panel.tsx     # Node configuration sidebar
│   ├── node-palette.tsx          # Draggable node palette
│   └── theme-provider.tsx        # Theme context provider
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Responsive breakpoint hook
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Core logic and utilities
│   ├── services/                 # Service layer
│   │   ├── merge-engine.ts       # Smart Apply pipeline and conflict resolution
│   │   └── rdb-service.ts        # RDB export service with hashing and encoding
│   ├── change-tracker.ts         # Local change diff system
│   ├── code-generator.ts         # AI SDK code generation from node graphs
│   ├── environment-schemas.ts    # All 6 environment schema definitions
│   ├── node-utils.ts             # Node status color utilities
│   ├── view-controller.ts        # App-level view type definitions
│   └── utils.ts                  # General utilities (cn class merge)
│
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS configuration
└── package.json                  # Dependencies and scripts
```

---

## Core Systems

### 1. View Router (`app/page.tsx`)

The entire application is a single-page app with state-driven view routing. The root component manages an `AppView` state that determines which view is rendered:

- **`"dashboard"`** -- Renders the `DashboardHub` with the action bar and environment cards
- **`"loading"`** -- Renders the animated `EnvironmentLoader` during transitions
- **Environment IDs** (`"npc"`, `"item"`, `"monster"`, `"quest"`, `"skill"`, `"state"`) -- Renders the `EnvironmentShell` with the appropriate environment
- **Module views** (`"workspaces"`, `"explorer"`, `"smart-apply"`, etc.) -- Renders the corresponding tool view

### 2. Environment System (`lib/environment-schemas.ts`)

Each of the 6 environments is defined as an `EnvironmentSchema` containing:

- **Node schemas** -- Typed node definitions with input/output ports, color coding, categories, and instance limits
- **Connection rules** -- Valid source-to-target port connections enforced at the canvas level
- **Port types** -- `string-code`, `number`, `script`, and `reference` for typed handle connections

Environments: **NPC**, **Item**, **Monster**, **Quest**, **Skill**, **State**

### 3. Change Tracking (`lib/change-tracker.ts`)

A pure view-layer diff system that operates entirely on snapshots:

- Takes a "before" and "after" `GraphSnapshot` (nodes + edges)
- Detects **field-level changes** on node data properties
- Detects **node additions and removals**
- Detects **edge additions and removals**
- Returns a `ChangesSummary` with categorized diffs and a total count

### 4. Node Editor Canvas (`components/canvas/environment-canvas.tsx`)

The visual node editor built on `@xyflow/react` (React Flow):

- Schema-driven node rendering via `schema-nodes.tsx`
- Typed port connections with validation
- Node palette for drag-and-drop creation
- Configuration panel for selected nodes
- Changes panel for reviewing local modifications
- Code export to AI SDK format

### 5. Code Generator (`lib/code-generator.ts`)

Converts a visual node graph into runnable AI SDK code. Traverses the graph from entry nodes, generating import statements and function bodies using `generateText`, `embed`, `generateObject`, and `tool` calls from the Vercel AI SDK.

---

## Environment Schemas

| Environment | Root Node | Key Fields | Port Types |
|---|---|---|---|
| NPC | `NPCResource` | name, level, race, position, equipment IDs | string-code, number, reference |
| Item | `ItemResource` | name, type, equip slots, price, stats | string-code, number, script |
| Monster | `MonsterResource` | name, level, element, stats, drops | string-code, number, reference |
| Quest | `QuestResource` | name, type, requirements, rewards, steps | string-code, number, reference, script |
| Skill | `SkillResource` | name, element, MP cost, power, range | string-code, number, script |
| State | `StateResource` | name, type, duration, effects, triggers | string-code, number, script |

Each environment enforces:
- **Single root node** (not deletable, max 1 instance)
- **Typed connections** (only matching port types can connect)
- **Required fields** (validated at the schema level)

---

## View Navigation

The `view-controller.ts` module defines the navigation type system:

```typescript
type NavigationViewId =
  | "dashboard" | "loading"
  | "workspaces" | "database-connections" | "commit-deploy"
  | "explorer" | "compare" | "rdb-export" | "smart-apply"
  | "settings"

type AppView = NavigationViewId | EnvironmentId
```

Navigation is triggered from the `DashboardHub` action bar:
- **Workspaces** / **Database Connections** / **Commit & Deploy** -- Direct action bar buttons
- **Database Explorer** / **DB Comparison** / **RDB Export** / **Smart Apply** -- Tools dropdown menu
- **Settings** -- Gear icon button

All views provide an `onBack` callback that returns to the dashboard.

---

## Services

### Merge Engine (`lib/services/merge-engine.ts`)

The Smart Apply pipeline processes game data through 6 stages:

1. **Dependency Analysis** -- Scans entities for cross-references, classifies as FOUND_IN_PROJECT / FOUND_IN_DATABASE / MISSING_CRITICAL / MISSING_OPTIONAL
2. **ID Resolution** -- Detects PK/unique conflicts against existing database IDs, generates safe remapped IDs respecting reserved ranges
3. **Conflict Detection** -- Computes per-field diffs between project and database versions, identifies fields needing resolution
4. **Conflict Resolution** -- Interactive resolution: Update Existing (with per-field selection), Generate New ID, or Cancel Entity
5. **SQL Generation** -- Produces MERGE statements (IF EXISTS -> UPDATE, ELSE -> INSERT) with proper execution ordering
6. **Execution** -- Transaction wrapper with XACT_ABORT, TRY/CATCH, and ROLLBACK safety

### RDB Export Service (`lib/services/rdb-service.ts`)

Handles batch export of game data tables:

- Hash-based change detection to identify modified entities
- Configurable encoding options (UTF-8, Shift-JIS, EUC-KR)
- Mock encryption layer
- Progress callbacks for UI integration
- Download helpers for individual and batch ZIP exports

---

## Libraries and Dependencies

### Core Framework

| Library | Version | Purpose |
|---|---|---|
| `next` | 15.5.7 | React framework with App Router, SSR, and API routes |
| `react` / `react-dom` | 19.1.0 | UI rendering engine |
| `typescript` | 5.x | Type-safe development |

### UI Component System

| Library | Version | Purpose |
|---|---|---|
| `@radix-ui/react-*` | Various | Accessible, unstyled UI primitives (dialog, dropdown, tabs, tooltip, etc.) |
| `tailwindcss` | 4.x | Utility-first CSS framework |
| `class-variance-authority` | 0.7.x | Component variant management for shadcn/ui |
| `clsx` | 2.x | Conditional class name joining |
| `tailwind-merge` | 3.x | Intelligent Tailwind class merging |
| `tailwindcss-animate` | 1.x | Animation utilities for Tailwind |
| `lucide-react` | 0.454.x | Icon library (used throughout the UI) |
| `geist` | 1.3.x | Geist Sans and Geist Mono font families |

### Visual Editor

| Library | Version | Purpose |
|---|---|---|
| `@xyflow/react` | 12.8.6 | Node-based visual graph editor (React Flow) |
| `react-resizable-panels` | 2.x | Resizable split pane layouts |

### Forms and Validation

| Library | Version | Purpose |
|---|---|---|
| `react-hook-form` | 7.x | Performant form state management |
| `@hookform/resolvers` | 3.x | Zod resolver for react-hook-form |
| `zod` | 3.x | Schema validation and type inference |

### Data and Visualization

| Library | Version | Purpose |
|---|---|---|
| `recharts` | 2.15.x | Charting library for data visualization |
| `date-fns` | 4.x | Date utility functions |

### AI Integration

| Library | Version | Purpose |
|---|---|---|
| `ai` | 5.x | Vercel AI SDK for code generation from node graphs |
| `@ai-sdk/google` | 2.x | Google AI model provider |

### UI Extras

| Library | Version | Purpose |
|---|---|---|
| `sonner` | 1.x | Toast notification system |
| `vaul` | 0.9.x | Drawer component |
| `cmdk` | 1.x | Command palette (Cmd+K) |
| `embla-carousel-react` | 8.x | Carousel/slider component |
| `input-otp` | 1.x | OTP input component |
| `react-day-picker` | 9.x | Calendar/date picker |
| `next-themes` | 0.4.x | Theme switching (light/dark) |

### Analytics

| Library | Version | Purpose |
|---|---|---|
| `@vercel/analytics` | 1.3.x | Vercel web analytics |

### Installing a New Library

```bash
# Add a runtime dependency
pnpm add <library-name>

# Add a dev dependency
pnpm add -D <library-name>
```

All imports use ES module syntax (`import` / `export`). Path aliases are configured via `@/*` mapping to the project root.

---

## Configuration

### TypeScript (`tsconfig.json`)

- **Target**: ES6
- **Module Resolution**: Bundler
- **Strict Mode**: Enabled
- **Path Alias**: `@/*` maps to project root

### Next.js (`next.config.mjs`)

- TypeScript build errors are currently ignored (`ignoreBuildErrors: true`)
- Images are unoptimized for development flexibility

### Tailwind CSS (`globals.css`)

Tailwind CSS v4 is configured entirely through `globals.css` -- there is no `tailwind.config.js`. Design tokens (colors, radius, fonts) are defined using the `@theme inline` directive:

```css
@theme inline {
  --font-sans: 'Geist', 'Geist Fallback';
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
  --radius: 0.625rem;
  /* ... color tokens for background, foreground, card, etc. */
}
```

---

## Deployment

### Vercel (Recommended)

The project is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Vercel auto-detects the Next.js framework
3. Push to your main branch to trigger a deployment

### Manual Build

```bash
pnpm build
pnpm start
```

The production build outputs to `.next/` and serves on port 3000 by default.
