import { type ReactNode, useCallback, useRef, useState } from "react";
import {
  ensureSession,
  hasFunctionCall,
  streamRun,
  textOf,
} from "@/lib/adk-client";
import { TournamentWrapUp } from "@/components/widgets/tournament-wrapup";
import { CHAT_ENABLED } from "@/lib/backend";
import { answerOffline } from "@/lib/offline-chat";

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  done: boolean;
  /** When set, Thread renders this instead of markdown-rendering `text` —
   *  used for the tournament-wrap-up greeting, which needs real flags. */
  richContent?: ReactNode;
}

const WRAPUP_VARIANTS = 4;

// A fresh-mounted hook has no history yet, so this always fires exactly
// once per chat: there's no session-history fetch (see ChatPage's own TODO
// about reload losing the conversation), so every mount is effectively a
// new chat today.
function greeting(): ChatMessage {
  const variant = Math.floor(Math.random() * WRAPUP_VARIANTS);
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    text: "",
    done: true,
    richContent: <TournamentWrapUp variant={variant} />,
  };
}

/** One conversation against the wc26_chat ADK agent, addressed by `sessionId`
 *  (the /chat/<id> route param doubles as the ADK session id). */
export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greeting()]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const sessionReady = useRef<Promise<void> | null>(null);

  // Lazily create the session on the first send, and re-attempt on the next
  // send if that failed rather than sticking with a rejected promise forever.
  const getSessionReady = useCallback(() => {
    if (!sessionReady.current) {
      sessionReady.current = ensureSession(sessionId).catch((err) => {
        sessionReady.current = null;
        throw err;
      });
    }
    return sessionReady.current;
  }, [sessionId]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "submitted" || status === "streaming") return;

      if (!CHAT_ENABLED) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", text: trimmed, done: true },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: answerOffline(trimmed),
            done: true,
          },
        ]);
        return;
      }

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: trimmed, done: true },
        { id: assistantId, role: "assistant", text: "", done: false },
      ]);
      setStatus("submitted");
      setError(undefined);

      const controller = new AbortController();
      abortRef.current = controller;

      // ADK streams partial (delta) text chunks, then one non-partial event
      // per text segment carrying that segment's full accumulated text (see
      // adk-client.ts) — `committed` holds finished segments, `live` the
      // in-flight one.
      let committed = "";
      let live = "";
      const applyText = () => {
        const value = committed + live;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: value } : m)),
        );
      };
      const finish = () =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, done: true } : m)),
        );

      try {
        await getSessionReady();
        for await (const event of streamRun(
          sessionId,
          trimmed,
          controller.signal,
        )) {
          if (event.author === "user") continue;
          if (event.errorMessage) throw new Error(event.errorMessage);

          const chunk = textOf(event);
          if (chunk) {
            setStatus("streaming");
            if (event.partial) live += chunk;
            else {
              committed += chunk;
              live = "";
            }
            applyText();
          } else if (hasFunctionCall(event)) {
            setStatus("streaming");
          }
        }
        finish();
        setStatus("ready");
      } catch (err) {
        finish();
        if (controller.signal.aborted) {
          setStatus("ready");
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      } finally {
        abortRef.current = null;
      }
    },
    [sessionId, status, getSessionReady],
  );

  // Deliberately not tied to unmount: React StrictMode's dev-only double-invoke
  // of effects would abort the very first send before its request ever left
  // the browser, and even outside StrictMode a remount mid-turn (e.g. a route
  // re-render) shouldn't silently kill a reply the user is waiting on. `stop`
  // is wired only to the composer's explicit "Stop generating" button.
  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { messages, status, error, send, stop };
}
