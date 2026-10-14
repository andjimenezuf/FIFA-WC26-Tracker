import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatNotice } from "@/components/chat/chat-notice";
import { Thread } from "@/components/chat/thread";
import { Composer } from "@/components/composer";
import { MessageScroller } from "@/components/ui/message-scroller";
import { useChat } from "@/hooks/use-chat";
import { consumePendingMessage } from "@/lib/chat-storage";

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) throw new Error("ChatPage rendered without a :id route param");
  return <Chat id={id} />;
}

/** One conversation, addressed as /chat/<id>. Split from ChatPage so `id` is
 *  a plain prop `useChat`/effects can key off, instead of `string | undefined`. */
function Chat({ id }: { id: string }) {
  const chat = useChat(id);
  const [input, setInput] = useState("");
  const sentPending = useRef(false);

  // A message typed on the home page (see HomePage.tsx / chat-storage.ts)
  // arrives here as a pending send — deliver it once, on mount.
  useEffect(() => {
    if (sentPending.current) return;
    sentPending.current = true;
    const pending = consumePendingMessage(id);
    if (pending) void chat.send(pending);
    // Intentionally keyed on `id` alone — `chat.send`'s identity changes with
    // `status`, and the `sentPending` ref already makes re-running a no-op.
  }, [id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageScroller>
        {chat.messages.length > 0 && (
          <Thread messages={chat.messages} status={chat.status} />
        )}
      </MessageScroller>
      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => {
          void chat.send(input);
          setInput("");
        }}
        onStop={chat.stop}
        status={chat.status}
        notice={<ChatNotice status={chat.status} error={chat.error} />}
      />
    </div>
  );
}
