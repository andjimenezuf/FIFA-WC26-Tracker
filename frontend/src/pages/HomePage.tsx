import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Composer } from "@/components/composer";
import { HomeBracket } from "@/components/widgets/circular-bracket-2026";
import { Suggestion, Suggestions } from "@/components/ui/suggestion";
import { startNewChat } from "@/lib/chat-storage";

const SUGGESTIONS = [
  "Which matches are playing today?",
  "Who is most likely to play in match 100?",
  "How far can Argentina go this World Cup?",
  "What's Argentina's road to the final?",
  "Show me the market's predicted bracket",
  "Who can play the final?",
];

// Rotates the chip's little arrow through the brand palette, skipping blue
// and purple since those are already the navbar's and the submit button's
// colors.
const SUGGESTION_ARROW_COLORS = [
  "text-wc-maroon",
  "text-wc-red",
  "text-wc-orange",
  "text-wc-forest",
  "text-wc-pink",
  "text-wc-lime",
];

export function HomePage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const goToNewChat = (message: string) => {
    const id = startNewChat(message);
    if (id) navigate(`/chat/${id}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="flex min-h-full flex-col items-center p-4 text-center">
          <div className="my-auto flex w-full flex-col items-center">
            <h1 className="animate-fade-up text-xl leading-[1.15] font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
              Ask anything about the
              <br />
              <span className="text-wc-blue">2026 World Cup</span>
            </h1>

            <div
              className="animate-fade-up mt-6 w-full max-w-lg"
              style={{ animationDelay: "120ms" }}
            >
              <HomeBracket />
              <p className="mt-1.5 text-center text-[11px] text-subtle-foreground">
                The final 2026 bracket — tap a flag to see that team's run
              </p>
            </div>

            <div
              className="animate-fade-up mt-8 w-full max-w-2xl"
              style={{ animationDelay: "180ms" }}
            >
              <Suggestions className="justify-center">
                {SUGGESTIONS.map((suggestion, index) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onSelect={goToNewChat}
                    arrowClassName={
                      SUGGESTION_ARROW_COLORS[
                        index % SUGGESTION_ARROW_COLORS.length
                      ]
                    }
                  />
                ))}
              </Suggestions>
            </div>
          </div>
        </div>
      </div>
      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => {
          goToNewChat(input);
          setInput("");
        }}
        onStop={() => {}}
        status="ready"
      />
    </div>
  );
}
