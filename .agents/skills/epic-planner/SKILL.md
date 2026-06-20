---
name: epic-planner
description: Use for epic-sized work that must be split into phases before coding. Requires phase plans with goal, files, implementation, gate, and risk, and prevents immediate implementation until the plan exists.
---

# Epic Planner

Use this skill for large features, cross-package changes, native integration, or work with unclear sequencing.

## Git Context

Apps under `apps/` use the super-repo root `.git`; they do not own independent Git repositories. Run `git status`, `git diff`, and touched-file reporting from the super-repo root. If `git rev-parse --show-toplevel` fails inside this checkout, locate the super-repo root before claiming Git metadata is unavailable.

## Rule

Do not start coding an epic immediately. First write or update a phase plan using `PLANS.md`.

## Phase Format

Each phase must include:

- Goal: the outcome of the phase
- Files: expected files or directories touched
- Implementation: concrete work items
- Gate: command or manual check required to leave the phase
- Risk: known uncertainty, rollback concern, or environment dependency

## Default Phases

1. Phase 0 Investigation
2. Phase 1 Contract
3. Phase 2 Core Implementation
4. Phase 3 Integration
5. Phase 4 Cleanup/Review

## Stop Rule

If the same gate fails three times with the same root cause, stop and report a blocker instead of continuing speculative fixes.
