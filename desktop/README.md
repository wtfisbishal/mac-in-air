# Electron + Next.js + TypeScript

A production-ready Electron desktop application powered by **Next.js** and **TypeScript**.

## Project Structure

```
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App entry point, window creation
│   │   └── preload.ts     # Secure bridge between main & renderer
│   └── renderer/          # Next.js frontend (renderer process)
│       ├── app/
│       │   ├── layout.tsx  # Root layout
│       │   ├── page.tsx    # Home page
│       │   └── globals.css # Global styles
│       └── types/
│           └── electron.d.ts  # Type declarations for electronAPI
├── dist/                  # Compiled output (gitignored)
│   ├── main/              # Compiled Electron main process
│   └── renderer/          # Static Next.js export
├── release/               # Packaged app binaries (gitignored)
├── package.json
├── tsconfig.json          # Next.js / renderer TypeScript config
├── tsconfig.main.json     # Electron main process TypeScript config
├── next.config.ts         # Next.js configuration (static export)
└── electron-builder.yml   # Packaging configuration
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development (Next.js dev server + Electron)
npm run dev

# Build for production
npm run build

# Package the app
npm run package          # current platform
npm run package:mac      # macOS
npm run package:win      # Windows
npm run package:linux    # Linux
```

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Main Process | Electron + TypeScript | Window management, native APIs, IPC |
| Preload | Electron contextBridge | Secure API bridge (contextIsolation) |
| Renderer | Next.js + React + TypeScript | UI, routing, components |
| Packaging | electron-builder | Cross-platform distribution |

## Security

- `contextIsolation: true` — renderer cannot access Node.js directly
- `nodeIntegration: false` — no `require()` in renderer
- `sandbox: true` — renderer process runs in a sandbox
- IPC via `contextBridge.exposeInMainWorld` — explicit, typed API surface
