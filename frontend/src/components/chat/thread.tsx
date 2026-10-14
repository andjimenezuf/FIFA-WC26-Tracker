import { cn } from "cnfast";
import { useState } from "react";
import type { ChatMessage, ChatStatus } from "@/hooks/use-chat";
import { BallIcon } from "@/components/icons";
import { Markdown } from "@/components/ui/markdown";
import { Bubble, Message, MessageAvatar } from "@/components/ui/message";

// TODO(widgets): the eve-era thread parsed fenced code blocks in assistant
// text (```chances, ```match, …) into rich widgets fed by live predictions
// data. Until that data exists in this backend, a fenced block just renders
// as a plain code block via Markdown/Streamdown — honest, not broken.

const isBusy = (status: ChatStatus) =>
  status === "submitted" || status === "streaming";

export function Thread({
  messages,
  status,
}: {
  messages: ChatMessage[];
  status: ChatStatus;
}) {
  const busy = isBusy(status);
  const lastAssistant = messages.findLast((m) => m.role === "assistant");
  const awaitingReply = busy && lastAssistant && !lastAssistant.text.trim();

  return (
    <div className="flex flex-col gap-6">
      {messages.map((message, index) =>
        message.role === "user" ? (
          <Message
            key={message.id}
            align="end"
            className="animate-fade-up"
            style={fadeDelay(index)}
          >
            <Bubble>{message.text}</Bubble>
          </Message>
        ) : (
          <AssistantRow
            key={message.id}
            message={message}
            index={index}
            streaming={busy && message === lastAssistant}
            showActivity={Boolean(awaitingReply && message === lastAssistant)}
          />
        ),
      )}
    </div>
  );
}

function AssistantRow({
  message,
  index,
  streaming,
  showActivity,
}: {
  message: ChatMessage;
  index: number;
  streaming: boolean;
  showActivity: boolean;
}) {
  const [animateEntrance] = useState(() => !streaming);

  return (
    <Message
      align="start"
      className={cn(animateEntrance && "animate-fade-up")}
      style={animateEntrance ? fadeDelay(index) : undefined}
    >
      <MessageAvatar streaming={streaming}>
        <BallIcon className="size-[18px]" />
      </MessageAvatar>
      <Bubble variant="ghost">
        {showActivity ? (
          <Activity label="Thinking…" />
        ) : message.richContent ? (
          message.richContent
        ) : (
          <Markdown>{message.text}</Markdown>
        )}
      </Bubble>
    </Message>
  );
}

const fadeDelay = (index: number) => ({
  animationDelay: `${Math.min(index, 6) * 30}ms`,
});

function Activity({ label }: { label: string }) {
  return (
    <div className="flex min-h-7 items-center text-sm leading-snug">
      <span className="wc-shimmer">{label}</span>
    </div>
  );
}
