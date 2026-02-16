#!/usr/bin/env bash
# Memscape PreCompact hook
# Reminds Claude to save key context via memscape_remember before compaction.

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

context="[Memscape] Context is about to be compacted. Before it happens, consider: have you made important discoveries, decisions, or hit pitfalls during this session that are not yet saved?

If yes, call memscape_remember(scope, text, category) NOW for each important item. After compaction, your earlier conversation context will be compressed and details may be lost — but memories persist across sessions.

Categories: preference, session-learning, decision, pitfall, process-note"

escaped=$(escape_for_json "$context")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "${escaped}"
  }
}
EOF

exit 0
