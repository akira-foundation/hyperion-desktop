# Implementation Roadmap

Phased delivery plan for Hyperion. Each phase ships a working slice. MVP = Phases 1–7. Cloud/auto-publish post-MVP.

## Audience & vertical scope

Hyperion is a **universal AI-powered content OS** — not dev-only. The platform serves:
creators, founders, developers, photographers, designers, agencies, marketers, educators, content creators, brands.

Architecture, templates, and workflows must remain niche-agnostic. Developer-related sources
(GitHub, changelogs, releases) are one of many supported workflows, not the default. The template
registry, AI hints, and content pipelines must support every vertical without coupling.

### Template vertical plan (rolling)

| Category | Template ID | Purpose | Status |
|---|---|---|---|
| Storytelling | `quote-card` | Typographic quote w/ author/source | shipped |
| Developer | `changelog-card` | Release notes / version updates | shipped |
| Photography | `photo-showcase` | Image showcase w/ EXIF / caption | planned |
| Marketing | `product-launch` | SaaS/startup launch announcement | planned |
| Education | `lesson-card` | Course/tutorial snippet | planned |
| Personal | `portfolio-cover` | Designer/creator portfolio piece | planned |
| Storytelling | `story-vertical` (9:16) | Universal vertical story format | planned |
| Marketing | `linkedin-card` (1.91:1) | LinkedIn-optimized horizontal | planned |

---

## Phase 1 — Foundation (DONE)

Scope: project scaffold.

- Wails v2 + Go 1.25 + React 19 + Bun + Tailwind v4 + shadcn/ui
- Go layout: `domain` / `ports` / `application` / `infrastructure` / `drivers`
- Frontend: TanStack Router (file-based) + Query + Table, Zustand, RHF + Zod, usehooks-ts
- modernc.org/sqlite (CGO-free), schema bootstrap
- macOS Tahoe-style floating sidebar, brand identity (Hexagon + emerald), app icon
- 11 placeholder routes wired

---

## Phase 2 — Drafts CRUD + AI Generation (real)

Goal: user types a prompt, gets a draft saved locally.

### Backend
- `internal/drivers/ai/anthropic`: real HTTP impl (Messages API, prompt caching enabled)
- `internal/drivers/ai/openai`: real HTTP impl (Responses or Chat Completions)
- `internal/infrastructure/keychain`: macOS Keychain wrapper (`github.com/zalando/go-keyring`)
- `internal/application/settings_service`: get/set provider API keys
- Expose Wails bindings: `GenerateContent(provider, prompt, model)`, `SaveAPIKey(provider, key)`, `GetProviderConfig()`
- Default model registry per provider (`claude-opus-4.7`, `gpt-5.1`, …)

### Frontend
- TanStack Query mutations + queries wrapping Wails bindings
- `features/drafts/`: list, create, edit, delete
- `features/generate/`: prompt input, provider/model picker, output preview, “Save as draft”
- `features/settings/`: API key inputs (masked), provider toggle, default model
- Drafts route loads real data; SidebarItem `Drafts` count reflects DB

### Tests
- Go: AI driver unit tests with HTTP fakes (`httptest.NewServer`)
- Pest-equivalent for Go (`testing`), parity tests for SQLite repo

### Done when
Generate prompt → AI response → save → see in drafts list across restart.

---

## Phase 3 — Templates + HTML Rendering

Goal: deterministic PNG asset rendering from React templates.

### Decisions
- Render via **go-rod** (headless Chromium, single binary, no Playwright dep)
- Templates are React components served by an internal asset server bundle
- Render flow: Go boots ephemeral Chromium tab → loads `internal://template/<id>?props=…` → screenshots viewport

### Backend
- `internal/domain/template`: `Template{ID, Name, AspectRatio, PropsSchema}`
- `internal/ports/renderer.go`: `Render(ctx, templateID, props, size) ([]byte /*png*/, error)`
- `internal/drivers/renderer/rod`: go-rod impl, viewport-locked, font-loaded wait
- Template registry seeded with 4 starters:
  - `tweet-card` (1080×1080)
  - `linkedin-card` (1200×627)
  - `story` (1080×1920)
  - `changelog-square` (1080×1080)
- Endpoint via Wails asset handler: `/__template/<id>` returns React shell

### Frontend
- `templates/` route: gallery, click → live preview pane
- Template components live under `frontend/src/templates/<id>/` with a `meta.ts` (id, ratio, schema, defaultProps)
- Preview uses iframe sandbox to match render env
- “Render PNG” button → calls Wails → saves to renders table + disk

### Done when
Pick template → tweak props → render → PNG saved + visible in `/renders`.

---

## Phase 4 — Content Pipeline (one input → many outputs)

Goal: a single source produces multi-platform variants automatically.

### Backend
- `internal/domain/pipeline`: `Pipeline{Source, Variants[]VariantSpec}`
- `internal/application/pipeline_service`: orchestrates AI calls + rendering
- Tone presets (registry): `professional`, `casual`, `launch`, `changelog`
- VariantSpec maps `Platform` → `Template` + `Prompt template` + `MaxLength`

### Frontend
- `generate` page upgraded: select source → tone → platforms → preview all variants in a grid
- Bulk render all variants → ZIP bundle ready
- Variant editor (override copy per platform before render)

### Done when
One input + “generate for X/LinkedIn/Bluesky” yields three captioned PNGs in one action.

---

## Phase 5 — Content Sources (drivers)

Goal: pull real content from external sources.

### Drivers (in order)
1. **Markdown driver** — local folder watcher, parse frontmatter, list entries
2. **GitHub driver** — read-only: commits, releases, PRs, issues. OAuth device flow stored in Keychain
3. **Manual input** — already covered by Phase 2

### Backend
- `internal/ports/content_source.go`: `ListItems(ctx) ([]Item, error)`, `Subscribe(ctx) (<-chan Event, error)` for live updates
- `internal/drivers/content/markdown`: filewatcher (`fsnotify`)
- `internal/drivers/content/github`: REST client w/ ETags, rate-limit aware
- Inbox = aggregated recent items from all active sources

### Frontend
- `inbox` route: feed of recent items, “Generate from this” CTA → pre-fills `generate`
- `sources/github` route: connect button (device-flow), repo picker
- `sources/markdown` route: folder picker (Wails `runtime.OpenDirectoryDialog`)

### Done when
New commit/release in connected repo shows in inbox; one click drafts a release announcement.

---

## Phase 6 — Export + Manual Publish

Goal: get assets out of Hyperion and into the user’s hands.

### Backend
- `internal/application/export_service`: ZIP bundle (`renders/*.png` + `captions/*.txt` + `meta.json`)
- Clipboard helpers (image + text) via `golang.design/x/clipboard`

### Frontend
- “Copy caption”, “Copy image”, “Export ZIP”, “Reveal in Finder”
- Per-platform export presets (e.g., X caption + image only; LinkedIn caption + carousel-ready PNGs)

### Done when
User can ship a campaign: open generated set → copy/export → publish manually in browser.

---

## Phase 7 — Polish & Onboarding

- Cmd+K command palette (TanStack-based or `cmdk`)
- Keyboard shortcuts (toggle sidebar, new draft, focus search)
- Theme store wired end-to-end (light/dark/system)
- First-run wizard: pick provider, paste API key, pick a template, render demo
- Settings panes: general, providers, sources, advanced
- Error boundaries + toast system (Sonner)
- Logging: structured logs to `~/Library/Logs/Hyperion/`

### Done when
A fresh installer → onboarding → first render in under 90 seconds, no docs needed.

---

## Phase 8 — Cloud + Auto-Publish (post-MVP)

Separate repo: `akira-foundation/hyperion-cloud` (Laravel 12 + Inertia + React).

- Auth + subscriptions (Cashier / Paddle)
- AI credits ledger (alternative to BYOK)
- Sync engine: drafts + renders + schedules upload via S3/R2
- Publishing drivers (real OAuth): X, Bluesky, Mastodon, LinkedIn
- Horizon queue: publish jobs, retries
- Reverb: realtime sync/publish status
- Desktop side: sync queue with offline-first, conflict-safe replay

---

## Cross-cutting

- **Testing**: Go `testing` for backend, Pest-equivalent (Playwright) for frontend E2E once Phase 3 lands
- **CI**: GitHub Actions matrix (macOS + Windows + Linux) for `wails build` once Phase 2 done. Use Akira release pipeline skill.
- **Releases**: tag-driven (`vX.Y.Z`), DigitalOcean Spaces channel layout (per skill)
- **Telemetry**: opt-in, anonymous, local first (no PII)
- **Security**: API keys live only in Keychain, never SQLite. OAuth tokens same. Memory-zeroed on quit.

---

## Branching strategy

- `main` = always green, releasable
- Phase branches: `phase/02-ai-generation`, `phase/03-rendering`, …
- Feature branches inside a phase: `feat/02-anthropic-driver`, `feat/02-keychain`, …
- PRs from feature → phase branch; phase → main when phase exit criteria met

---

[Index](.) · [Architecture →](./01-architecture.md)
