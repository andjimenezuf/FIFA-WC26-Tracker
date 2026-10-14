import { cn } from "cnfast";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { TeamCode } from "@/components/circular-bracket";
import { Flag } from "@/components/flags";
import { matchScore } from "@/lib/polymarket-2026";
import { teamById } from "@/lib/tournament";

/** One match's real Polymarket odds — collapsed by default (just the real
 *  final score, full flags and names since there's room), the live embed
 *  only loading once the user expands the card. Loading all 32 of these
 *  iframes on page load at once is what was causing some of them to come
 *  back incomplete (Polymarket's own embed service throttling that many
 *  near-simultaneous loads) — collapsed-by-default means none load until
 *  asked for, and at most a few load per visit. Once loaded, the iframe
 *  stays mounted (just visually hidden) so re-collapsing and re-expanding
 *  doesn't re-fetch it. */
export function MatchPredictionCard({
  slug,
  roundLabel,
  match,
  teams,
}: {
  slug: string;
  roundLabel: string;
  match: number;
  teams: [TeamCode, TeamCode];
}) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [home, away] = teams;
  const score = matchScore(match);
  const title = `${teamById[home]?.name ?? home} vs ${teamById[away]?.name ?? away}`;

  return (
    <figure className="overflow-hidden rounded-xl border-2 border-border bg-surface">
      <div className="flex items-center justify-center gap-1.5 border-b-2 border-border px-3 py-2 text-xs font-bold tracking-wide text-subtle-foreground uppercase">
        <span>{roundLabel}</span>
        {expanded && (
          <span>
            {home} vs {away}
          </span>
        )}
      </div>

      {loaded && (
        <iframe
          title={`${title} — Polymarket live odds`}
          src={`https://embed.polymarket.com/sports?market=${slug}&buttons=false&height=300`}
          width="100%"
          height={300}
          frameBorder="0"
          allowTransparency
          className={cn("block w-full", !expanded && "hidden")}
        />
      )}

      {!expanded && (
        <div className="animate-fade-up flex flex-col gap-2 p-3">
          {teams.map((code, i) => (
            <div key={code} className="flex items-center gap-2">
              <Flag code={code} size={18} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {teamById[code]?.name ?? code}
              </span>
              {score && (
                <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                  {score[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setExpanded((current) => !current);
          setLoaded(true);
        }}
        aria-expanded={expanded}
        aria-label={
          expanded ? "Collapse" : "Expand to load live Polymarket odds"
        }
        className="flex w-full items-center justify-center border-t-2 border-border py-1.5 text-subtle-foreground transition-colors hover:bg-surface/80 hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>
    </figure>
  );
}
