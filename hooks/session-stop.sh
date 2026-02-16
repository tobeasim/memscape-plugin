#!/usr/bin/env bash
# Memscape Stop hook
# Reminds Claude to call memscape_handoff before ending a session.

set -euo pipefail

INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stop_hook_active', False))" 2>/dev/null || echo "false")

# If this is the second stop attempt (after our reminder), allow it through
if [ "$STOP_ACTIVE" = "True" ] || [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

# Block the first stop and remind about handoff
cat <<'EOF'
{
  "decision": "block",
  "reason": "[Memscape] Before ending this session: if you did meaningful work, call memscape_handoff(scope, summary, decisions, nextSteps) to save your progress for the next session. If you already called memscape_handoff, or this was a trivial interaction (quick question, no code changes), you may stop without a handoff."
}
EOF

exit 0
