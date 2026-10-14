import { APP_NAME, BACKEND_URL, getUserId } from "@/lib/backend";

// ADK's Python models serialize with camelCase aliases — confirmed by hand
// against a running backend this session (POST /run with a camelCase body
// reached the agent; GET a session returned {appName, userId, lastUpdateTime}
// camelCased back). Response Event fields below follow the same convention,
// but haven't been exercised against a real Gemini reply yet (no API key in
// this environment) — worth a live smoke test once one's available.

export interface AdkPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response?: unknown };
}

export interface AdkContent {
  role?: string;
  parts?: AdkPart[];
}

export interface AdkEvent {
  id: string;
  author: string;
  content?: AdkContent;
  partial?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

function sessionUrl(sessionId: string): string {
  return `${BACKEND_URL}/apps/${APP_NAME}/users/${getUserId()}/sessions/${sessionId}`;
}

/** Makes sure `sessionId` exists on the backend, creating it with that exact
 *  id if it doesn't (a fresh id from the client, e.g. a new /chat/<id> route).
 *  Seeds the session's initial state with the browser's IANA time zone — the
 *  system prompt and `convert_time`'s own docstring both assume "the user's
 *  IANA zone is in the client context"; this is that context. */
export async function ensureSession(sessionId: string): Promise<void> {
  const existing = await fetch(sessionUrl(sessionId));
  if (existing.ok) return;

  const created = await fetch(
    `${BACKEND_URL}/apps/${APP_NAME}/users/${getUserId()}/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        state: {
          client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    },
  );
  if (!created.ok) {
    throw new Error(`Failed to create session (${created.status})`);
  }
}

/** Sends one user message and streams the agent's reply as ADK Events over
 *  SSE. EventSource can't do POST bodies, so this parses `text/event-stream`
 *  by hand off a fetch ReadableStream instead. */
export async function* streamRun(
  sessionId: string,
  text: string,
  signal?: AbortSignal,
): AsyncGenerator<AdkEvent> {
  const response = await fetch(`${BACKEND_URL}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      appName: APP_NAME,
      userId: getUserId(),
      sessionId,
      newMessage: { role: "user", parts: [{ text }] },
      streaming: true,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Backend error ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const dataLine = rawEvent
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json) continue;
      yield JSON.parse(json) as AdkEvent;
    }
  }
}

export function textOf(event: AdkEvent): string {
  return (event.content?.parts ?? []).map((part) => part.text ?? "").join("");
}

export function hasFunctionCall(event: AdkEvent): boolean {
  return (event.content?.parts ?? []).some((part) => part.functionCall);
}
