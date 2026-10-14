import { CircularBracket } from "@/components/circular-bracket";
import {
  RESULTS_2026,
  SLOTS_2026,
  TEAM_JOURNEYS_2026,
} from "@/components/widgets/bracket-2026-data";

// The real, completed 2026 World Cup — every R32 slot, every knockout result,
// and each team's actual run (tap a flag). Spain beat Argentina 1-0 (AET) in
// the final; England took third. See bracket-2026-data.ts for how this was
// cross-checked against the given results. No live predictions model is
// wired up yet (see backend/agents/wc26_chat/tools.py), so this is the
// tournament's real outcome rather than a forecast — there's nothing left to
// predict.
export function HomeBracket() {
  return (
    <CircularBracket
      slots={SLOTS_2026}
      results={RESULTS_2026}
      teamJourneys={TEAM_JOURNEYS_2026}
    />
  );
}
