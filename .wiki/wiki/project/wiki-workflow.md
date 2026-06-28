# 위키 운영 방식

Sources: Karpathy LLM Wiki skill, 2026-06-28; pre-Karpathy wiki-writing skill, 2026-06-28; AGENTS guide, 2026-06-28
Raw: [Karpathy LLM Wiki skill](../../raw/project/karpathy-llm-wiki-skill.md); [Pre-Karpathy wiki-writing skill](../../raw/project/wiki-writing-skill.md); [Pre-Karpathy wiki index](../../raw/project/dive-app-wiki-index.md); [Agent Operating Guide wiki instructions](../../raw/project/agent-operating-guide.md)
Updated: 2026-06-28

## 요약

이 저장소의 장기 지식 저장소는 Karpathy LLM Wiki 방식으로 관리한다. 이 저장소에서는 project root 대신 `.wiki/`를 wiki root로 보고, immutable source는 `.wiki/raw/`, compiled article은 `.wiki/wiki/`에 둔다.

## 현재 상태

`.wiki/raw/`는 source material을 보존하는 영역이며, 한 번 저장한 raw file은 수정하지 않는다. `.wiki/wiki/`는 LLM이 유지하는 compiled knowledge article 영역이다. Root에는 `index.md`와 `log.md`만 두고, 일반 글은 `wiki/<topic>/<article>.md`처럼 topic directory 한 단계 아래에 둔다.

## 상세

새 source를 위키에 반영할 때는 항상 raw 저장과 compiled article 갱신을 함께 한다. 기존 article과 같은 core thesis면 해당 글에 merge하고, 새 concept이면 새 article을 만든다. 관련 article에 실제 영향이 있으면 cascade update를 수행하고 각 article의 Updated date를 갱신한다.

Article은 title 바로 아래에 `Sources:`, `Raw:`, `Updated:` field를 둔다. `Sources:`에는 사람, 조직, publication 또는 repository source와 date를 적고, `Raw:`에는 source raw file markdown link를 적는다. Article body는 한국어 중심의 설명 문장을 유지하되 code identifier, package name, file path, schema/type/field name은 원문을 쓴다.

`index.md`는 topic별 table을 유지한다. 한 article은 한 row로 나타내고, summary와 Updated date를 함께 둔다. `log.md`는 append-only operation log로 유지하며 새 ingest, archive, lint 작업은 Karpathy format의 header를 사용한다.

위키 내부 link는 Obsidian double-bracket link가 아니라 현재 file 기준의 standard markdown relative link를 사용한다. 대화에서 wiki article을 인용할 때만 project-root-relative path를 쓴다.

Safety boundary는 기존 repository guide와 같다. 이 앱은 certified dive computer, 감압 컴퓨터, 의료기기, 비상 판단 시스템이 아니며, 위키도 watch-captured data나 계획값을 safety-critical truth처럼 설명하지 않는다.

## 관련 문서

- [프로젝트 개요](overview.md)
- [안전 규칙](../domains/safety-rules.md)
- [열린 질문](../questions/open-questions.md)
