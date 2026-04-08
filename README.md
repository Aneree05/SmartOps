# SmartOps - Adaptive Workflow System

SmartOps is a sophisticated frontend built to track project workflows, identify bottlenecks, and monitor team workload through a cinematic, glassmorphic interface.

## Tech Stack
- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS & clsx/tailwind-merge
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Drag & Drop**: @hello-pangea/dnd

## Project Structure

```text
/src
 ├── /components       # Reusable UI elements
 │   ├── GlassCard.jsx # Core glassmorphism wrapper
 │   ├── Sidebar.jsx   # Global navigation
 │   └── Elements.jsx  # Alerts, Skeleton Loaders
 ├── /pages            # Route components
 │   ├── Landing.jsx   # Login page with animated grid
 │   ├── Dashboard.jsx # Top-level stats and charts
 │   ├── Kanban.jsx    # Complete Drag & Drop task board
 │   ├── Analytics.jsx # Deep dive velocity metrics
 │   └── Team.jsx      # Individual workload meters
 ├── /data
 │   └── mockData.js   # Realistic SmartOps dataset
 ├── /utils
 │   └── cn.js         # Tailwind class merger utility
 ├── App.jsx           # Global router & framer-motion setup
 ├── index.css         # Global styles & custom palette variables
 └── main.jsx          # Entry point
```

## Running Locally

1. `npm install`
2. `npm run dev`

The application uses custom design tokens in `tailwind.config.js` to ensure uniform adoption of the required deep `#050d12` theme, cyan accents, and complex glow states.
