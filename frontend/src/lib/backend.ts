export const BACKEND_URL: string =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

// Defaults to off: the 2026 World Cup is over and this snapshot has no
// backend deployed, so live chat would only fail. Set
// VITE_CHAT_ENABLED=true in frontend/.env.local (with an OpenRouter key
// configured for the backend) to turn the live agent back on.
export const CHAT_ENABLED: boolean =
  (import.meta.env.VITE_CHAT_ENABLED ?? "false") === "true";

// The wc26_chat agent's app_name in the ADK agents_dir (backend/agents/wc26_chat/).
export const APP_NAME = "wc26_chat";

const USER_ID_KEY = "wc26-user-id";

/** A stable per-browser id ADK's session store partitions sessions under.
 *  There's no login, so one random id generated on first visit is enough. */
export function getUserId(): string {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    // Private browsing or storage disabled — fall back to a per-tab id.
    return "anonymous";
  }
}
