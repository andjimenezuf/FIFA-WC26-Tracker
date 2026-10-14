// One-off export of the real, final 2026 World Cup results (all 104 matches)
// as JSON for the Python backend to load statically — no network calls, no
// live model, just the facts. Run with:
//   npx tsx --tsconfig tsconfig.app.json scripts/export-results-2026.ts
// from frontend/, after any edit to bracket-2026-data.ts. Lives outside src/
// for the same reason as validate-bracket-2026.ts (uses Node's `process`).
import { writeFileSync } from "node:fs";
import {
  groupMatches,
  matchSchedule,
  matchByNumber,
  teamById,
  venueTimeZone,
  type GroupLetter,
} from "../src/lib/tournament";
import { TEAMS } from "../src/components/widgets/bracket-2026-data";
import { teams } from "../src/lib/tournament";

const KO_ROUND_NAME: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarterfinal",
  SF: "Semifinal",
  TP: "Third place",
  FINAL: "Final",
};

interface MatchResult {
  number: number;
  round: string; // "Group" | "Round of 16" | … | "Final"
  group: GroupLetter | null;
  home: { code: string; name: string; score: number | null };
  away: { code: string; name: string; score: number | null };
  winner: "home" | "away" | "draw" | null;
  kickoffAt: string;
  venue: string;
  venueTz: string | null;
}

function winnerOf(homeScore: number | null, awayScore: number | null) {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore === awayScore) return "draw" as const;
  return homeScore > awayScore ? ("home" as const) : ("away" as const);
}

// Group scores: looked up from whichever side reached the Round of 32 (the
// only teams bracket-2026-data.ts records groupLegs for). A few groups had
// only 2 of their 4 teams advance, leaving that group's bottom-pair fixture
// (both teams already eliminated either way) with no recorded score — those
// come out null rather than a guess.
const groupScoreByPair = new Map<string, [number, number]>(); // "HOME|AWAY" -> [homeGoals, awayGoals]
for (const team of TEAMS) {
  for (const [opponent, , gf, ga] of team.groupLegs) {
    groupScoreByPair.set(`${team.code}|${opponent}`, [gf, ga]);
    groupScoreByPair.set(`${opponent}|${team.code}`, [ga, gf]);
  }
}

const koScoreByMatch = new Map<number, [string, string, number, number]>(); // match -> [homeCode, awayCode, homeGoals, awayGoals]
for (const team of TEAMS) {
  for (const [match, opponent, , gf, ga] of team.koLegs) {
    if (!koScoreByMatch.has(match)) {
      koScoreByMatch.set(match, [team.code, opponent, gf, ga]);
    }
  }
}

const results: MatchResult[] = matchSchedule.map(
  ({ number, kickoffAt, venue }) => {
    const tz = venueTimeZone(venue) ?? null;

    if (number <= 72) {
      const gm = groupMatches.find((m) => m.number === number)!;
      const scores = groupScoreByPair.get(`${gm.homeId}|${gm.awayId}`);
      const [homeScore, awayScore] = scores ?? [null, null];
      return {
        number,
        round: "Group",
        group: gm.group,
        home: {
          code: gm.homeId,
          name: teamById[gm.homeId].name,
          score: homeScore,
        },
        away: {
          code: gm.awayId,
          name: teamById[gm.awayId].name,
          score: awayScore,
        },
        winner: winnerOf(homeScore, awayScore),
        kickoffAt,
        venue,
        venueTz: tz,
      };
    }

    const km = matchByNumber[number];
    const ko = koScoreByMatch.get(number);
    if (!ko) throw new Error(`No recorded result for knockout match ${number}`);
    const [homeCode, awayCode, homeScore, awayScore] = ko;
    return {
      number,
      round: KO_ROUND_NAME[km.round] ?? km.round,
      group: null,
      home: { code: homeCode, name: teamById[homeCode].name, score: homeScore },
      away: { code: awayCode, name: teamById[awayCode].name, score: awayScore },
      winner: winnerOf(homeScore, awayScore),
      kickoffAt,
      venue,
      venueTz: tz,
    };
  },
);

const missing = results.filter((r) => r.home.score === null);
if (missing.length > 0) {
  console.warn(
    `${missing.length} group match(es) with no recorded score (both sides eliminated, dead rubber): ` +
      missing
        .map((m) => `#${m.number} ${m.home.code} vs ${m.away.code}`)
        .join(", "),
  );
}

const outPath = "../backend/agents/wc26_chat/data/matches_2026.json";
writeFileSync(outPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(`Wrote ${results.length} matches to ${outPath}`);

// Every team's real final placement — "World Cup winners" down to "Eliminated
// in the round of 32" for the 32 who got that far (bracket-2026-data.ts's own
// wording), "Eliminated in the group stage" for the other 16 (not recorded
// there since their tournament ended at matchday 3).
const outcomeByCode = new Map(TEAMS.map((t) => [t.code, t.outcome]));
const teamResults = teams.map((t) => ({
  code: t.id,
  name: t.name,
  group: t.group,
  outcome: outcomeByCode.get(t.id) ?? "Eliminated in the group stage",
}));
const teamsOutPath = "../backend/agents/wc26_chat/data/teams_2026.json";
writeFileSync(teamsOutPath, `${JSON.stringify(teamResults, null, 2)}\n`);
console.log(`Wrote ${teamResults.length} teams to ${teamsOutPath}`);
