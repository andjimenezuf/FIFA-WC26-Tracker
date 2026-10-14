from datetime import datetime, timedelta, timezone

from google.adk.agents.readonly_context import ReadonlyContext

from .system_prompt import SYSTEM_PROMPT

# Tournament days roll over at 07:00 UTC so late Americas kickoffs stay on the
# intended day. Mirrors agent/lib/time.ts in the TS port.
_DAY_ROLLOVER_UTC_HOUR = 7
TOURNAMENT_DAY_ROLLOVER_UTC = "07:00 UTC"


def tournament_day(moment: datetime) -> str:
    shifted = moment - timedelta(hours=_DAY_ROLLOVER_UTC_HOUR)
    return shifted.date().isoformat()


def _live_context(client_timezone: str | None) -> str:
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat(timespec="seconds").replace("+00:00", "Z")
    user_zone_note = (
        f'The user\'s own IANA time zone is "{client_timezone}".'
        if client_timezone
        else "The user's IANA time zone wasn't provided this session — ask which "
        "city/zone they mean before stating a local time, rather than guessing."
    )
    return "\n".join(
        [
            f"Now (UTC): {now_iso}. Today is {tournament_day(now)} (tournament day, "
            f"rolls over at {TOURNAMENT_DAY_ROLLOVER_UTC}). A match's day is given by "
            "the tools — never read it off a kickoff's UTC timestamp.",
            f"{user_zone_note} Before stating a kickoff's date or time, call "
            "convert_time with the kickoff iso and a time zone — the user's own "
            "by default, or the stadium (venueTz) / a named city if they ask for "
            "that.",
            "Write that date/time once, INSIDE a <local-time> tag, as part of the "
            'sentence — e.g. "Argentina plays <local-time '
            'iso=\"2026-07-03T22:00:00Z\">Friday at 3 PM</local-time>." Don\'t repeat '
            "the time outside the tag and don't add a zone label like \"(local time)\"; "
            "it's already the reader's local time and a tap reveals the zones. For "
            '"how long until/since", just say it in words.',
        ]
    )


# ADK re-invokes an `instruction` callable on every turn (it takes a
# ReadonlyContext, not a cached value), so a plain function gives "always know
# the current day" with no extra event wiring — same as the TS InstructionProvider.
def build_instruction(context: ReadonlyContext) -> str:
    client_timezone = context.state.get("client_timezone")
    return f"{SYSTEM_PROMPT}\n\n# Live context\n\n{_live_context(client_timezone)}"
