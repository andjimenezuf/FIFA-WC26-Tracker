import { cn } from "cnfast";
import { ArrowUp, Square } from "lucide-react";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChatStatus } from "@/hooks/use-chat";
import { BallIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CHAT_ENABLED } from "@/lib/backend";

const isBusy = (status: ChatStatus) =>
  status === "submitted" || status === "streaming";

/** Send / stop control. On send it plays a launch animation: the up-arrow
 *  becomes a soccer ball that kicks up and out of the top of the button. */
function SubmitButton({
  status,
  canSend,
  launching,
  onStop,
}: {
  status: ChatStatus;
  canSend: boolean;
  launching: boolean;
  onStop: () => void;
}) {
  if (isBusy(status) && !launching) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        onClick={onStop}
        aria-label="Stop generating"
        className="wc-pop shrink-0 rounded-xl"
      >
        <Square className="size-3.5 fill-current" />
      </Button>
    );
  }

  return (
    <button
      type="submit"
      disabled={!canSend && !launching}
      aria-label="Send message"
      data-launching={launching}
      className={cn(
        // Border is always the brand violet; the fill inverts once there's
        // something to send — violet fill with a white arrow, instead of an
        // outline with a violet arrow.
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-wc-violet transition-all duration-150",
        canSend || launching
          ? "bg-wc-violet text-white hover:opacity-90 active:scale-95"
          : "cursor-not-allowed bg-transparent text-wc-violet",
      )}
    >
      <ArrowUp className="wc-send-arrow size-[18px]" />
      <BallIcon className="wc-send-ball absolute inset-0 m-auto size-[17px]" />
    </button>
  );
}

/** The pinned bottom bar: an optional notice, the prompt input, and the footer. */
export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  status,
  notice,
  autoFocus = true,
  disabled = false,
  placeholder = "Ask about the 2026 World Cup…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  status: ChatStatus;
  notice?: ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const launchTimer = useRef<number | null>(null);
  const [launching, setLaunching] = useState(false);
  const canSend = value.trim().length > 0 && !isBusy(status) && !disabled;

  useEffect(
    () => () => {
      if (launchTimer.current) window.clearTimeout(launchTimer.current);
    },
    [],
  );

  // Focus on mount — but only on fine-pointer devices; on touch, focusing pops
  // the keyboard and scrolls the page.
  useEffect(() => {
    if (autoFocus && window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const submit = useCallback(() => {
    if (disabled || isBusy(status) || !value.trim()) return;
    if (launchTimer.current) window.clearTimeout(launchTimer.current);
    setLaunching(true);
    launchTimer.current = window.setTimeout(() => setLaunching(false), 500);
    onSubmit();
  }, [disabled, status, value, onSubmit]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative shrink-0 border-t-4 border-wc-maroon bg-background/80 backdrop-blur-xl">
      {/* Positioned out of flow so a notice appearing/disappearing never
       *  changes this bar's height — that would shift the border above. */}
      {notice && (
        <div className="absolute inset-x-0 bottom-full px-4 pb-2 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">{notice}</div>
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] sm:px-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 rounded-3xl border-4 border-wc-forest bg-surface/70 p-2 pl-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors duration-150"
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            aria-label="Message FIFA WC26 Tracker"
            enterKeyHint="send"
            disabled={disabled}
            className="max-h-[168px] min-h-[28px] flex-1 resize-none overflow-y-auto overscroll-contain bg-transparent py-1.5 text-base leading-6 text-foreground field-sizing-content placeholder:text-subtle-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <SubmitButton
            status={status}
            canSend={canSend}
            launching={launching}
            onStop={onStop}
          />
        </form>
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center font-mono text-xs tracking-wide text-subtle-foreground">
          {CHAT_ENABLED ? (
            <>
              FIFA WC26 Tracker can make mistakes
              <span aria-hidden="true">·</span>
              <a
                href="https://adk.dev/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <img
                  src="https://adk.dev/assets/agent-development-kit.png"
                  alt=""
                  className="size-4 rounded-[5px]"
                />
                Powered by Google ADK
              </a>
            </>
          ) : (
            "LLM chat capability has ended — replies below are canned, not from a live agent"
          )}
        </p>
      </div>
    </div>
  );
}
