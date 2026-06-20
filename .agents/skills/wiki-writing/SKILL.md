---
name: wiki-writing
description: Maintain durable project knowledge in the diving-app llm-wiki. Use when creating, updating, or reviewing `.wiki/wiki/` pages, when work changes app architecture, package responsibility, mobile/watch boundaries, Supabase schema or RLS, auth, sync behavior, domain models, dive-log terminology, safety rules, important decisions, or recurring pitfalls.
---

# Wiki Writing

## Purpose

Maintain durable project knowledge in `.wiki/wiki/`. Treat llm-wiki as a repository method, not a plugin.

The wiki should help future agents and developers understand architecture, domain concepts, module boundaries, important decisions, Supabase schema and RLS behavior, mobile/watch sync behavior, safety boundaries, and recurring pitfalls.

## Structure

Expected structure:

```txt
.wiki/
  raw/
    decisions/
    meetings/
    external-docs/
    code-notes/
  wiki/
    index.md
    overview.md
    architecture/
      monorepo.md
      mobile.md
      watch-app.md
      supabase.md
      sync-flow.md
    domains/
      diving-glossary.md
      dive-log.md
      safety-rules.md
    decisions/
      adr-index.md
    questions/
      open-questions.md
      resolved-questions.md
```

Create missing directories or pages only when the current wiki update needs them.

## Core Rules

- Only write durable knowledge.
- Do not write temporary TODOs, raw chat transcripts, speculative ideas, unaccepted implementation plans, obvious code details, duplicate README content, or short-lived debugging notes.
- Do not update the wiki for trivial refactors, formatting changes, typo fixes, or local-only experiments.
- Do not use OpenSpec unless the user explicitly asks for it.
- If something is uncertain, put it in `.wiki/wiki/questions/open-questions.md` instead of presenting it as fact.

## Source Order

Prefer sources in this order:

1. Explicit user instruction.
2. Current code.
3. Existing wiki.
4. README or docs.
5. `.wiki/raw/` materials.

Do not invent facts.

## Update Triggers

Update `.wiki/wiki/` when work changes:

- app architecture
- package responsibility
- mobile/watch-app boundary
- Supabase schema or RLS policy
- auth behavior
- sync behavior
- domain terminology
- dive log data model
- safety boundary
- important tradeoff or accepted decision
- recurring bug cause or pitfall

## Workflow

1. Identify what durable knowledge changed.
2. Read `.wiki/wiki/index.md`.
3. Read the relevant existing wiki pages.
4. Inspect code or source files if needed.
5. Update the smallest relevant set of pages.
6. Add new pages only when existing pages would become too broad.
7. Update `.wiki/wiki/index.md` if a new page is created.
8. Append a concise factual entry to `.wiki/wiki/log.md`; create it if missing.

## Page Format

Use this default format for normal pages:

```md
# Page Title

## Summary

Brief explanation.

## Current state

What is true now.

## Details

Important details.

## Related pages

- [[...]]
```

## Decision Format

Use this format for accepted decisions:

```md
# ADR: Decision title

## Status

Accepted

## Context

Why this decision exists.

## Decision

What was decided.

## Consequences

Tradeoffs and implications.

## Sources

- `path/to/source`
```

Add accepted decisions to `.wiki/wiki/decisions/adr-index.md`.

## Wiki Log Format

Append entries to `.wiki/wiki/log.md`:

```md
## YYYY-MM-DD - update type - title

- Updated:
  - `.wiki/wiki/...`
- Source:
  - `path/to/source`
- Summary:
  - Brief summary of what changed.
```

## Safety Boundary

This app is not a certified dive computer.

The wiki must not describe the app as:

- calculating decompression obligations
- replacing certified dive equipment
- giving life-critical underwater instructions
- treating unverified sensor data as safety-critical truth

The wiki may describe the app as:

- dive logging
- post-dive review
- companion recording
- historical summary
- non-critical reminders
- watch-captured activity sync

If a feature approaches life-critical diving behavior, record the risk in `.wiki/wiki/domains/safety-rules.md`.

## Style

- Write concise technical English unless the surrounding repository page uses Korean.
- Prefer factual statements, clear boundaries, source paths, short sections, and durable concepts.
- Avoid hype, vague claims, long essays, assumptions, and implementation noise.
