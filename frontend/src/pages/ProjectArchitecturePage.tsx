import {
  ArrowDown,
  Clock,
  Goal,
  ListTree,
  Percent,
  Radar,
  Swords,
  Table2,
} from "lucide-react";
import { cn } from "cnfast";
import type { LucideIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { CardGrid } from "@/components/ui/card-grid";
import { Section } from "@/components/ui/section";

// The Project Architecture page. A short explainer of how wc26_chat (the
// Google ADK agent behind the chat tab) is actually built. Real
// architecture, not marketing copy. See
// backend/agents/wc26_chat/{agent,tools,instructions}.py for the source of
// truth this was written from.

interface ToolInfo {
  name: string;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
  example: string;
}

const TOOLS: ToolInfo[] = [
  {
    name: "convert_time",
    title: "Clock & time zone",
    icon: Clock,
    color: "text-wc-forest",
    description:
      "Converts a UTC kickoff into any time zone's local date, time, and weekday. Pure date math, no match data needed.",
    example: "What time is the final in Tokyo?",
  },
  {
    name: "matches",
    title: "Fixtures & results",
    icon: Table2,
    color: "text-wc-blue",
    description:
      "Match schedules, final scores, venues, and status, filtered by team, date, or matchup, including head-to-head results.",
    example: "Which matches are playing today?",
  },
  {
    name: "standings",
    title: "Group tables",
    icon: ListTree,
    color: "text-wc-violet",
    description:
      "The real final table for any of the twelve groups, plus the twelve third-placed teams ranked by who qualified for the Round of 32.",
    example: "Show me Group A's standings",
  },
  {
    name: "outlook",
    title: "Tournament outlook",
    icon: Radar,
    color: "text-wc-maroon",
    description:
      "How far a team actually went, a group's real finishers, or the tournament's final placements. Never a single game.",
    example: "How far did Argentina go this World Cup?",
  },
  {
    name: "predicted_scores",
    title: "Match result",
    icon: Percent,
    color: "text-wc-orange",
    description:
      "The real final score of one knockout match. The tournament already happened, so this reports the result instead of forecasting one.",
    example: "What was the score of the final?",
  },
  {
    name: "odds",
    title: "Matchup result",
    icon: Swords,
    color: "text-wc-navy",
    description:
      "The real result of one or more matchups. If two teams never actually played each other, it says so instead of guessing.",
    example: "Who won, Brazil or Argentina?",
  },
  {
    name: "timeline",
    title: "Match events",
    icon: Goal,
    color: "text-wc-pink",
    description:
      "Goals, cards, and substitutions for a match, by FIFA match number.",
    example: "What happened in match 50?",
  },
];

const STACK = [
  "Python",
  "Google ADK",
  "FastAPI",
  "LiteLLM + OpenRouter",
  "React",
  "Vite",
  "TypeScript",
  "Tailwind CSS",
];

const STEPS = [
  {
    title: "Your browser sends the message",
    body: "Your browser sends a POST request to FastAPI's /run_sse endpoint. Google ADK builds this endpoint automatically from the wc26_chat agent folder, and it hands your message to ADK's \"Runner,\" the piece that actually drives one turn of conversation.",
  },
  {
    title: "ADK builds the model's prompt",
    body: "ADK sends the model three things together: your message, the agent's system instructions, and a JSON schema for each of the seven tools. Those schemas are generated automatically from the Python type hints on each tool's function, not written by hand. The request itself travels through OpenRouter, using ADK's LiteLlm wrapper to reach whichever model is configured.",
  },
  {
    title: "The model decides what to do",
    body: 'This codebase has no separate if/else router. "Routing" is really two things working together: the system prompt, which describes what kind of question fits each tool, and the model\'s own function calling, where it picks a tool and fills in its arguments from the schema. If no tool fits, it just answers directly.',
  },
  {
    title: "A tool runs and its result comes back",
    body: "If the model calls a tool, ADK runs that Python function and sends its JSON result back to the model. The model then turns that data into a sentence, and for a few tools, a widget tag the frontend knows how to render.",
  },
  {
    title: "The reply streams to your screen",
    body: "Text comes back to the browser over server sent events as the model generates it. The frontend replaces its in progress message on every event instead of appending to it, so what you see is always the model's latest full draft, never a duplicate.",
  },
];

interface ToolCallStep {
  tool: string;
  args: string;
}

interface ChainScenario {
  question: string;
  steps: ToolCallStep[];
  answer: string;
}

// Four real question shapes. Two are answered by a single tool call, and
// two need the model to chain a second call off the first one's result. The
// 2-call ones are verbatim from a live test run against the actual agent
// (see backend/agents/wc26_chat/), so they aren't hypothetical.
const SCENARIOS: ChainScenario[] = [
  {
    question: "Which matches are playing today?",
    steps: [{ tool: "matches", args: 'when: "today"' }],
    answer:
      "There are no matches today. The 2026 World Cup wrapped up on July 19.",
  },
  {
    question: "Who won the World Cup?",
    steps: [{ tool: "outlook", args: "bracket: true" }],
    answer: "Spain won the 2026 World Cup, beating Argentina 1–0 in the final.",
  },
  {
    question: "What happened in the final? Any goals or cards?",
    steps: [
      { tool: "predicted_scores", args: "match: 104" },
      { tool: "timeline", args: "match_numbers: [104]" },
    ],
    answer:
      "Spain won it 1–0. Ferran Torres scored in the 106th minute, and Argentina picked up four yellow cards plus a red for Enzo Fernández.",
  },
  {
    question: "What time was Argentina's semifinal, in Tokyo?",
    steps: [
      { tool: "matches", args: 'team: "Argentina"' },
      { tool: "convert_time", args: 'time_zone: "Asia/Tokyo"' },
    ],
    answer:
      "Argentina's semifinal against England kicked off early morning in Tokyo.",
  },
];

type FlowNodeKind = "user" | "model" | "tool" | "answer";

const FLOW_NODE_STYLE: Record<FlowNodeKind, string> = {
  user: "border-border bg-surface text-foreground",
  model: "border-wc-violet bg-wc-lavender/20 text-wc-violet",
  tool: "border-wc-forest bg-wc-green/20 text-wc-forest",
  answer: "border-wc-forest bg-wc-green/30 text-wc-forest",
};

const FLOW_NODE_LABEL: Record<FlowNodeKind, string> = {
  user: "You ask",
  model: "Model decides",
  tool: "Tool call",
  answer: "Reply",
};

function FlowNode({
  kind,
  children,
}: {
  kind: FlowNodeKind;
  children: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center gap-1 rounded-xl border-2 px-4 py-2.5 text-center",
        FLOW_NODE_STYLE[kind],
      )}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">
        {FLOW_NODE_LABEL[kind]}
      </span>
      <span className="text-xs leading-snug font-bold text-balance">
        {children}
      </span>
    </div>
  );
}

function Connector() {
  return <ArrowDown className="size-4 shrink-0 text-subtle-foreground" />;
}

/** The chosen scenario's call sequence, laid out top-to-bottom so it never
 *  needs horizontal scrolling: question in, model decides, a tool runs
 *  (repeated once more for a chained question), model decides again, reply
 *  out. */
function ToolChainFlow({ scenario }: { scenario: ChainScenario }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <FlowNode kind="user">{scenario.question}</FlowNode>
      {scenario.steps.map((step) => (
        <Fragment key={step.tool}>
          <Connector />
          <FlowNode kind="model">Model decides</FlowNode>
          <Connector />
          <FlowNode kind="tool">{`${step.tool}(${step.args})`}</FlowNode>
        </Fragment>
      ))}
      <Connector />
      <FlowNode kind="model">Model writes the reply</FlowNode>
      <Connector />
      <FlowNode kind="answer">{scenario.answer}</FlowNode>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolInfo }) {
  const Icon = tool.icon;
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border-2 border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", tool.color)} />
        <h3 className={cn("text-sm font-bold", tool.color)}>{tool.title}</h3>
      </div>
      <code className="text-[11px] text-subtle-foreground">{tool.name}()</code>
      <p className="text-sm leading-snug text-foreground">{tool.description}</p>
      <p className="mt-auto text-xs text-subtle-foreground italic">
        “{tool.example}”
      </p>
    </div>
  );
}

function ToolChainSection() {
  const [selected, setSelected] = useState(0);
  const scenario = SCENARIOS[selected];

  return (
    <Section
      title="See a tool chain"
      defaultOpen
      titleClassName="text-sm font-bold text-wc-forest"
      lineClassName="h-1 bg-wc-green"
    >
      <p className="mb-4 max-w-4xl text-sm leading-relaxed text-foreground">
        Pick a question below to see which tool or tools the model calls to
        answer it, in order. Some questions resolve in one call. Others need the
        model to chain a second call off the first one's result, like finding
        the match first, then converting its kickoff time.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.question}
            type="button"
            onClick={() => setSelected(i)}
            className={cn(
              "rounded-full border-2 px-3 py-1.5 text-left text-xs font-bold transition-colors",
              i === selected
                ? "border-wc-forest bg-wc-green/20 text-wc-forest"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            {s.question}
          </button>
        ))}
      </div>
      <ToolChainFlow scenario={scenario} />
    </Section>
  );
}

export function ProjectArchitecturePage() {
  return (
    <div className="w-full flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-10 p-4 sm:p-8 lg:p-10">
        <div className="space-y-2 text-center">
          <p className="text-xl font-bold tracking-widest text-black uppercase">
            FIFA WC26 Tracker Agent Architecture
          </p>

          <div className="mx-auto max-w-4xl space-y-3 text-sm text-subtle-foreground">
            <p className="text-left">
              FIFA WC26 Tracker is an agentic chat tracker built with Google
              ADK. One model orchestrates seven tools, deciding which ones to
              call.
            </p>

            <div className="space-y-1">
              <p className="text-xs font-bold tracking-widest text-foreground uppercase">
                Key features
              </p>
              <p className="text-foreground">
                1) Explain knockout scenarios &nbsp; 2) Look up final results
                &nbsp; 3) Trace a team's path
              </p>
            </div>

            <p className="text-left">
              Each question is answered from this project's own real 2026 World
              Cup data, sourced once from ESPN after the tournament ended.
              Questions may use one tool, chain several, or use none.
            </p>

            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-widest text-foreground uppercase">
                Built with
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {STACK.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border-2 border-border bg-surface px-2.5 py-1 text-xs font-bold text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Section
          title="Seven tools, one brain"
          defaultOpen
          titleClassName="text-sm font-bold text-wc-violet"
          lineClassName="h-1 bg-wc-lavender"
        >
          <div className="mb-4 max-w-4xl text-sm leading-relaxed text-foreground">
            Each tool is a typed Python function. The type hints define its
            inputs, and the docstring tells the model what the tool does and
            when to call it.
          </div>
          <CardGrid className="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </CardGrid>
        </Section>

        <Section
          title="The request lifecycle"
          defaultOpen
          titleClassName="text-sm font-bold text-wc-navy"
          lineClassName="h-1 bg-wc-sky"
        >
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-xs font-bold text-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-snug text-subtle-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <ToolChainSection />
      </div>
    </div>
  );
}
