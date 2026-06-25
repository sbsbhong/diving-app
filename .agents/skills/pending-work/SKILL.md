---
name: pending-work
description: Summarize remaining, unresolved, or next implementation work in the diving-app repository. Use when the user asks what is left, what remains to do, next priorities, pending tasks, open questions, pre-device-test work, real-device validation gaps, or implementation backlog for this project.
---

# Pending Work

## Overview

Report the current remaining work for `diving-app` from durable project sources. Prefer implemented facts from code and wiki over stale plan checkboxes.

## Workflow

1. Read the repository context before answering:
   - `AGENTS.md`
   - `.wiki/wiki/index.md`
   - `.wiki/wiki/architecture/implementation-priorities.md`
   - `.wiki/wiki/questions/open-questions.md`
   - relevant `.wiki/wiki/architecture/*.md` and `.wiki/wiki/domains/*.md`
   - recent `docs/superpowers/specs/*-design.md` files when the user asks about approved but unimplemented work
2. Check current code state for drift:
   - `git status --short`
   - `rg -n "TODO|FIXME|not implemented|미구현|검증|후속|남은|pending" README.md .wiki docs apps packages -g '!node_modules'`
3. Treat old `docs/superpowers/plans/*.md` checkbox lists as historical unless the current wiki or code still confirms them.
4. Separate the answer into:
   - completed or already implemented foundations
   - approved but not implemented work
   - open questions and real-device validation gaps
   - recommended next 1-3 tasks
5. Include file references for claims that may affect implementation priority.

## Project Rules

- Do not claim commands passed unless they were actually run.
- Do not report speculative ideas as approved work.
- Preserve the safety boundary: this app is not a certified dive computer, decompression computer, medical device, emergency system, or certified equipment replacement.
- For scuba-related pending work, distinguish non-certified reference assistant behavior from safety-critical computation.
- For sync-related pending work, distinguish local repository import from future Supabase or cloud sync.

## Output Shape

Keep the response short and actionable. Prefer this structure:

- 현재 남은 큰 작업
- 실기기 검증 전 우선순위
- 열린 질문/검증 필요
- 다음에 바로 할 일

When priorities conflict, put real-device WatchConnectivity validation, contract safety boundaries, and data-loss/migration decisions before visual polish.
