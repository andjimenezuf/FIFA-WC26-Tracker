import type { TeamCode } from "@/components/circular-bracket";
import { Flag } from "@/components/flags";
import { teamById } from "@/lib/tournament";

// A new chat's welcome message, now that the tournament is actually over —
// rotates through a few intros so it doesn't feel like a fixed canned line,
// but the facts underneath (Spain's title, the semis, third place) are
// always the same real result from bracket-2026-data.ts. Real questions
// typed after this still go through the live ADK agent exactly as before —
// this only replaces what a brand-new chat opens with.

const INTROS = [
  "🏆 The 2026 World Cup wrapped up a while back — Spain are world champions!",
  "Quick recap since you're here: the tournament's over, and Spain lifted the trophy.",
  "That's a wrap on 2026 — here's how the knockout stage finished.",
  "Final whistle blew weeks ago: Spain are your 2026 World Cup winners.",
];

function ScoreLabel({ children }: { children: string }) {
  return (
    <p className="mt-2 text-[10px] font-bold tracking-widest text-subtle-foreground uppercase first:mt-0">
      {children}
    </p>
  );
}

function TeamSide({ code, align }: { code: TeamCode; align: "start" | "end" }) {
  const name = teamById[code]?.name ?? code;
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-medium ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <Flag code={code} size={16} />
      <span className="truncate">{name}</span>
    </span>
  );
}

function ScoreRow({
  home,
  homeScore,
  away,
  awayScore,
  note,
}: {
  home: TeamCode;
  homeScore: number;
  away: TeamCode;
  awayScore: number;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <TeamSide code={home} align="start" />
      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {homeScore}–{awayScore}
        {note && (
          <span className="ml-1 text-[10px] font-normal text-subtle-foreground">
            {note}
          </span>
        )}
      </span>
      <TeamSide code={away} align="end" />
    </div>
  );
}

/** One randomly-picked welcome message for a brand-new chat — the real
 *  final, third-place match, and both semifinals, with flags. */
export function TournamentWrapUp({ variant }: { variant: number }) {
  const intro = INTROS[variant % INTROS.length];
  return (
    <div className="flex flex-col gap-3">
      <p>{intro}</p>
      <div className="rounded-xl border-2 border-border bg-surface p-3">
        <ScoreLabel>Final</ScoreLabel>
        <ScoreRow
          home="ESP"
          homeScore={1}
          away="ARG"
          awayScore={0}
          note="AET"
        />
        <ScoreLabel>Third place</ScoreLabel>
        <ScoreRow home="ENG" homeScore={6} away="FRA" awayScore={4} />
        <ScoreLabel>Semifinals</ScoreLabel>
        <ScoreRow home="ESP" homeScore={2} away="FRA" awayScore={0} />
        <ScoreRow home="ARG" homeScore={2} away="ENG" awayScore={1} />
      </div>
      <p className="text-sm text-muted-foreground">
        Ask me anything about how it played out — any match, any team's run, or
        the odds along the way.
      </p>
    </div>
  );
}
