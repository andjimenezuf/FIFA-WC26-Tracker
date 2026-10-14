"""The 7 tools wc26_chat calls.

The 2026 World Cup is over, so every tool here answers from the real, final
data in data.py (all 104 matches, all 48 teams, every match's goals/cards/subs)
— no live ESPN/Polymarket fetching at runtime, no Bradley-Terry forecasting
model. Those were the original TS repo's approach for a tournament still in
progress; re-porting that machinery here would mean "live" and "forecast"
code paths with nothing left to be live or to forecast. The event data itself
did come from ESPN, but as a one-time historical pull (see
scripts/export_timeline_2026.py) baked into timeline_2026.json, not a call
this app makes while running. `predicted_scores` and `odds` are kept as tools
(so the system prompt's routing still resolves) but now just report the real
result instead of a probability.

Docstrings here double as the tool description the model sees (ADK takes
`func.__doc__` verbatim, with no Args-section parsing).
"""

from datetime import datetime, timezone
from typing import Annotated, Literal, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field

from .data import (
    FINAL_MATCH_NUMBER,
    MATCHES,
    TEAMS,
    TIMELINES,
    TOURNAMENT_END_ISO,
    compute_standings,
    matches_for_team,
    outcome_rank,
    rank_thirds,
    team_code_by_name_or_code,
)

GroupLetter = Literal[
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"
]

TOURNAMENT_OVER_NOTE = (
    f"The 2026 World Cup ended {TOURNAMENT_END_ISO[:10]} — every match (1-104) "
    "is final. There are no live, today, or upcoming games anymore."
)


def convert_time(
    iso: Annotated[
        str,
        Field(description="Kickoff instant as UTC ISO 8601, e.g. 2026-07-01T01:00:00Z."),
    ],
    time_zone: Annotated[
        str, Field(description="IANA zone to convert to, e.g. America/Los_Angeles.")
    ],
) -> dict:
    """Convert a UTC kickoff instant into a time zone: its local weekday, date, clock time (12h and 24h), and whether it's today/tomorrow/yesterday there. Use it to state a kickoff in the user's own time (their IANA zone is in the client context) or a place they ask about, then write the day/time yourself and wrap the instant in a <local-time> tag."""
    try:
        moment = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
    except ValueError:
        return {"error": f"Invalid iso: {iso}."}

    try:
        zone = ZoneInfo(time_zone)
    except ZoneInfoNotFoundError:
        return {"error": f"Unknown time zone: {time_zone}."}

    local = moment.astimezone(zone)
    today_in_zone = datetime.now(zone).date()
    diff_days = (local.date() - today_in_zone).days
    relative_day = {0: "today", 1: "tomorrow", -1: "yesterday"}.get(diff_days)

    hour12 = local.hour % 12 or 12
    period = "AM" if local.hour < 12 else "PM"

    return {
        "relativeDay": relative_day,
        "weekday": local.strftime("%A"),
        "date": f"{local.strftime('%B')} {local.day}",
        "time24": f"{local.hour:02d}:{local.minute:02d}",
        "time12": f"{hour12}:{local.minute:02d} {period}",
    }


def _score_str(home: int | None, away: int | None) -> Optional[str]:
    return None if home is None or away is None else f"{home}–{away}"


def _match_view(m: dict) -> dict:
    return {
        "number": m["number"],
        "round": m["round"],
        "group": m["group"],
        "home": m["home"]["name"],
        "away": m["away"]["name"],
        "status": "final",
        "score": _score_str(m["home"]["score"], m["away"]["score"]),
        "kickoff": m["kickoffAt"],
        "venue": m["venue"],
        "venueTz": m["venueTz"],
    }


def matches(
    team: Annotated[
        Optional[str],
        Field(description="Only matches involving this team (name or FIFA code)."),
    ] = None,
    match_numbers: Annotated[
        Optional[list[int]],
        Field(description="Only these FIFA match numbers (1-104)."),
    ] = None,
    venue: Annotated[
        Optional[str], Field(description="Only matches at this stadium or city (substring).")
    ] = None,
    status: Annotated[
        Optional[Literal["scheduled", "live", "final"]],
        Field(description="Only matches in this state."),
    ] = None,
    when: Annotated[
        Optional[Literal["today", "next", "upcoming", "past"]],
        Field(
            description="Only today's, the soonest future kickoff (next), still-upcoming, or already-played matches."
        ),
    ] = None,
) -> dict:
    """World Cup fixtures and results: who plays whom, kickoff, stadium, status, final score. Any schedule, fixture, result, venue, today/live, or date-range question — including a game between two named teams. For goals and cards use timeline instead. The tournament is over, so every match is final; `status` other than final and `when` other than past/None both return an empty list. ALWAYS follow with ONE `match` block; its body is ONLY match numbers, `today`, or `live` — for anything else, list this result's match numbers."""
    if status not in (None, "final") or when in ("today", "next", "upcoming"):
        return {"tournamentStatus": TOURNAMENT_OVER_NOTE, "matches": []}

    code = team_code_by_name_or_code(team) if team else None
    if team and not code:
        return {"tournamentStatus": TOURNAMENT_OVER_NOTE, "matches": [], "error": f"No team matches {team!r}."}

    results = []
    for m in sorted(MATCHES.values(), key=lambda m: m["number"]):
        if match_numbers and m["number"] not in match_numbers:
            continue
        if code and code not in (m["home"]["code"], m["away"]["code"]):
            continue
        if venue and venue.casefold() not in m["venue"].casefold():
            continue
        results.append(_match_view(m))

    return {"tournamentStatus": TOURNAMENT_OVER_NOTE, "matches": results}


def standings(
    groups: Annotated[
        Optional[list[GroupLetter]],
        Field(description="Group letters, A-L. Omit for all twelve groups."),
    ] = None,
    thirds: Annotated[
        Optional[bool],
        Field(description="Set true for the third-place qualification race."),
    ] = None,
) -> dict:
    """World Cup group tables and the third-place race. Pass group letters for those standings (one call covers several; omit for all twelve), or thirds:true for the twelve third-placed teams ranked by Round-of-32 qualification. These are the real final tables, not a projection. ALWAYS follow with the widget block: `group` (body: the letter) or `thirds` (body: `show`, never blank)."""
    if thirds:
        return {"thirds": rank_thirds()}

    wanted = groups if groups else list("ABCDEFGHIJKL")
    qualifying_thirds = {t["code"] for t in rank_thirds() if t["qualifies"]}
    out = []
    for letter in sorted(set(wanted)):
        table = compute_standings(letter)
        teams_out = [
            {
                "team": row["name"],
                "qualified": i < 2 or row["code"] in qualifying_thirds,
                "stats": {
                    "played": row["played"],
                    "won": row["won"],
                    "drawn": row["drawn"],
                    "lost": row["lost"],
                    "goalsFor": row["goalsFor"],
                    "goalsAgainst": row["goalsAgainst"],
                    "goalDiff": row["goalDiff"],
                    "points": row["points"],
                },
            }
            for i, row in enumerate(table)
        ]
        out.append({"group": f"Group {letter}", "teams": teams_out})
    return {"groups": out}


def outlook(
    team: Annotated[
        Optional[str], Field(description="A team name or code, for its outlook and route.")
    ] = None,
    group: Annotated[
        Optional[GroupLetter], Field(description="A group letter, A-L, for its advancement odds.")
    ] = None,
    top: Annotated[
        Optional[int], Field(description="Show the N title favourites.", ge=1, le=24)
    ] = None,
    slot: Annotated[
        Optional[int],
        Field(description="A knockout match number, for who's likely to play in it.", ge=73, le=104),
    ] = None,
    bracket: Annotated[
        Optional[bool],
        Field(description="The market's whole projected bracket, summarized — one call covers every round."),
    ] = None,
) -> dict:
    """How far World Cup teams actually went over the whole tournament — never a single game (that's matches or odds). The tournament is over, so this reports the real outcome, not a forecast: a team's real final placement and route; a group's real qualifiers; top:N for the real final standings; slot:<73-104> for who actually played that match; bracket:true for the real semifinals/final/champion in ONE call. ALWAYS follow with the matching widget block: `chances` (body: team names or `top: N`), `path` (the team), `slot` (the match number), or `bracket` (body: `show`, never blank)."""
    if slot:
        m = MATCHES[slot]
        return {"kind": "slot", "match": slot, **_match_view(m)}

    if bracket:
        semis = [_match_view(MATCHES[101]), _match_view(MATCHES[102])]
        third_place = _match_view(MATCHES[103])
        final = _match_view(MATCHES[FINAL_MATCH_NUMBER])
        champion_code = final["home"] if MATCHES[FINAL_MATCH_NUMBER]["winner"] == "home" else final["away"]
        return {
            "kind": "bracket",
            "semifinals": semis,
            "thirdPlace": third_place,
            "final": final,
            "champion": champion_code,
        }

    if team:
        code = team_code_by_name_or_code(team)
        if not code:
            return {"kind": "team", "error": f"No team matches {team!r}."}
        info = TEAMS[code]
        route = []
        for m in matches_for_team(code):
            is_home = m["home"]["code"] == code
            own_side, opp_side = (m["home"], m["away"]) if is_home else (m["away"], m["home"])
            route.append(
                {
                    "match": m["number"],
                    "round": m["round"],
                    "opponent": opp_side["name"],
                    "score": _score_str(own_side["score"], opp_side["score"]),
                    "won": None if m["winner"] in (None, "draw") else m["winner"] == ("home" if is_home else "away"),
                }
            )
        return {"kind": "team", "name": info["name"], "group": info["group"], "outcome": info["outcome"], "route": route}

    if group:
        table = compute_standings(group)
        return {"kind": "group", "group": group, "teams": [{"name": r["name"], "points": r["points"]} for r in table]}

    ranked = sorted(TEAMS.values(), key=lambda t: (outcome_rank(t["code"]), t["name"]))
    return {
        "kind": "favorites",
        "teams": [{"name": t["name"], "outcome": t["outcome"]} for t in ranked[: top or 8]],
    }


def predicted_scores(
    match: Annotated[
        Optional[int],
        Field(description="FIFA knockout match number, 73-104.", ge=73, le=104),
    ] = None,
    team_a: Annotated[Optional[str], Field(description="First team name or code.")] = None,
    team_b: Annotated[Optional[str], Field(description="Second team name or code.")] = None,
) -> dict:
    """The real final score of ONE knockout match (73-104) — the tournament is over, so there's nothing left to forecast; this used to be a market-predicted scoreline matrix, now it's just the result. Give a match number or two team names/codes. Answer in prose with the real score, NO widget — there's no matrix to show anymore."""
    m = MATCHES.get(match) if match else None
    if not m and team_a and team_b:
        code_a, code_b = team_code_by_name_or_code(team_a), team_code_by_name_or_code(team_b)
        if code_a and code_b:
            m = next(
                (
                    cand
                    for cand in MATCHES.values()
                    if cand["number"] >= 73
                    and {cand["home"]["code"], cand["away"]["code"]} == {code_a, code_b}
                ),
                None,
            )
    if not m:
        return {"kind": "none", "error": "No knockout match found for that match number or pairing."}
    return {"kind": "result", **_match_view(m)}


class Matchup(BaseModel):
    match: Annotated[
        Optional[int], Field(description="FIFA match number, 1-104.", ge=1, le=104)
    ] = None
    team_a: Annotated[Optional[str], Field(description="First team name or code.")] = None
    team_b: Annotated[Optional[str], Field(description="Second team name or code.")] = None


def odds(
    matchups: Annotated[
        list[Matchup], Field(description="The matchups to look up.", min_length=1)
    ],
) -> dict:
    """The real result of one or more matchups — answered in prose, NO widget. The tournament is over, so there are no odds to give anymore, only what actually happened. Each matchup is two team names/codes, or a match number. If the two teams never played each other this tournament, says so rather than guessing. For how far a team went overall, use outlook."""
    results = []
    for mu in matchups:
        m = MATCHES.get(mu.match) if mu.match else None
        if not m and mu.team_a and mu.team_b:
            code_a, code_b = team_code_by_name_or_code(mu.team_a), team_code_by_name_or_code(mu.team_b)
            if code_a and code_b:
                m = next(
                    (
                        cand
                        for cand in MATCHES.values()
                        if {cand["home"]["code"], cand["away"]["code"]} == {code_a, code_b}
                    ),
                    None,
                )
        if not m:
            results.append({"match": mu.match, "team_a": mu.team_a, "team_b": mu.team_b, "error": "They never played each other this tournament."})
        else:
            results.append(_match_view(m))
    return {"results": results}


def timeline(
    match_numbers: Annotated[
        list[int],
        Field(description="FIFA match numbers (1-104), up to 4.", min_length=1, max_length=4),
    ],
) -> dict:
    """Goals, cards, and substitutions for one or more matches, by FIFA match number (look numbers up with matches first if you only have team names). Answered in prose, no widget. For the schedule or final score itself, use matches."""
    timelines = []
    for n in match_numbers:
        events = TIMELINES.get(n, [])
        team_names = {
            e["team"]: TEAMS[e["team"]]["name"] if e["team"] in TEAMS else e["team"]
            for e in events
        }
        timelines.append(
            {
                "number": n,
                "events": [
                    {
                        "minute": e["minute"],
                        "type": e["type"],
                        "team": team_names[e["team"]],
                        "player": e["player"],
                    }
                    for e in events
                ],
            }
        )
    return {"timelines": timelines}
