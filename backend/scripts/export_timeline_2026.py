"""One-off export of real goal/card/substitution events for all 104 matches of
the (now-concluded) 2026 World Cup, from ESPN's public match-summary feed —
the same feed lib/results/match-detail.ts (TS reference) reads live. ESPN
keeps this data for finished events, so this is a one-time historical pull,
not something the running app repeats. Run from backend/, .venv activated:

    python scripts/export_timeline_2026.py

event_ids_2026.json (FIFA match number -> ESPN event id) is lifted verbatim
from lib/results/index.ts's EVENT_IDS table. Writes
agents/wc26_chat/data/timeline_2026.json.
"""

import json
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
DATA_DIR = HERE.parent / "agents" / "wc26_chat" / "data"
API = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary"

EVENT_IDS: list[str] = json.loads((HERE / "event_ids_2026.json").read_text())

# ESPN's team names that don't match our FIFA-style names in teams_2026.json.
NAME_ALIASES = {
    "Korea Republic": "South Korea",
    "IR Iran": "Iran",
    "USA": "United States",
    "Czech Republic": "Czechia",
    "Cape Verde Islands": "Cape Verde",
    "Congo DR": "DR Congo",
    "Bosnia and Herzegovina": "Bosnia & Herzegovina",
    "Bosnia-Herzegovina": "Bosnia & Herzegovina",
}

TEAMS = json.loads((DATA_DIR / "teams_2026.json").read_text())
NAME_TO_CODE = {t["name"]: t["code"] for t in TEAMS}


def resolve_team(espn_name: str | None) -> str | None:
    if not espn_name:
        return None
    name = NAME_ALIASES.get(espn_name, espn_name)
    return NAME_TO_CODE.get(name)


def classify(incident: dict) -> str | None:
    if incident.get("ownGoal"):
        return "own_goal"
    if incident.get("scoringPlay"):
        return "penalty_goal" if incident.get("penaltyKick") else "goal"
    t = (incident.get("type") or {}).get("type", "")
    if incident.get("redCard") or t == "red-card":
        return "red_card"
    if incident.get("yellowCard") or t == "yellow-card":
        return "yellow_card"
    if "substitution" in t:
        return "substitution"
    return None


def player_name(incident: dict) -> str | None:
    participants = incident.get("participants") or []
    if not participants:
        return None
    athlete = (participants[0] or {}).get("athlete") or {}
    return athlete.get("displayName")


def fetch_match(match_number: int) -> list[dict]:
    event_id = EVENT_IDS[match_number - 1]
    with urllib.request.urlopen(f"{API}?event={event_id}", timeout=15) as resp:
        summary = json.loads(resp.read())

    competition = (summary.get("header", {}).get("competitions") or [{}])[0]
    raw_events = summary.get("keyEvents") or competition.get("details") or []

    events = []
    unresolved_names: set[str] = set()
    for incident in raw_events:
        kind = classify(incident)
        if not kind:
            continue
        team_name = (incident.get("team") or {}).get("displayName")
        code = resolve_team(team_name)
        if team_name and not code:
            unresolved_names.add(team_name)
        events.append(
            {
                "minute": (incident.get("clock") or {}).get("displayValue") or None,
                "type": kind,
                "team": code or team_name,
                "player": player_name(incident),
            }
        )
    if unresolved_names:
        print(f"  match {match_number}: unresolved team name(s): {unresolved_names}")
    return events


def main() -> None:
    timelines: dict[str, list[dict]] = {}
    for n in range(1, 105):
        try:
            timelines[str(n)] = fetch_match(n)
        except Exception as exc:  # noqa: BLE001 - this is a throwaway data script
            print(f"match {n}: FAILED ({exc})")
            timelines[str(n)] = []
        if n % 10 == 0:
            print(f"...fetched {n}/104")
        time.sleep(0.25)

    total_events = sum(len(v) for v in timelines.values())
    empty = sum(1 for v in timelines.values() if not v)
    print(f"Total events: {total_events}, matches with zero events: {empty}")

    out_path = DATA_DIR / "timeline_2026.json"
    out_path.write_text(json.dumps(timelines, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
