# Contributor notes

A Google ADK agent (Python) behind FastAPI, with a Vite + React frontend. Nothing here depends on
Next.js.

## Layout

- `backend/` — FastAPI app (`main.py`) serving the ADK agent at `backend/agents/wc26_chat/`. Python,
  its own `.venv/` and `requirements.txt`. All 7 tools in `backend/agents/wc26_chat/tools.py` answer
  from the real, final 2026 tournament data in `backend/agents/wc26_chat/data.py` (see that module's
  docstring for how it was generated, and the scripts in `backend/scripts/` and `frontend/scripts/`).
- `frontend/` — Vite + React + TypeScript + Tailwind SPA, routed with `react-router-dom`. Its own
  `package.json`; run with Bun.
- `lib/` and `hooks/` — the original TypeScript domain logic (Bradley-Terry predictions, standings,
  tournament schedule, ESPN result fetching, bracket arena) and a couple of framework-agnostic React
  hooks. Not run directly by either app yet — kept as the reference implementation to port into
  `backend/` (Python) and to pull widget-heavy frontend pieces (the circular bracket, arena UI) from
  as those get rebuilt in `frontend/`. The root `package.json` exists only to typecheck and run this
  directory's own scripts (`arena`, `sync:markets`); it is not the app.

## Package managers

- `frontend/`: Bun. Install with `bun install` and run scripts with `bun run <script>`.
- `backend/`: pip inside `backend/.venv`. Activate it, then `pip install -r requirements.txt`.
- Root (`lib/`/`hooks/` reference code only): Bun, same as above.
- Never use npm, pnpm, or yarn for the JS/TS projects.

## Code style

- Keep code, comments, and docs in English, and prefer the simplest useful implementation.
- Don't over-comment. When names are clear and a function is small with a single responsibility,
  the code is its own explanation — add a comment only to capture the non-obvious _why_ (a subtle
  invariant, a workaround, an intentional edge case), never to restate _what_ the code does.
- Keep comments short — a line or two. If a comment needs a paragraph, the naming or structure
  probably needs the work instead.
- Never nest ternaries. When a branch needs its own branching, use a helper function or an `if`
  instead.
- TypeScript: import local modules through the `@/*` path alias. Merge `className` values with `cn`
  from [`cnfast`](https://github.com/aidenybai/cnfast) instead of template literals or ternaries —
  e.g. `cn("dark", isActive && "px-4")`.
- Python: type-hint every tool parameter with `Annotated[T, Field(description=...)]` — ADK derives
  the model-facing schema from type hints, not from docstring `Args:` sections. The function's
  docstring becomes the tool's own description verbatim.

## Frontend component organization

- `frontend/src/components/ui/` — generic, shadcn-like primitives with no domain knowledge (e.g.
  `Notice`, `Popover`).
- `frontend/src/components/` — higher-level, app-specific components (e.g. `header.tsx`).
- `frontend/src/pages/` — one component per route.
