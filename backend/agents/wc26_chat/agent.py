import os

from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.genai.types import GenerateContentConfig

from .instructions import build_instruction
from .tools import convert_time, matches, odds, outlook, predicted_scores, standings, timeline

# Routed through OpenRouter via LiteLlm rather than calling Gemini directly —
# needs OPENROUTER_API_KEY (backend/.env, see .env.example), not
# GOOGLE_API_KEY/GEMINI_API_KEY. Override the model with the LLM_MODEL env
# var; any OpenRouter-listed model works as "openrouter/<provider>/<model>".
# thinking_config (Gemini's reasoning-budget knob, used pre-OpenRouter to
# mirror eve's "reasoning: low") has no LiteLlm equivalent, so it's dropped —
# max_output_tokens still applies (LiteLlm maps it to max_completion_tokens).
MODEL = os.environ.get("LLM_MODEL", "openrouter/openai/gpt-4o-mini")

# ADK has no session-wide token budget of its own (eve's `limits`,
# maxInputTokensPerSession / maxOutputTokensPerSession); only the per-request
# config below. Revisit with a callback tracking cumulative usage in session
# state if that guardrail is still wanted.
root_agent = Agent(
    name="wc26_chat",
    model=LiteLlm(model=MODEL),
    description="Answers questions about the 2026 World Cup: fixtures, standings, and forecasts.",
    instruction=build_instruction,
    tools=[matches, standings, outlook, predicted_scores, odds, timeline, convert_time],
    generate_content_config=GenerateContentConfig(max_output_tokens=4096),
)
