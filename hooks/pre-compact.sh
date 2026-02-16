#!/bin/bash
# Memscape PreCompact hook
# Reminds Claude to save key context via memscape_remember before compaction erases it.

cat <<'MEMSCAPE_CONTEXT'
[Memscape] Context is about to be compacted. Before it happens, consider: have you made important discoveries, decisions, or hit pitfalls during this session that aren't yet saved?

If yes, call memscape_remember(scope, text, category) NOW for each important item. After compaction, your earlier conversation context will be compressed and details may be lost — but memories persist across sessions.

Categories: preference, session-learning, decision, pitfall, process-note
MEMSCAPE_CONTEXT

exit 0
