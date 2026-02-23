# DPanel

Lightweight desktop VPS management tool over SSH, originally built as a Tauri desktop application. Running as a web frontend in Replit.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite 5
- **UI Libraries**: Mantine v8, Radix UI, Tailwind CSS, Framer Motion
- **Fonts**: Inter (UI), JetBrains Mono (code/monospace)
- **Visualization**: ReactFlow (infrastructure graphs), Recharts (charts)
- **Original Backend**: Tauri (Rust) - not active in Replit environment

## Project Structure

- `src/` - React frontend source
  - `components/` - UI components (Dashboard, Docker, Services, Nginx, Cron, Logs, etc.)
  - `components/layout/` - NavigationRail (sidebar), TopBar (header)
  - `components/ui/` - LoadingScreen, Skeleton
  - `components/config-graph/` - Config dependency graph visualization
  - `components/infrastructure-graph/` - Infrastructure graph visualization
  - `context/` - React context providers (ServerContext, ToastContext)
  - `hooks/` - Custom React hooks
  - `lib/` - Utilities (tauri.ts - isTauri() environment detection)
  - `types/` - TypeScript type definitions
  - `styles/` - CSS styles (modern-theme.css)
- `src-tauri/` - Tauri/Rust backend (not used in Replit)
- `index.html` - Entry point (loads Inter + JetBrains Mono from Google Fonts)

## Running

- Dev server: `npx vite --host 0.0.0.0 --port 5000`
- Build: `npm run build` (outputs to `dist/`)
- Deployment: Static site (dist directory)

## Design System

- **Color Palette**: Deep dark base (#0a0a0f), blue accent (#3b82f6), cyan accent (#06b6d4), gradient combos
- **Primary Color**: Blue (Mantine primaryColor), used for buttons, active states, focus rings
- **Glass Effects**: Cards use `backdrop-filter: blur` with semi-transparent backgrounds (`.glass-card`, `.glass-card-glow`)
- **Buttons**: Gradient (blue-to-cyan) for primary actions, outlined with glow for secondary (`.btn-gradient`, `.btn-outline-glow`)
- **Animations**: Animated border glow, status pulse, text shimmer, float, fade-in
- **NavigationRail**: Left-edge gradient accent bar for active item, gradient icon background, expand-on-hover
- **TopBar**: Gradient line separator, glassmorphism search bar, pulse animation on status indicator

## Key Design Decisions

- `src/lib/tauri.ts` exports `isTauri()` to detect the Tauri runtime. All components that call `invoke()` on mount/intervals guard with this function to prevent error spam in the web environment.
- ServerContext provides a `disconnect()` function that resets connection state and invalidates caches.
- Non-functional TopBar elements (search, notifications, settings) show "coming soon" tooltips.
- Mantine theme in `main.tsx` configures global component overrides for consistent styling (Button, Paper, TextInput, etc.)

## Notes

- The app uses `@tauri-apps/api` for IPC with the Rust backend. In the web environment, these calls are guarded by `isTauri()` checks.
- The frontend renders and displays the UI correctly but server management features require the Tauri backend.
