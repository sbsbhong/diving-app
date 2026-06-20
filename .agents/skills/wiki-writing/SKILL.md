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

Normal page는 이 형식을 기본으로 사용한다:

```md
# Page Title

## 요약

짧은 설명.

## 현재 상태

현재 사실인 내용.

## 상세

중요한 세부 사항.

## 관련 문서

- [[...]]
```

## Decision Format

Accepted decision은 이 형식을 사용한다:

```md
# ADR: Decision title

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

`.wiki/wiki/log.md`에는 다음 형식으로 entry를 추가한다:

```md
## YYYY-MM-DD - update type - title

- 수정:
  - `.wiki/wiki/...`
- 근거:
  - `path/to/source`
- 요약:
  - 바뀐 내용의 짧은 요약.
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

- 이 저장소의 `.wiki/wiki/` 문서는 설명 문장을 한국어 중심으로 작성한다. 영어는 변수명, 함수명, package name, file path, command, schema/type/field name, enum value, product name처럼 그대로 써야 정확한 identifier와, 한국어로 옮기면 의미가 흐려지는 기술 용어에만 사용한다.
- 일반 설명에는 불필요한 영어 명사를 섞지 않는다. 예를 들어 `boundary`, `surface`, `current state`, `durable knowledge`처럼 한국어로 자연스럽게 설명할 수 있는 말은 `경계`, `화면`, `현재 상태`, `오래 유지할 지식`처럼 한국어로 쓴다.
- 사실 중심 문장, 명확한 경계, source path, 짧은 section, 오래 유지할 개념을 선호한다.
- 과장, 모호한 주장, 긴 에세이, 추정, 구현 소음은 피한다.
