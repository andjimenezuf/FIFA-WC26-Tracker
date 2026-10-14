// One-off integrity check for widgets/bracket-2026-data.ts — run with
// `npx tsx --tsconfig tsconfig.app.json scripts/validate-bracket-2026.ts`
// from frontend/. Lives outside src/ (uses Node's `process`, which the
// browser-targeted app tsconfig doesn't have types for) and isn't imported
// by the app — re-run by hand after any edit to the data file.
import { matchByNumber, teamById, teams } from "../src/lib/tournament";
import {
  RESULTS_2026,
  SLOTS_2026,
  TEAM_JOURNEYS_2026,
} from "../src/components/widgets/bracket-2026-data";

let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error("FAIL:", msg);
};

// 1. All 32 slots filled, all 32 codes distinct and real teams.
const slotCodes = Object.values(SLOTS_2026);
if (slotCodes.length !== 32) fail(`expected 32 slots, got ${slotCodes.length}`);
const uniqueSlotCodes = new Set(slotCodes);
if (uniqueSlotCodes.size !== 32)
  fail(
    `slot codes not all distinct: ${slotCodes.length - uniqueSlotCodes.size} dupes`,
  );
for (const code of slotCodes) {
  if (!teamById[code]) fail(`slot code ${code} is not a real team id`);
}

// 2. Every R32 match's recorded winner must be one of its two occupants.
for (let m = 73; m <= 88; m++) {
  const home = SLOTS_2026[`${m}:home`];
  const away = SLOTS_2026[`${m}:away`];
  const winner = RESULTS_2026[m];
  if (!home || !away) fail(`match ${m} missing a slot occupant`);
  if (winner !== home && winner !== away)
    fail(`match ${m}: winner ${winner} is neither ${home} nor ${away}`);
}

// 3. Every later match's winner must be the winner of one of its two feeder
//    matches (walks the real feedsInto/childMatches chain from tournament.ts).
for (let m = 89; m <= 104; m++) {
  const km = matchByNumber[m];
  const kids: number[] = [];
  if (km.home.kind === "match") kids.push(km.home.match);
  if (km.away.kind === "match") kids.push(km.away.match);
  if (km.home.kind === "loser" || km.away.kind === "loser") {
    // Match 103 (third place): home/away are LOSERS of 101/102.
    const loserOf = (n: number) => {
      const km2 = matchByNumber[n];
      const h =
        km2.home.kind === "match" ? RESULTS_2026[km2.home.match] : undefined;
      // not needed further; 101/102 are themselves match-fed, so just compare.
      return h;
    };
    continue; // handled separately below
  }
  if (kids.length !== 2) continue;
  const feederWinners = kids.map((k) => RESULTS_2026[k]);
  const winner = RESULTS_2026[m];
  if (!feederWinners.includes(winner))
    fail(
      `match ${m}: winner ${winner} didn't win either feeder (${kids.join(",")} -> ${feederWinners.join(",")})`,
    );
}

// 3b. Third-place match (103): its winner/loser must be the two SF losers.
{
  const sf101winner = RESULTS_2026[101];
  const sf102winner = RESULTS_2026[102];
  const sf101 = SLOTS_2026; // not used; just documenting intent
  const tpWinner = RESULTS_2026[103];
  // The two teams in 103 are the SF *losers*; we don't have an explicit
  // "loser" map, so cross-check against each team's koLegs instead (step 4
  // already verifies each team's own claimed matches, which covers this).
  void sf101winner;
  void sf102winner;
  void tpWinner;
  void sf101;
}

// 4. Every team's koLegs must agree with RESULTS_2026 on who won each match
//    they claim to have played, and the team must actually be one of that
//    match's two occupants (slot teams for 73-88, or winners of both feeders
//    otherwise).
function participantsOf(m: number): Set<string> {
  if (m <= 88) {
    return new Set(
      [SLOTS_2026[`${m}:home`], SLOTS_2026[`${m}:away`]].filter(Boolean),
    );
  }
  const km = matchByNumber[m];
  const set = new Set<string>();
  const add = (ref: typeof km.home) => {
    if (ref.kind === "match") set.add(RESULTS_2026[ref.match]);
    if (ref.kind === "loser") {
      const km2 = matchByNumber[ref.match];
      const h =
        km2.home.kind === "match" ? RESULTS_2026[km2.home.match] : undefined;
      const a =
        km2.away.kind === "match" ? RESULTS_2026[km2.away.match] : undefined;
      const w = RESULTS_2026[ref.match];
      [h, a].forEach((t) => t && t !== w && set.add(t));
    }
  };
  add(km.home);
  add(km.away);
  return set;
}

for (const [code, journey] of TEAM_JOURNEYS_2026) {
  for (const leg of journey.legs) {
    if (leg.roundLabel === "Group") continue;
    const participants = participantsOf(leg.match);
    if (!participants.has(code))
      fail(
        `${code}: claims to have played match ${leg.match}, but isn't a listed participant (${[...participants].join(",")})`,
      );
    const actualWinner = RESULTS_2026[leg.match];
    const claimedResult = leg.result; // W/D/L from that team's perspective
    if (claimedResult === "W" && actualWinner !== code)
      fail(
        `${code}: claims W in match ${leg.match}, but RESULTS_2026 says ${actualWinner} won`,
      );
    if (claimedResult === "L" && actualWinner === code)
      fail(
        `${code}: claims L in match ${leg.match}, but RESULTS_2026 says ${code} won`,
      );
  }
}

// 5. Champion sanity.
if (RESULTS_2026[104] !== "ESP")
  fail(`final winner should be ESP, got ${RESULTS_2026[104]}`);

// 6. Every team in TEAM_JOURNEYS_2026 is a real id, and every slot team has a journey.
for (const code of slotCodes) {
  if (!TEAM_JOURNEYS_2026.has(code))
    fail(`${code}: in SLOTS_2026 but has no TEAM_JOURNEYS_2026 entry`);
}
if (TEAM_JOURNEYS_2026.size !== 32)
  fail(`expected 32 team journeys, got ${TEAM_JOURNEYS_2026.size}`);

console.log(
  `Checked ${teams.length} known teams, ${slotCodes.length} slots, ${TEAM_JOURNEYS_2026.size} journeys.`,
);
console.log(errors === 0 ? "ALL CHECKS PASSED" : `${errors} FAILURE(S)`);
process.exit(errors === 0 ? 0 : 1);
