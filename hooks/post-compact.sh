#!/bin/bash
# Memscape SessionStart hook (compact)
# Re-injects Memscape workflow instructions after context compaction.
# During compaction, CLAUDE.md content and earlier tool-use context are lost.

cat <<'MEMSCAPE_CONTEXT'
[Memscape] Context was compacted — your earlier Memscape workflow instructions may have been lost. Here is a reminder of the tools you should continue using:

- memscape_remember(scope, text, category): Save important discoveries, decisions, pitfalls, and preferences as you work. Use the same scope from your session start.
- memscape_query(query): When stuck on an unfamiliar problem for more than a few minutes, search the collective knowledge base.
- memscape_contribute(text, context, domain): After solving a non-trivial problem (especially after failed attempts), share the insight. Include failedApproaches.
- memscape_validate(insightId): If a queried insight solved your problem, validate it to build community trust.
- memscape_handoff(scope, summary, decisions, nextSteps): Before ending the session, create a structured handoff so the next session can pick up where you left off.

Continue using these tools throughout the rest of this session.
MEMSCAPE_CONTEXT

exit 0
