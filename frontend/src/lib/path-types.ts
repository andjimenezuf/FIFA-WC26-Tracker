// Pure type definitions lifted from lib/predictions/team-path.ts (the TS
// reference implementation, not yet ported to Python — see backend/agents/
// wc26_chat/tools.py). circular-bracket.tsx and cell-path-explain.tsx only
// need the *shapes*, not team-path.ts's live computation (which depends on
// a Predictions snapshot this frontend doesn't fetch yet), so just the
// interfaces are copied here rather than the whole module.

import type { Round } from "@/lib/tournament";

export interface PathOpponent {
  code: string;
  name: string;
  probability: number; // P(this is the opponent | team reaches the round)
}

// One match on the way to a target round: the likely opponents and the
// running chance to reach the next round once it's won.
export interface PathLeg {
  round: Round;
  opponents: PathOpponent[];
  reachNext: number;
}

// The chain of matches a team must win to reach `targetRound`, ending at the
// cell's own probability.
export interface CellPath {
  code: string;
  name: string;
  targetRound: Round;
  reachProbability: number;
  dependsOnGroup: boolean;
  legs: PathLeg[];
}
