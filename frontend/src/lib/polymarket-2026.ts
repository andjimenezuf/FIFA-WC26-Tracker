import type { TeamCode } from "@/components/circular-bracket";
import {
  RESULTS_2026,
  SLOTS_2026,
  TEAMS,
} from "@/components/widgets/bracket-2026-data";
import { matchByNumber } from "@/lib/tournament";

// Real Polymarket match-winner markets for the 2026 World Cup knockout stage
// (event slugs of the form fifwc-<team>-<team>-<date>). No API key needed —
// Polymarket's Gamma/CLOB read endpoints are public — but the slugs
// themselves aren't guessable from our own data: Polymarket uses its own
// 3-letter codes (nld not ned for Netherlands, che not sui for Switzerland,
// prt not por for Portugal, hrv not cro for Croatia, cdr not cod for DR
// Congo, cvi not cpv for Cape Verde) and the date segment is the match's
// LOCAL (not UTC) calendar date, which can differ from our kickoffAt's UTC
// date for late kickoffs. Every entry here was verified against the live
// Gamma API (https://gamma-api.polymarket.com/events?slug=...), one match
// number at a time — not pattern-generated.
export const POLYMARKET_SLUG_2026: Partial<Record<number, string>> = {
  73: "fifwc-rsa-can-2026-06-28",
  74: "fifwc-ger-par-2026-06-29",
  75: "fifwc-nld-mar-2026-06-29",
  76: "fifwc-bra-jpn-2026-06-29",
  77: "fifwc-fra-swe-2026-06-30",
  78: "fifwc-civ-nor-2026-06-30",
  79: "fifwc-mex-ecu-2026-06-30",
  80: "fifwc-eng-cdr-2026-07-01",
  81: "fifwc-usa-bih-2026-07-01",
  82: "fifwc-bel-sen-2026-07-01",
  83: "fifwc-prt-hrv-2026-07-02",
  84: "fifwc-esp-aut-2026-07-02",
  85: "fifwc-che-alg-2026-07-02",
  // Cape Verde is "cvi" here, not our own "cpv" — the one code my own
  // lookup attempts didn't try, found by the user.
  86: "fifwc-arg-cvi-2026-07-03",
  87: "fifwc-col-gha-2026-07-03",
  88: "fifwc-aus-egy-2026-07-03",
  89: "fifwc-par-fra-2026-07-04",
  90: "fifwc-can-mar-2026-07-04",
  91: "fifwc-bra-nor-2026-07-05",
  92: "fifwc-mex-eng-2026-07-05",
  93: "fifwc-prt-esp-2026-07-06",
  94: "fifwc-usa-bel-2026-07-06",
  95: "fifwc-arg-egy-2026-07-07",
  96: "fifwc-che-col-2026-07-07",
  97: "fifwc-fra-mar-2026-07-09",
  98: "fifwc-esp-bel-2026-07-10",
  99: "fifwc-nor-eng-2026-07-11",
  100: "fifwc-arg-che-2026-07-11",
  101: "fifwc-fra-esp-2026-07-14",
  102: "fifwc-eng-arg-2026-07-15",
  103: "fifwc-fra-eng-2026-07-18",
  104: "fifwc-esp-arg-2026-07-19",
};

/** The two teams in a knockout match, for display alongside its embed —
 *  R32 reads straight off the real slot assignments; R16 and later read off
 *  the two feeder matches' winners (or, for the third-place match, the two
 *  semifinal losers). Same derivation validate-bracket-2026.ts cross-checks. */
export function matchParticipants(
  match: number,
): [TeamCode, TeamCode] | undefined {
  if (match <= 88) {
    const home = SLOTS_2026[`${match}:home`];
    const away = SLOTS_2026[`${match}:away`];
    return home && away ? [home, away] : undefined;
  }
  const km = matchByNumber[match];
  const of = (ref: typeof km.home): TeamCode | undefined => {
    if (ref.kind === "match") return RESULTS_2026[ref.match];
    if (ref.kind === "loser") {
      const feeder = matchByNumber[ref.match];
      const h =
        feeder.home.kind === "match"
          ? RESULTS_2026[feeder.home.match]
          : undefined;
      const a =
        feeder.away.kind === "match"
          ? RESULTS_2026[feeder.away.match]
          : undefined;
      const winner = RESULTS_2026[ref.match];
      return [h, a].find((t) => t && t !== winner);
    }
    return undefined;
  };
  const home = of(km.home);
  const away = of(km.away);
  return home && away ? [home, away] : undefined;
}

/** A knockout match's real final score, oriented [home, away] the same way
 *  matchParticipants is — read off whichever side's koLegs records it (every
 *  knockout match has at least one side in TEAMS, the 32 R32 qualifiers). */
export function matchScore(match: number): [number, number] | undefined {
  const participants = matchParticipants(match);
  if (!participants) return undefined;
  const [home, away] = participants;
  for (const team of TEAMS) {
    const leg = team.koLegs.find(([number]) => number === match);
    if (!leg) continue;
    const [, , , goalsFor, goalsAgainst] = leg;
    if (team.code === home) return [goalsFor, goalsAgainst];
    if (team.code === away) return [goalsAgainst, goalsFor];
  }
  return undefined;
}
