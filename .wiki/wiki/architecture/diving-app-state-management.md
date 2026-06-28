# Diving App / State Management

Sources: user pasted request, 2026-06-28; user pasted hardening request, 2026-06-28
Raw: [Diving app technical wiki request](../../raw/algorithms/2026-06-28-diving-app-technical-wiki-request.md); [Diving app wiki hardening request](../../raw/algorithms/2026-06-28-diving-app-wiki-hardening-request.md)
Updated: 2026-06-28
Status: Draft / Safety Critical / Needs Validation
Owner: local product/dev agent
Last reviewed: 2026-06-28
Change policy: state source-of-truth and fallback changes require explicit review
Related pages: [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md); [Diving App / Scuba Mode](../domains/diving-app-scuba-mode.md); [Diving App / Non-Negotiable Safety Rules](../domains/diving-app-non-negotiable-safety-rules.md); [Diving App / QA and Test Plan](../project/diving-app-qa-test-plan.md)
Slug: diving-app-state-management

## 요약

스쿠버에서 가장 치명적인 버그는 화면 표시 버그가 아니라 tissue state 유실이다. 앱이 tissue model의 source of truth인지 명확히 해야 하며, state corruption이 의심되면 NDL/ceiling을 계속 표시하지 말고 gauge fallback과 강한 경고를 사용해야 한다.

## 현재 상태

현재 저장소에는 Bühlmann tissue model, NDL, ceiling, CNS, OTU, gas remaining 계산 state가 구현되어 있지 않다. 이 문서는 향후 v2/v3 진입 전 필요한 state 저장 기준이다.

## 필수 저장 상태

```txt
DiveState:
    timestamp
    mode
    depth
    pressure
    temperature
    gas_mix
    FO2, FN2, FHe
    tissue_N2[16]
    tissue_He[16]
    CNS
    OTU
    current_GF
    ceiling
    NDL
    TTS
    safety_stop_remaining
    tank_pressure optional
    RMV/SAC optional
```

`tissue_N2[16]`, `tissue_He[16]`, CNS, OTU, GF, ceiling, NDL, TTS는 같은 시점의 depth/pressure/gas state와 함께 일관되게 저장되어야 한다.

## 저장 정책

Compact state 저장:

```txt
every sample:
    persist compact state
```

로그 저장:

```txt
every 1 second:
    append depth, pressure, temp, gas, computed metrics
```

Compact state는 crash/reboot 이후 복구를 위한 source이며, 1초 log는 사후 profile review와 regression 분석을 위한 기록이다. 둘 중 하나만으로는 충분하지 않다.

## Source of Truth

- 스쿠버 모드에서 `tissue_N2[16]`, `tissue_He[16]`, CNS, OTU, gas setting, GF setting은 계산의 source of truth다.
- Mobile app과 Watch app 사이에 값이 충돌하면 다이빙 중에는 Watch app의 runtime state를 우선한다.
- 다이빙 후 sync 과정에서는 원본 샘플 로그와 compact state snapshot을 모두 보존한다.
- state snapshot만 있고 원본 로그가 없으면 Needs Review로 표시한다.
- 원본 로그만 있고 state snapshot이 손상되었으면 가능한 경우 재계산하되, 재계산 결과임을 표시한다.

## Fallback Policy

- tissue state가 손상되면 NDL/ceiling을 숨긴다.
- pressure/depth sensor가 불안정하면 computed decompression metrics를 확정적으로 표시하지 않는다.
- 계산 실패 시 gauge mode fallback을 제공한다.
- fallback 중에도 current depth, elapsed time, ascent rate, warning copy는 가능한 범위에서 유지한다.
- fallback 상태는 로그에 반드시 기록한다.

## Persistence Policy

- every sample: compact state persist
- every 1 second: depth, pressure, temperature, gas, computed metrics append
- every critical event: immediate persist
- app lifecycle event: immediate persist
- watch battery warning: immediate persist
- crash recovery marker: write before risky transition if possible

## 원칙

- 앱이 tissue model의 source of truth인지 명확히 한다.
- 마지막 다이브 후 일정 시간 이내 다른 다이브 앱/컴퓨터로 전환하면 residual nitrogen/tissue state가 달라질 수 있다.
- 앱 재시작, watch reboot, battery issue, crash 이후에도 tissue state 복구가 가능해야 한다.
- state corruption이 의심되면 NDL/ceiling을 계속 표시하지 말고 gauge fallback과 강한 경고를 띄운다.
- 이전 다이브 상태 유실은 가장 위험한 오류 중 하나로 다룬다.

## 실패 처리

State 복구에 실패하거나 sample stream 품질이 신뢰할 수 없으면 계산 기반 필드를 숨기고 gauge/log 중심 화면으로 전환한다. 이때 사용자에게 값이 불완전한 이유와 제한을 persistent state로 알려야 한다.

## 관련 문서

- [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md)
- [Diving App / Scuba Mode](../domains/diving-app-scuba-mode.md)
- [Diving App / Non-Negotiable Safety Rules](../domains/diving-app-non-negotiable-safety-rules.md)
- [Diving App / QA and Test Plan](../project/diving-app-qa-test-plan.md)
- [Diving App / Product Roadmap](../project/diving-app-product-roadmap.md)
- [동기화 흐름 구조](sync-flow.md)
