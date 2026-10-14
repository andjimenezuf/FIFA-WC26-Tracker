import { Clock, TriangleAlert } from "lucide-react";
import type { ChatStatus } from "@/hooks/use-chat";
import { Notice } from "@/components/ui/notice";

function isRateLimited(error: Error | undefined): boolean {
  if (!error) return false;
  return /\b429\b|rate limit|too many requests/i.test(error.message);
}

/** Picks the right notice for the current turn state, or nothing. Never
 *  echoes the raw error (e.g. "Failed to fetch") — that's a technical detail,
 *  not something a visitor needs to read. */
export function ChatNotice({
  status,
  error,
}: {
  status: ChatStatus;
  error: Error | undefined;
}) {
  if (status !== "error") return null;
  return isRateLimited(error) ? (
    <Notice icon={Clock} tone="amber">
      You're sending messages quickly. Take a short break and try again in a
      moment.
    </Notice>
  ) : (
    <Notice icon={TriangleAlert} tone="red">
      Couldn't reach the agent. Try again in a moment.
    </Notice>
  );
}
