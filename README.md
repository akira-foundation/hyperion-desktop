# Hyperion

Desktop-first AI content OS. One prompt, one source, many platform-ready assets. Rendered locally, no cloud required.

Hyperion is a native desktop application built on [Wails v2](https://wails.io). It combines a Go backend with a React frontend to let creators, developers, and teams turn raw content (commits, release notes, text, images) into captioned, pixel-perfect PNGs ready for X, LinkedIn, Instagram, and any other platform, without leaving the machine.

---

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Wails v2](https://wails.io) (Go + WebView) |
| Backend | Go 1.25 |
| AI drivers | Anthropic Messages API, OpenAI Responses API |
| Renderer | [go-rod](https://go-rod.github.io) (headless Chromium) |
| Database | SQLite via `modernc.org/sqlite` (CGO-free) |
| Frontend | React 19, TypeScript, Vite 6, Bun |
| Routing | TanStack Router (file-based) |
| State | TanStack Query, Zustand |
| UI | Tailwind v4, shadcn/ui |
| Forms | React Hook Form + Zod |

## Architecture

The backend follows a strict layered layout:

```
internal/
  domain/         # pure types and business rules
  ports/          # interface contracts (renderer, AI provider, etc.)
  application/    # use-case services (draft, template, export, …)
  infrastructure/ # storage, SQLite, settings, asset server
  drivers/        # swappable implementations (anthropic, openai, rod, …)
```

All AI providers, image generators, and renderers are registered through driver registries. Swapping a provider means dropping a new implementation behind the existing port interface.

The frontend lives under `frontend/src/` and communicates with Go exclusively through Wails-generated bindings (`frontend/wailsjs/`):

```
frontend/src/
  features/     # page-level feature modules (drafts, generate, templates, …)
  templates/    # React components used for rendering (one folder per template ID)
  components/   # shared UI primitives
  services/     # thin wrappers over Wails bindings
  stores/       # Zustand stores
  routes/       # TanStack Router route files
```

---

## Prerequisites

- [Go 1.25+](https://go.dev/dl/)
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`

## Quickstart

```bash
git clone https://github.com/akira-io/hyperion-desktop.git
cd hyperion-desktop
wails dev
```

`wails dev` boots the Go backend, installs frontend dependencies via Bun, and starts a Vite dev server with hot reload. The desktop window opens automatically.

A browser dev surface is also available at `http://localhost:34115` for inspecting Wails bindings from browser devtools.

---

## Build

Produce a redistributable native binary:

```bash
wails build
```

The output lands in `build/bin/`.

### Per-platform notes

**macOS**: builds a `.app` bundle. Universal binary (arm64 + amd64) with:

```bash
wails build -platform darwin/universal
```

**Linux**: requires `libgtk-3-dev` and `libwebkit2gtk-4.0-dev` (or `4.1`):

```bash
sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev   # Debian / Ubuntu
wails build -platform linux/amd64
```

**Windows**: uses the system WebView2 runtime (ships with Windows 11; auto-installs on Windows 10). Build from Windows or cross-compile:

```bash
wails build -platform windows/amd64
```

---

## Roadmap

Phased delivery plan, template registry, and cross-cutting decisions: [`docs/00-roadmap.md`](docs/00-roadmap.md).

---

## License

MIT
