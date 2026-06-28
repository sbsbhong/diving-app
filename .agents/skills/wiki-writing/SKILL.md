---
name: wiki-writing
description: Repository-specific companion rules for maintaining the diving-app Karpathy LLM Wiki. Use with karpathy-llm-wiki when creating, updating, querying, linting, or reviewing `.wiki/raw/` and `.wiki/wiki/`, especially when work changes app architecture, package responsibility, mobile/watch boundaries, Supabase schema or RLS, auth, sync behavior, domain models, dive-log terminology, safety rules, important decisions, or recurring pitfalls.
---

# Wiki Writing

## Purpose

This is the repository-specific adapter for `.agents/skills/karpathy-llm-wiki/SKILL.md`.

Use `karpathy-llm-wiki` as the canonical workflow for Ingest, Query, Lint, Archive, article metadata, index updates, raw preservation, and log format. Use this skill only to apply `diving-app` scope, language, and safety rules.

The wiki should help future agents and developers understand architecture, domain concepts, module boundaries, important decisions, future Supabase schema and RLS behavior, mobile/watch sync behavior, safety boundaries, and recurring pitfalls.

## Repository Root

```txt
.wiki/
  raw/
    <topic>/
      <source>.md
  wiki/
    index.md
    log.md
    <topic>/
      <article>.md
```

In this repository, `.wiki/` is the Karpathy wiki root. Do not create top-level `raw/` or `wiki/` directories at the repository root.

`.wiki/wiki/` supports one level of topic directories only. Root-level compiled pages other than `index.md` and `log.md` are not used.

Current topics include `project`, `architecture`, `domains`, `design`, `decisions`, and `questions`. Reuse an existing topic unless a source introduces a genuinely distinct long-lived concept.

## Core Rules

- Only write durable knowledge.
- Do not write temporary TODOs, raw chat transcripts, speculative ideas, unaccepted implementation plans, obvious code details, duplicate README content, or short-lived debugging notes.
- Do not update the wiki for trivial refactors, formatting changes, typo fixes, or local-only experiments.
- Do not use OpenSpec unless the user explicitly asks for it.
- If something is uncertain, put it in `.wiki/wiki/questions/open-questions.md` instead of presenting it as fact.
- Preserve source material in `.wiki/raw/` before changing compiled articles. Do not modify existing raw files.
- Use standard markdown relative links inside `.wiki/wiki/`; do not use Obsidian double-bracket links in compiled articles.
- Generated contract output is not source material for manual rewrite. If contract facts change, cite schema/generator/source files and regenerate outputs through the proper package scripts.

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

1. Read `.agents/skills/karpathy-llm-wiki/SKILL.md`.
2. Read `.wiki/wiki/index.md` and the relevant compiled articles.
3. Fetch or capture the source into `.wiki/raw/<topic>/...` using the Karpathy raw template.
4. Update the smallest relevant compiled article set under `.wiki/wiki/<topic>/...`.
5. Refresh each touched article's `Updated:` date when its knowledge content changes.
6. Update `.wiki/wiki/index.md` for every touched article.
7. Append `.wiki/wiki/log.md` using the Karpathy log header format.
8. Run the smallest relevant verification gate; for wiki or architecture-rule changes, use `yarn codex:check` when feasible.

## Page Format

Compiled articles use the Karpathy article metadata fields:

```md
# Page Title

Sources: <source name/date>; <source name/date>
Raw: [source title](../../raw/<topic>/<source>.md)
Updated: YYYY-MM-DD

## 요약

짧은 설명.

## 현재 상태

현재 사실인 내용.

## 상세

중요한 세부 사항.

## 관련 문서

- [Article title](../topic/article.md)
```

Use Korean section names in article bodies unless the page is an ADR or imported archive whose native format is clearer.

## Decision Format

Accepted decisions are normal compiled articles with Karpathy metadata, then this body format:

```md
# ADR: Decision title

Sources: <source name/date>
Raw: [source title](../../raw/decisions/<source>.md)
Updated: YYYY-MM-DD

## Status

Accepted

## Context

이 결정이 필요한 이유.

## Decision

결정한 내용.

## Consequences

Tradeoff와 영향.

## Sources

- `path/to/source`
```

Add accepted decisions to `.wiki/wiki/decisions/adr-index.md`.

## Wiki Log Format

Use the Karpathy operation log format:

```md
## [YYYY-MM-DD] ingest | <primary article title>
- Updated: <cascade-updated article title>
```

Use `query | Archived: <page title>` for archived query answers and `lint | <N> issues found, <M> auto-fixed` for lint runs.

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

- 이 저장소의 `.wiki/wiki/` 문서는 설명 문장을 한국어 중심으로 작성한다. 영어는 변수명, 함수명, package name, file path, command, schema/type/field name, enum value, product name처럼 그대로 써야 정확한 identifier와, 한국어로 옮기면 의미가 흐려지는 기술 용어에만 사용한다.
- 일반 설명에는 불필요한 영어 명사를 섞지 않는다. 예를 들어 `boundary`, `surface`, `current state`, `durable knowledge`처럼 한국어로 자연스럽게 설명할 수 있는 말은 `경계`, `화면`, `현재 상태`, `오래 유지할 지식`처럼 한국어로 쓴다.
- 사실 중심 문장, 명확한 경계, source path, 짧은 section, 오래 유지할 개념을 선호한다.
- 과장, 모호한 주장, 긴 에세이, 추정, 구현 소음은 피한다.
