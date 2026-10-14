import { cn } from "cnfast";
import { ServerOff } from "lucide-react";
import { CardGrid, CardGridFrame } from "@/components/ui/card-grid";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { MatchPredictionCard } from "@/components/widgets/polymarket-embed";
import { matchParticipants, POLYMARKET_SLUG_2026 } from "@/lib/polymarket-2026";
import { matchByNumber, type Round } from "@/lib/tournament";

const ROUND_LABEL: Record<Round, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarterfinals",
  SF: "Semifinals",
  TP: "Third place",
  FINAL: "Final",
};

// One color per stage, all distinct, bold, no yellow (doesn't read against a
// white background) — black stands in as a fifth "family" alongside the
// palette's red/purple/blue/green groups, each used as a light-line +
// dark-text pair (e.g. R16: red line, maroon text) rather than one flat
// color, so the later rounds read as progressively richer than R32's black.
const STAGE_COLOR: Record<Round, { text: string; line: string }> = {
  R32: { text: "text-black", line: "bg-black" },
  R16: { text: "text-wc-maroon", line: "bg-wc-red" },
  QF: { text: "text-wc-violet", line: "bg-wc-lavender" },
  SF: { text: "text-wc-navy", line: "bg-wc-sky" },
  TP: { text: "text-wc-orange", line: "bg-wc-peach" },
  FINAL: { text: "text-wc-forest", line: "bg-wc-green" },
};

// R32/R16/QF get the regular auto-flowing grid; the last three rounds are
// few enough matches that a plain grid leaves them looking sparse, so they
// get a bracket-shaped layout instead (see FinalStages below).
const GRID_ROUNDS: Round[] = ["R32", "R16", "QF"];

const MATCHES_BY_ROUND: Record<Round, number[]> = {
  R32: [],
  R16: [],
  QF: [],
  SF: [],
  TP: [],
  FINAL: [],
};
for (let match = 73; match <= 104; match++) {
  MATCHES_BY_ROUND[matchByNumber[match].round].push(match);
}

/** One match's embed, or a fallback notice when we don't have a Polymarket
 *  slug for it. Shared by the regular grid and FinalStages. */
function MatchCard({ match, round }: { match: number; round: Round }) {
  const slug = POLYMARKET_SLUG_2026[match];
  const teams = matchParticipants(match);
  if (!slug || !teams) {
    return (
      <CardGridFrame>
        <Notice icon={ServerOff} tone="amber">
          Match #{match}: no Polymarket market found for this one.
        </Notice>
      </CardGridFrame>
    );
  }
  return (
    <MatchPredictionCard
      slug={slug}
      roundLabel={`${ROUND_LABEL[round]} · #${match}`}
      match={match}
      teams={teams}
    />
  );
}

/** A column's own header line — same look as Section's title (flanking
 *  rules, tracked uppercase label) but scoped to one column's width rather
 *  than spanning the row, so three of these sit side by side as their own
 *  independent lines instead of one combined title. */
function ColumnLabel({ round, children }: { round: Round; children: string }) {
  const color = STAGE_COLOR[round];
  return (
    <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <span className={cn("h-1", color.line)} />
      <span
        className={cn(
          "rounded-sm px-1 text-sm font-bold tracking-widest uppercase",
          color.text,
        )}
      >
        {children}
      </span>
      <span className={cn("h-1", color.line)} />
    </div>
  );
}

// Four matches fill four columns exactly, so this is the same shape as the
// other rounds — the only wrinkle is the semifinals being one labeled group
// of two matches side by side (spanning 2 of the 4 columns) rather than two
// separate single-column groups, so "Semifinals" reads as one line over both.
function FinalStages() {
  return (
    <CardGridFrame className="grid grid-cols-2 items-start gap-5 lg:grid-cols-4">
      <div className="col-span-2">
        <ColumnLabel round="SF">Semifinals</ColumnLabel>
        <div className="grid grid-cols-2 gap-5">
          <MatchCard match={101} round="SF" />
          <MatchCard match={102} round="SF" />
        </div>
      </div>
      <div>
        <ColumnLabel round="TP">Third place</ColumnLabel>
        <MatchCard match={103} round="TP" />
      </div>
      <div>
        <ColumnLabel round="FINAL">Final</ColumnLabel>
        <MatchCard match={104} round="FINAL" />
      </div>
    </CardGridFrame>
  );
}

// Real Polymarket odds (see lib/polymarket-2026.ts for how these slugs were
// found and verified — no API key needed, their market-data endpoints are
// public). This is the knockout stage only: Polymarket doesn't run a
// separate market per group-stage fixture the way it does for knockouts.
export function PredictionsPage() {
  return (
    <div className="w-full flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-8 lg:p-10">
        <div className="space-y-2 text-center">
          <p className="text-xl font-bold tracking-widest text-black uppercase">
            FIFA WC26 Tracker Predictions
          </p>
          <p className="mx-auto max-w-2xl text-sm text-subtle-foreground">
            Real{" "}
            <a
              href="https://polymarket.com/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-foreground underline decoration-dotted underline-offset-2 hover:text-wc-blue"
            >
              Polymarket
            </a>{" "}
            markets, not our own forecast. Traders bet on each match, and the
            line settles at 100% for the winner once it's played. Knockout stage
            only; Polymarket doesn't run group-stage markets. Tap a card to load
            its live chart.
          </p>
          <p className="mx-auto max-w-2xl text-sm text-subtle-foreground">
            Its <code>predicted_scores</code> and <code>odds</code> tools were
            designed to pull live Polymarket data like this while the tournament
            was still ongoing. Now that it's decided, they just report the real
            result instead.
          </p>
        </div>

        {GRID_ROUNDS.map((round) => (
          <Section
            key={round}
            title={ROUND_LABEL[round]}
            titleClassName={cn("text-sm font-bold", STAGE_COLOR[round].text)}
            lineClassName={cn("h-1", STAGE_COLOR[round].line)}
          >
            <CardGrid className="grid-cols-2 items-start gap-5 lg:grid-cols-4">
              {MATCHES_BY_ROUND[round].map((match) => (
                <MatchCard key={match} match={match} round={round} />
              ))}
            </CardGrid>
          </Section>
        ))}
        <FinalStages />
      </div>
    </div>
  );
}
