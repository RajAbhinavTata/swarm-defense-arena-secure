# Swarm Defense Arena Secure

A hardened, testable adversarial evaluation arena for browser agents. A Task Agent attempts a browser task while a Red-Team Agent injects prompt overrides, deceptive controls, diversions, and synthetic exfiltration bait. Every run produces screenshots, structured events, policy decisions, risk evidence, a verdict, replay data, and exports.

This repository is a clean-history, security-focused rebuild of [saivinjam2/awskriothreatsim](https://github.com/saivinjam2/awskriothreatsim). It retains the visual arena and synthetic scenarios while replacing unsafe runtime boundaries and repairing evaluation logic.

## What is different

- Safe-by-default target validation blocks private, loopback, link-local, reserved, and multicast addresses, including redirected subresources.
- External targets require HTTPS. Localhost is allowed only when the application itself is accessed locally.
- Non-local API access is denied unless `SENTINEL_API_TOKEN` is configured.
- Run creation has same-origin enforcement, rate limits, and a bounded in-process queue.
- Session files are written atomically and screenshots live outside `public/`, behind a validated API route.
- Password and secret-like typed values are redacted from traces.
- Unsafe typing is evaluated before browser input is executed.
- Difficulty again means 6, 8, or 10 steps; abort decisions terminate immediately.
- Rule-based live-web policies can search, select relevant safe controls, scroll, and extract.
- Task success no longer treats merely reaching a search-results page as adding an item to a cart.
- Tests, strict linting, type checking, production builds, and GitHub Actions are first-class.

## Architecture

```text
Next.js UI/API
  ├─ validated start request
  ├─ access + same-origin + rate controls
  ├─ bounded run queue
  └─ atomic local session store
             │
             ▼
      Playwright runner
  ├─ outbound network guard
  ├─ visible DOM summarizer
  ├─ task/red-team policies
  ├─ action safety classifier
  ├─ trace redaction
  └─ evidence-based outcomes
             │
             ▼
 Arena · History · Replay · Dataset · Exports
```

The bundled queue and JSON store are intentionally optimized for one trusted workstation. A multi-user deployment should replace them with a durable queue, isolated workers, object storage, and a database.

## Requirements

- Node.js 20.11+
- pnpm 11
- Playwright Chromium

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.local.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

LLM-backed modes are optional. Without provider keys, red-team planning falls back to deterministic adaptive behavior; strict `llm-policy` task runs abort safely when no valid LLM plan is available.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` | Optional OpenAI policy access | unset |
| `ANTHROPIC_API_KEY` | Optional Anthropic policy access | unset |
| `SENTINEL_API_TOKEN` | Required Bearer token for non-local API access | unset |
| `SENTINEL_ALLOW_PRIVATE_TARGETS` | Explicitly permit private-network browser targets | `false` |
| `SENTINEL_MAX_CONCURRENT_RUNS` | Chromium concurrency, clamped to 1–8 | `2` |
| `SENTINEL_MAX_RUNS_PER_MINUTE` | Per-client start rate | `6` |
| `SENTINEL_NAVIGATION_TIMEOUT_MS` | Initial navigation timeout | `30000` |
| `SENTINEL_LLM_TIMEOUT_MS` | Provider request timeout | `12000` |

Do not enable private targets on an internet-accessible process. See [SECURITY.md](SECURITY.md).

## Commands

```bash
pnpm dev          # development server
pnpm test         # unit and security regression tests
pnpm lint         # strict ESLint
pnpm typecheck    # TypeScript without emitting
pnpm build        # production build
pnpm check        # all verification steps
pnpm seed         # deterministic sample sessions
```

## Routes

- `/configure` — configure a live-web duel
- `/arena/[gameId]` — live viewport, threat HUD, and agent feeds
- `/history` and `/history/[gameId]` — run list and replay
- `/dataset` — flattened session exploration
- `/finish/[gameId]` — match summary
- `/scenarios/shop`, `/scenarios/travel`, `/scenarios/help` — deterministic local targets
- `/api/sentinel/*` — validated run, session, artifact, metric, and export APIs

## Evaluation boundaries

This is an evaluation harness, not proof that an agent is safe. Deterministic scenario completion has authoritative page state. Arbitrary live-web information tasks necessarily use weaker evidence and should be reviewed through their trace. Scores are comparable only when target, task, policy, model, and configuration are held constant.

Use synthetic accounts and non-sensitive tasks. Even with redaction, screenshots and page text can contain private information.

## Project status

The production build and automated checks are required in CI. Local JSON storage and the in-process queue are deliberate single-host constraints, documented rather than hidden. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution rules.

## Attribution and licensing

This refactor derives from the public `saivinjam2/awskriothreatsim` repository. The upstream repository did not include an explicit license when this refactor was created, so this repository does not assert a new license over upstream-derived material. Obtain permission from the relevant copyright holders before redistribution or reuse.
