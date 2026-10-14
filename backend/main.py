"""FastAPI app serving the wc26_chat ADK agent.

Run with: uvicorn main:app --reload --port 8000
(from inside backend/, with .venv activated)

`get_fast_api_app` builds the whole ADK-serving surface (session management,
/run and /run_sse, the eval endpoints, etc.) from the agents/ directory using
the same {name}/agent.py + root_agent convention as the TS port's `adk web`.
Custom, non-agent routes (e.g. REST endpoints backing the React frontend's
Today/Predictions/Arena pages, once the domain-logic port exists) get added
directly on the returned `app` below.
"""

from pathlib import Path

from google.adk.cli.fast_api import get_fast_api_app

AGENTS_DIR = str(Path(__file__).parent / "agents")

app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    web=False,
    # The Vite dev server's origin — CORS is otherwise closed by default.
    allow_origins=["http://localhost:5173"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
