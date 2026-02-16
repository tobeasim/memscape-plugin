#!/bin/bash
# Memscape SessionStart hook (startup|resume)
# Injects a reminder for Claude to call memscape_resume before doing other work.

cat <<'MEMSCAPE_CONTEXT'
[Memscape] Session started. You MUST call memscape_resume(scope: "<project-scope>") NOW, before doing any other work.

How to determine the scope:
1. Check the project's CLAUDE.md for a "Memscape" section — it will specify the scope name.
2. If no scope is configured, use the project directory name as the scope.
3. If this is a general session (no project), ask the user what scope to use.

After resuming, if the user's request involves an unfamiliar problem, also call memscape_query to check if others have solved it.
MEMSCAPE_CONTEXT

exit 0
