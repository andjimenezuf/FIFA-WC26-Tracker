import type { TeamCode, SlotKey } from "@/components/circular-bracket";
import type {
  TeamJourney,
  JourneyLeg,
} from "@/components/widgets/cell-path-explain";
import { matchByNumber } from "@/lib/tournament";

// The actual 2026 World Cup, as given by the user — group tables, every
// knockout result, and the full bracket, cross-checked match by match (every
// R32-88 slot's role — winner/runner/third of a specific group — against the
// given fixture list; all 16 resolved with zero contradictions, so this is a
// faithful transcription, not a guess). Replaces the random placeholder
// candidates in circular-bracket-demo.tsx's predecessor with the real
// outcome, including the upsets (Germany out on penalties to third-placed
// Paraguay, Netherlands out on penalties to Morocco, Norway beating Brazil).

type Result = "W" | "D" | "L";
// [opponent, result, goalsFor, goalsAgainst]
type GroupLeg = [string, Result, number, number];
// [matchNumber, opponent, result, goalsFor, goalsAgainst]
type KnockoutLeg = [number, string, Result, number, number];

interface TeamRecord {
  code: TeamCode;
  name: string;
  outcome: string;
  groupLegs: GroupLeg[];
  koLegs: KnockoutLeg[];
}

export const TEAMS: TeamRecord[] = [
  {
    code: "MEX",
    name: "Mexico",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["RSA", "W", 2, 0],
      ["KOR", "W", 1, 0],
      ["CZE", "W", 3, 0],
    ],
    koLegs: [
      [79, "ECU", "W", 2, 0],
      [92, "ENG", "L", 2, 3],
    ],
  },
  {
    code: "RSA",
    name: "South Africa",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["MEX", "L", 0, 2],
      ["CZE", "D", 1, 1],
      ["KOR", "W", 1, 0],
    ],
    koLegs: [[73, "CAN", "L", 0, 1]],
  },
  {
    code: "SUI",
    name: "Switzerland",
    outcome: "Eliminated in the quarterfinals",
    groupLegs: [
      ["QAT", "D", 1, 1],
      ["BIH", "W", 4, 1],
      ["CAN", "W", 2, 1],
    ],
    koLegs: [
      [85, "ALG", "W", 2, 0],
      [96, "COL", "W", 0, 0],
      [100, "ARG", "L", 1, 3],
    ],
  },
  {
    code: "CAN",
    name: "Canada",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["BIH", "D", 1, 1],
      ["QAT", "W", 6, 0],
      ["SUI", "L", 1, 2],
    ],
    koLegs: [
      [73, "RSA", "W", 1, 0],
      [90, "MAR", "L", 0, 3],
    ],
  },
  {
    code: "BRA",
    name: "Brazil",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["MAR", "D", 1, 1],
      ["HAI", "W", 3, 0],
      ["SCO", "W", 3, 0],
    ],
    koLegs: [
      [76, "JPN", "W", 2, 1],
      [91, "NOR", "L", 1, 2],
    ],
  },
  {
    code: "MAR",
    name: "Morocco",
    outcome: "Eliminated in the quarterfinals",
    groupLegs: [
      ["BRA", "D", 1, 1],
      ["SCO", "W", 1, 0],
      ["HAI", "W", 4, 2],
    ],
    koLegs: [
      [75, "NED", "W", 1, 1],
      [90, "CAN", "W", 3, 0],
      [97, "FRA", "L", 0, 2],
    ],
  },
  {
    code: "USA",
    name: "United States",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["PAR", "W", 4, 1],
      ["AUS", "W", 2, 0],
      ["TUR", "L", 2, 3],
    ],
    koLegs: [
      [81, "BIH", "W", 2, 0],
      [94, "BEL", "L", 1, 4],
    ],
  },
  {
    code: "AUS",
    name: "Australia",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["TUR", "W", 2, 0],
      ["USA", "L", 0, 2],
      ["PAR", "D", 0, 0],
    ],
    koLegs: [[88, "EGY", "L", 1, 1]],
  },
  {
    code: "GER",
    name: "Germany",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["CUW", "W", 7, 1],
      ["CIV", "W", 2, 1],
      ["ECU", "L", 1, 2],
    ],
    koLegs: [[74, "PAR", "L", 1, 1]],
  },
  {
    code: "CIV",
    name: "Ivory Coast",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["ECU", "W", 1, 0],
      ["GER", "L", 1, 2],
      ["CUW", "W", 2, 0],
    ],
    koLegs: [[78, "NOR", "L", 1, 2]],
  },
  {
    code: "NED",
    name: "Netherlands",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["JPN", "D", 2, 2],
      ["SWE", "W", 5, 1],
      ["TUN", "W", 3, 1],
    ],
    koLegs: [[75, "MAR", "L", 1, 1]],
  },
  {
    code: "JPN",
    name: "Japan",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["NED", "D", 2, 2],
      ["TUN", "W", 4, 0],
      ["SWE", "D", 1, 1],
    ],
    koLegs: [[76, "BRA", "L", 1, 2]],
  },
  {
    code: "BEL",
    name: "Belgium",
    outcome: "Eliminated in the quarterfinals",
    groupLegs: [
      ["EGY", "D", 1, 1],
      ["IRN", "D", 0, 0],
      ["NZL", "W", 5, 1],
    ],
    koLegs: [
      [82, "SEN", "W", 3, 2],
      [94, "USA", "W", 4, 1],
      [98, "ESP", "L", 1, 2],
    ],
  },
  {
    code: "EGY",
    name: "Egypt",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["BEL", "D", 1, 1],
      ["NZL", "W", 3, 1],
      ["IRN", "D", 1, 1],
    ],
    koLegs: [
      [88, "AUS", "W", 1, 1],
      [95, "ARG", "L", 2, 3],
    ],
  },
  {
    code: "ESP",
    name: "Spain",
    outcome: "World Cup winners",
    groupLegs: [
      ["CPV", "D", 0, 0],
      ["KSA", "W", 4, 0],
      ["URU", "W", 1, 0],
    ],
    koLegs: [
      [84, "AUT", "W", 3, 0],
      [93, "POR", "W", 1, 0],
      [98, "BEL", "W", 2, 1],
      [101, "FRA", "W", 2, 0],
      [104, "ARG", "W", 1, 0],
    ],
  },
  {
    code: "CPV",
    name: "Cape Verde",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["ESP", "D", 0, 0],
      ["URU", "D", 2, 2],
      ["KSA", "D", 0, 0],
    ],
    koLegs: [[86, "ARG", "L", 2, 3]],
  },
  {
    code: "FRA",
    name: "France",
    outcome: "Fourth place",
    groupLegs: [
      ["SEN", "W", 3, 1],
      ["IRQ", "W", 3, 0],
      ["NOR", "W", 4, 1],
    ],
    koLegs: [
      [77, "SWE", "W", 3, 0],
      [89, "PAR", "W", 1, 0],
      [97, "MAR", "W", 2, 0],
      [101, "ESP", "L", 0, 2],
      [103, "ENG", "L", 4, 6],
    ],
  },
  {
    code: "NOR",
    name: "Norway",
    outcome: "Eliminated in the quarterfinals",
    groupLegs: [
      ["IRQ", "W", 4, 1],
      ["SEN", "W", 3, 2],
      ["FRA", "L", 1, 4],
    ],
    koLegs: [
      [78, "CIV", "W", 2, 1],
      [91, "BRA", "W", 2, 1],
      [99, "ENG", "L", 1, 2],
    ],
  },
  {
    code: "ARG",
    name: "Argentina",
    outcome: "Runners-up",
    groupLegs: [
      ["ALG", "W", 3, 0],
      ["AUT", "W", 2, 0],
      ["JOR", "W", 3, 1],
    ],
    koLegs: [
      [86, "CPV", "W", 3, 2],
      [95, "EGY", "W", 3, 2],
      [100, "SUI", "W", 3, 1],
      [102, "ENG", "W", 2, 1],
      [104, "ESP", "L", 0, 1],
    ],
  },
  {
    code: "AUT",
    name: "Austria",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["JOR", "W", 3, 1],
      ["ARG", "L", 0, 2],
      ["ALG", "D", 3, 3],
    ],
    koLegs: [[84, "ESP", "L", 0, 3]],
  },
  {
    code: "COL",
    name: "Colombia",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["UZB", "W", 3, 1],
      ["COD", "W", 1, 0],
      ["POR", "D", 0, 0],
    ],
    koLegs: [
      [87, "GHA", "W", 1, 0],
      [96, "SUI", "L", 0, 0],
    ],
  },
  {
    code: "POR",
    name: "Portugal",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["COD", "D", 1, 1],
      ["UZB", "W", 5, 0],
      ["COL", "D", 0, 0],
    ],
    koLegs: [
      [83, "CRO", "W", 2, 1],
      [93, "ESP", "L", 0, 1],
    ],
  },
  {
    code: "ENG",
    name: "England",
    outcome: "Third place",
    groupLegs: [
      ["CRO", "W", 4, 2],
      ["GHA", "D", 0, 0],
      ["PAN", "W", 2, 0],
    ],
    koLegs: [
      [80, "COD", "W", 2, 1],
      [92, "MEX", "W", 3, 2],
      [99, "NOR", "W", 2, 1],
      [102, "ARG", "L", 1, 2],
      [103, "FRA", "W", 6, 4],
    ],
  },
  {
    code: "CRO",
    name: "Croatia",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["ENG", "L", 2, 4],
      ["PAN", "W", 1, 0],
      ["GHA", "W", 2, 1],
    ],
    koLegs: [[83, "POR", "L", 1, 2]],
  },
  {
    code: "BIH",
    name: "Bosnia & Herzegovina",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["CAN", "D", 1, 1],
      ["SUI", "L", 1, 4],
      ["QAT", "W", 3, 1],
    ],
    koLegs: [[81, "USA", "L", 0, 2]],
  },
  {
    code: "PAR",
    name: "Paraguay",
    outcome: "Eliminated in the round of 16",
    groupLegs: [
      ["USA", "L", 1, 4],
      ["TUR", "W", 1, 0],
      ["AUS", "D", 0, 0],
    ],
    koLegs: [
      [74, "GER", "W", 1, 1],
      [89, "FRA", "L", 0, 1],
    ],
  },
  {
    code: "ECU",
    name: "Ecuador",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["CIV", "L", 0, 1],
      ["CUW", "D", 0, 0],
      ["GER", "W", 2, 1],
    ],
    koLegs: [[79, "MEX", "L", 0, 2]],
  },
  {
    code: "SWE",
    name: "Sweden",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["TUN", "W", 5, 1],
      ["NED", "L", 1, 5],
      ["JPN", "D", 1, 1],
    ],
    koLegs: [[77, "FRA", "L", 0, 3]],
  },
  {
    code: "SEN",
    name: "Senegal",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["FRA", "L", 1, 3],
      ["NOR", "L", 2, 3],
      ["IRQ", "W", 5, 0],
    ],
    koLegs: [[82, "BEL", "L", 2, 3]],
  },
  {
    code: "ALG",
    name: "Algeria",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["ARG", "L", 0, 3],
      ["JOR", "W", 2, 1],
      ["AUT", "D", 3, 3],
    ],
    koLegs: [[85, "SUI", "L", 0, 2]],
  },
  {
    code: "COD",
    name: "DR Congo",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["POR", "D", 1, 1],
      ["COL", "L", 0, 1],
      ["UZB", "W", 3, 1],
    ],
    koLegs: [[80, "ENG", "L", 1, 2]],
  },
  {
    code: "GHA",
    name: "Ghana",
    outcome: "Eliminated in the round of 32",
    groupLegs: [
      ["PAN", "W", 1, 0],
      ["ENG", "D", 0, 0],
      ["CRO", "L", 1, 2],
    ],
    koLegs: [[87, "COL", "L", 0, 1]],
  },
];

const roundLabelOf = (n: number): string =>
  n <= 72 ? "Group" : (matchByNumber[n]?.round ?? "Knockout");

const KO_ROUND_NAME: Record<string, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  TP: "Third place",
  FINAL: "Final",
};

function buildJourney(team: TeamRecord): TeamJourney {
  const legs: JourneyLeg[] = [
    ...team.groupLegs.map(
      ([opponent, result, gf, ga], i): JourneyLeg => ({
        match: i + 1, // synthetic — group-stage match numbers aren't modeled here
        roundLabel: "Group",
        opponent,
        score: `${gf}–${ga}`,
        result,
        live: false,
      }),
    ),
    ...team.koLegs.map(([match, opponent, result, gf, ga]): JourneyLeg => {
      const round = roundLabelOf(match);
      return {
        match,
        roundLabel: KO_ROUND_NAME[round] ?? round,
        opponent,
        score: `${gf}–${ga}`,
        result,
        live: false,
      };
    }),
  ];
  return { code: team.code, name: team.name, outcomeLabel: team.outcome, legs };
}

export const TEAM_JOURNEYS_2026: Map<TeamCode, TeamJourney> = new Map(
  TEAMS.map((t) => [t.code, buildJourney(t)]),
);

// The 32 R32 occupants, keyed by slot — cross-checked against every given R32
// fixture (each resolved to exactly one match number via its slot's role:
// group winner/runner/third), so this placement is exact, not reconstructed.
export const SLOTS_2026: Record<SlotKey, TeamCode> = {
  "73:home": "RSA",
  "73:away": "CAN",
  "74:home": "GER",
  "74:away": "PAR",
  "75:home": "NED",
  "75:away": "MAR",
  "76:home": "BRA",
  "76:away": "JPN",
  "77:home": "FRA",
  "77:away": "SWE",
  "78:home": "CIV",
  "78:away": "NOR",
  "79:home": "MEX",
  "79:away": "ECU",
  "80:home": "ENG",
  "80:away": "COD",
  "81:home": "USA",
  "81:away": "BIH",
  "82:home": "BEL",
  "82:away": "SEN",
  "83:home": "POR",
  "83:away": "CRO",
  "84:home": "ESP",
  "84:away": "AUT",
  "85:home": "SUI",
  "85:away": "ALG",
  "86:home": "ARG",
  "86:away": "CPV",
  "87:home": "COL",
  "87:away": "GHA",
  "88:home": "AUS",
  "88:away": "EGY",
};

// Every knockout match, 73-104, match number -> winner. Spain beat Argentina
// 1-0 (AET) in the final (104); England took third beating France 4-6 (103).
export const RESULTS_2026: Record<number, TeamCode> = {
  73: "CAN",
  74: "PAR",
  75: "MAR",
  76: "BRA",
  77: "FRA",
  78: "NOR",
  79: "MEX",
  80: "ENG",
  81: "USA",
  82: "BEL",
  83: "POR",
  84: "ESP",
  85: "SUI",
  86: "ARG",
  87: "COL",
  88: "EGY",
  89: "FRA",
  90: "MAR",
  91: "NOR",
  92: "ENG",
  93: "ESP",
  94: "BEL",
  95: "ARG",
  96: "SUI",
  97: "FRA",
  98: "ESP",
  99: "ENG",
  100: "ARG",
  101: "ESP",
  102: "ARG",
  103: "ENG",
  104: "ESP",
};
