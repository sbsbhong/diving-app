# Diving App / Overview

Sources: user pasted request, 2026-06-28; user pasted hardening request, 2026-06-28; user requested v1 Air-only safety stop scope, 2026-06-28
Raw: [Diving app technical wiki request](../../raw/algorithms/2026-06-28-diving-app-technical-wiki-request.md); [Diving app wiki hardening request](../../raw/algorithms/2026-06-28-diving-app-wiki-hardening-request.md); [v1 Air-only scuba safety stop scope](../../raw/project/2026-06-28-v1-air-only-scuba-safety-stop.md)
Updated: 2026-06-28
Status: Reference / Draft
Owner: local product/dev agent
Last reviewed: 2026-06-28
Change policy: overview can change with documented rationale
Related pages: [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md); [Diving App / Product Roadmap](diving-app-product-roadmap.md); [Diving App / QA and Test Plan](diving-app-qa-test-plan.md); [Diving App / Non-Negotiable Safety Rules](../domains/diving-app-non-negotiable-safety-rules.md)
Slug: diving-app-overview

## 요약

이 문서는 Apple Watch Ultra급 워치에서 동작하는 프리다이빙/레크리에이션 스쿠버 앱의 제품 방향을 정리한다. 현재 저장소의 구현 상태를 뜻하지 않으며, 전문 다이브 컴퓨터, 감압 컴퓨터, 의료기기, 생명안전 보증 장치를 대체하지 않는다.

## 현재 상태

저장소의 현재 앱은 레크리에이션 다이빙 로그와 watch 기록 동기화를 위한 companion 앱 기반이다. 이 문서의 NDL, ceiling, 감압, 산소 노출, gas remaining 관련 내용은 향후 제품 검토용 기준 자료이며, 구현되기 전에는 동작하는 기능처럼 설명하지 않는다.

## 목표

Apple Watch Ultra급 워치를 중심으로 수심, 시간, 속도, 로그, 프리다이빙 회복, Air-only 레크리에이션 스쿠버 safety-stop 리마인더, 레크리에이션 스쿠버 보조 정보를 기록하고 확인하는 앱을 만든다. 스쿠버 계산 기능은 사용자가 다이브 컴퓨터처럼 받아들일 수 있으므로 단계별 검증과 보수적 표현이 필요하다.

지원 대상으로 둔다.

- Apple Watch Ultra급 워치
- 프리다이빙
- 레크리에이션 스쿠버
- 향후 나이트록스와 가스 연동 가능성

명확한 비목표다.

- 전문 테크니컬 다이빙 컴퓨터 대체
- 40m 초과 다이빙 보장
- 의료적 안전 판단
- 블랙아웃이나 DCS 위험의 확정 예측

## 핵심 데이터 흐름

향후 스쿠버 계산 기능을 검토할 때의 전체 흐름은 다음 순서로 본다.

```txt
depth/pressure
→ gas partial pressure
→ tissue loading
→ ceiling
→ NDL
→ stop calculation
→ TTS
→ oxygen exposure
→ gas remaining
→ no-fly/repetitive dive state
```

이 흐름의 어느 단계든 입력 state가 유실되거나 센서 신뢰성이 깨지면 출력값은 안전 보장이 아니다. 특히 tissue loading state는 이전 다이브와 수면 휴식이 반영되어야 한다.

## 앱 모드

| Mode | 범위 | 안전 경계 |
|---|---|---|
| Freedive mode | 수심, 시간, 수면 휴식, 반복 부하, 로그와 행동 경고 | 워치 센서만으로 산소 잔량, 블랙아웃, 저산소 위험을 확정 계산하지 않는다. |
| Gauge mode | 현재/최대/평균 수심, 시간, 수온, 속도, 로그, Air-only 스쿠버 safety-stop 리마인더 | NDL, ceiling, no-fly, gas remaining을 표시하지 않는다. v1 safety stop은 감압 상태나 상승 안전 보장이 아니라 비인증 참고 타이머다. |
| Recreational scuba no-decompression mode | Air/Nitrox, ppO2, MOD, Bühlmann ZHL-16C + GF, NDL, ceiling, model-integrated safety stop, TTS, CNS, no-fly 후보 | v2 이상 고위험 범위다. 모델 검증과 state 복구 검증 전에는 제품 기능으로 취급하지 않는다. |
| Gas-integrated scuba mode | tank pressure, SAC/RMV, gas time remaining, reserve warning | 송신기/수동 입력 신뢰성, TTS와 gas remaining 통합 검증이 필요하다. |
| Future technical/trimix/deco mode | Trimix, gas switch, accelerated deco, helium loading, END, gas density, mandatory deco planning | MVP와 기본 제품 범위에서 제외한다. 별도 제품/검증/책임 범위가 필요하다. |

## 관련 문서

- [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md)
- [Diving App / Product Roadmap](diving-app-product-roadmap.md)
- [Diving App / QA and Test Plan](diving-app-qa-test-plan.md)
- [Diving App / Safety UX and Legal Notes](../domains/diving-app-safety-ux-legal-notes.md)
- [Diving App / Non-Negotiable Safety Rules](../domains/diving-app-non-negotiable-safety-rules.md)
- [안전 규칙](../domains/safety-rules.md)
