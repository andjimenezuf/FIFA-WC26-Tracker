// Pure localStorage bookkeeping for chat navigation: which chat was used
// last (NewChatButton), and a message typed on the home page that ChatPage
// picks up and sends once it mounts (startNewChat / consumePendingMessage).

const PREFIX = "wc26-chat:";
const LAST_KEY = "wc26-chat-last";

interface SavedChat {
  savedAt: number;
  pendingMessage?: string;
}

function loadChat(id: string): SavedChat | null {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + id) ?? "null");
  } catch {
    return null;
  }
}

function saveChat(id: string, chat: SavedChat): void {
  try {
    localStorage.setItem(PREFIX + id, JSON.stringify(chat));
    localStorage.setItem(LAST_KEY, id);
  } catch {
    // Private browsing or storage disabled — best-effort only.
  }
}

/** The most recently used chat id, but only if it was used within `maxAgeMs`. */
export function recentChatId(maxAgeMs: number): string | null {
  try {
    const id = localStorage.getItem(LAST_KEY);
    if (!id) return null;
    const chat = loadChat(id);
    return chat && Date.now() - chat.savedAt < maxAgeMs ? id : null;
  } catch {
    return null;
  }
}

/** Starts a new conversation: mints an id, stashes `message` for ChatPage to
 *  send once mounted, and returns the id to navigate to (`/chat/<id>`). */
export function startNewChat(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;
  const id = crypto.randomUUID().slice(0, 8);
  saveChat(id, { savedAt: Date.now(), pendingMessage: trimmed });
  return id;
}

/** Reads and clears the pending first message for `id`, if any — call once,
 *  on mount, so a remount or re-render never re-sends it. */
export function consumePendingMessage(id: string): string | null {
  const chat = loadChat(id);
  if (!chat?.pendingMessage) return null;
  saveChat(id, { ...chat, pendingMessage: undefined });
  return chat.pendingMessage;
}
