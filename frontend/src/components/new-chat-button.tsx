import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { recentChatId } from "@/lib/chat-storage";
import { buttonVariants } from "@/components/ui/button";

// The recent last chat is only offered while the conversation is still fresh.
const RECENT_WINDOW_MS = 10 * 60 * 1000;

// Neon yellow — the brand palette's complement to the navbar's blue — rather
// than the default outline styling tuned for a neutral background.
const buttonClass = buttonVariants({
  variant: "outline",
  size: "icon",
  className:
    "sm:w-auto sm:px-2.5 border-black bg-wc-yellow text-black hover:bg-wc-yellow/80 hover:text-black",
});

/** On the home / new-chat page, if a chat was used in the last 10 minutes, this
 *  offers a shortcut back to it; everywhere else (and with no recent chat) it's
 *  the New chat button. Never both. localStorage is client-only, so the recent
 *  chat resolves after mount. */
export function NewChatButton() {
  const { pathname } = useLocation();
  const [recentChat, setRecentChat] = useState<string | null>(null);
  useEffect(() => setRecentChat(recentChatId(RECENT_WINDOW_MS)), [pathname]);

  const onHome = pathname === "/";
  if (onHome && recentChat) {
    return (
      <Link
        to={`/chat/${recentChat}`}
        aria-label="Last chat"
        title="Last chat"
        className={buttonClass}
      >
        <MessageSquare className="size-4" />
        <span className="hidden sm:inline">Last chat</span>
      </Link>
    );
  }

  return (
    <Link to="/" aria-label="New chat" title="New chat" className={buttonClass}>
      <MessageSquarePlus className="size-4" />
      <span className="hidden sm:inline">New chat</span>
    </Link>
  );
}
