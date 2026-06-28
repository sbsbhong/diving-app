# 다이빙 용어

Sources: pre-Karpathy wiki page, 2026-06-28
Raw: [Pre-Karpathy: 다이빙 용어](../../raw/domains/diving-glossary.md)
Updated: 2026-06-28

## 요약

이 glossary는 현재 앱에서 오래 유지할 domain 용어를 정의한다. 정의 범위는 레크리에이션 기록과 확인이며, certified dive-computer behavior가 아니다.

## 현재 상태

앱은 watch capture, 모바일 확인, 계획 알림, sync contract에서 아래 용어를 사용한다.

## 상세

- Dive log: 레크리에이션 다이빙 세션의 과거 기록.
- Watch capture: watch에서 기록한 세션 데이터. 현재 앱에서는 mock depth sample 기반 흐름이 사용된다.
- Depth sample: meter 단위 depth와 timestamp를 가진 측정값. Shared contract에서는 optional pressure와 water temperature를 포함할 수 있다.
- Bottom time: 확인용 elapsed session duration. 감압 계산이 아니다.
- Max depth: 세션에서 기록된 가장 깊은 depth sample.
- Average depth: 기록된 depth sample의 arithmetic average.
- Water temperature: sample에 붙거나 review summary로 계산되는 temperature value.
- Ascent-rate reminder: depth sample 변화에서 파생되는 non-certified assistant state.
- Safety-stop assistant: shallow-depth stop window 주변의 non-certified reminder state. Mandatory safety guidance가 아니다.
- Surface interval: 이전 logged dive 이후 elapsed time. Planning context로만 사용한다.
- No-fly reminder: manual planning reminder. Medical 또는 certified aviation/diving recommendation이 아니다.
- Sync status: 세션이 `pending`, `synced`, `failed` 중 어디에 있는지 나타내는 local state.
- Dive mode: 현재 active session category는 `scuba`와 `freedive`다.
- Water condition: `calm`, `mild`, `choppy`, `surge`, `current`, `unknown` 같은 subjective post-dive condition.

## 관련 문서

- [다이브 로그 도메인](dive-log.md)
- [안전 규칙](safety-rules.md)
- [동기화 흐름 구조](../architecture/sync-flow.md)
