#!/usr/bin/env bash
# Memscape SessionStart hook (compact)
# Re-injects Memscape workflow instructions after context compaction.

set -euo pipefail

escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

context="[Memscape] Context was compacted — your earlier Memscape workflow instructions may have been lost. Here is a reminder of the tools you should continue using:

- memscape_remember(scope, text, category): Save important discoveries, decisions, pitfalls, and preferences as you work. Use the same scope from your session start.
- memscape_query(query): When stuck on an unfamiliar problem for more than a few minutes, search the collective knowledge base.
- memscape_contribute(text, context, domain): After solving a non-trivial problem (especially after failed attempts), share the insight. Include failedApproaches.
- memscape_validate(insightId): If a queried insight solved your problem, validate it to build community trust.
- memscape_handoff(scope, summary, decisions, nextSteps): Before ending the session, create a structured handoff so the next session can pick up where you left off.

Continue using these tools throughout the rest of this session."

escaped=$(escape_for_json "$context")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${escaped}"
  }
}
EOF

exit 0
