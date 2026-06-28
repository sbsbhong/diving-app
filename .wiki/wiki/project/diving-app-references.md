# Diving App / References

Sources: user pasted request, 2026-06-28; user pasted hardening request, 2026-06-28
Raw: [Diving app technical wiki request](../../raw/algorithms/2026-06-28-diving-app-technical-wiki-request.md); [Diving app wiki hardening request](../../raw/algorithms/2026-06-28-diving-app-wiki-hardening-request.md)
Updated: 2026-06-28
Status: Reference / Needs Validation
Owner: local product/dev agent
Last reviewed: 2026-06-28
Change policy: references can be expanded freely, but algorithm source promotion requires review
Related pages: [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md); [Diving App / QA and Test Plan](diving-app-qa-test-plan.md); [Diving App / Product Roadmap](diving-app-product-roadmap.md)
Slug: diving-app-references

## 요약

이 문서는 알고리즘과 제품 요구사항을 검증할 때 항상 먼저 확인하는 링크 모음이다. 아래 링크는 2026-06-28 사용자 제공 source에서 수집한 reference list이며, 실제 구현 전에는 각 원문과 publication/update date를 다시 확인해야 한다.

## Reference List

### Apple Watch Ultra Depth app and diving safety guidance

- Source: Apple Watch Ultra Depth app and diving safety guidance
- URL: <https://support.apple.com/en-gu/guide/watch/apd9073c83d6/watchos>
- Used for: device scope, 40m recreational limitation, Depth app scope, third-party diving app caution, app switching/tissue loading caution.
- Confidence: High
- Notes: 공식 device guidance다. Apple Watch Ultra를 전문 다이브 컴퓨터의 완전 대체재로 표현하지 않는 근거로 먼저 확인한다.
- Last checked: 2026-06-28

### Oceanic+ for Apple Watch Ultra

- Source: Oceanic+ for Apple Watch Ultra
- URL: <https://www.oceanicworldwide.com/oceanic-plus/>
- Used for: Apple Watch Ultra scuba/freedive app positioning, Bühlmann ZHL-16C use, recreational dive computer scope.
- Confidence: Medium
- Notes: 전문 벤더 문서다. 제품 positioning reference로 사용하되 algorithm coefficient canonical source로 단독 사용하지 않는다.
- Last checked: 2026-06-28

### NOAA Ocean Service: pressure underwater

- Source: NOAA Ocean Service: pressure underwater
- URL: <https://oceanservice.noaa.gov/facts/pressure.html>
- Used for: depth-pressure relationship, 33ft / 10.06m per atmosphere.
- Confidence: High
- Notes: pressure/depth 근사의 우선 reference다.
- Last checked: 2026-06-28

### PADI Golden Rules of Scuba Diving

- Source: PADI Golden Rules of Scuba Diving
- URL: <https://blog.padi.com/the-golden-rules-of-scuba-diving/>
- Used for: ascent rate, safety stop, recreational planning principles, rule of thirds reference.
- Confidence: Medium
- Notes: 교육기관 자료다. 제품 policy 근거로만 사용하고 계산 공식 canonical source로 쓰지 않는다.
- Last checked: 2026-06-28

### DAN: A Critical Look at No-Decompression Limits

- Source: DAN: A Critical Look at No-Decompression Limits
- URL: <https://dan.org/alert-diver/article/a-critical-look-at-no-decompression-limits/>
- Used for: NDL as model-based probabilistic boundary, safety stop behavior, computer variation.
- Confidence: High
- Notes: NDL을 safety guarantee로 표현하지 않는 근거다.
- Last checked: 2026-06-28

### DecoTengu ZH-L16C-GF documentation

- Source: DecoTengu ZH-L16C-GF documentation
- URL: <https://wrobell.dcmod.org/decotengu/model.html>
- Used for: Bühlmann ZHL-16C-GF formulas, tissue loading, Schreiner equation, gradient factor ceiling, N2/He mixing.
- Confidence: Medium
- Notes: 오픈소스 문서다. 공식/구현 reference로 유용하지만 coefficient table은 독립 출처 2개 이상과 대조해야 한다.
- Last checked: 2026-06-28

### Shearwater: Flexible Control of Decompression Stress

- Source: Shearwater: Flexible Control of Decompression Stress
- URL: <https://shearwater.com/en-kr/blogs/community/flexible-control-of-decompression-stress>
- Used for: gradient factor interpretation, GF Low, GF High, decompression conservatism.
- Confidence: Medium
- Notes: 전문 벤더 설명이다. GF 기본값 정책은 별도 제품 보수성 검토가 필요하다.
- Last checked: 2026-06-28

### Shearwater: CNS Oxygen Clock

- Source: Shearwater: CNS Oxygen Clock
- URL: <https://shearwater.com/en-kr/blogs/community/shearwater-and-the-cns-oxygen-clock>
- Used for: CNS oxygen clock, NOAA table context, 90-minute CNS half-time on surface.
- Confidence: Medium
- Notes: CNS table canonical source 확정 전 Needs Review로 유지한다.
- Last checked: 2026-06-28

### DAN: Oxygen Toxicity

- Source: DAN: Oxygen Toxicity
- URL: <https://dan.org/health-medicine/health-resources/diseases-conditions/oxygen-toxicity/>
- Used for: ppO2 operating limit context, 1.4 ATA, 1.6 ATA, oxygen toxicity risk.
- Confidence: High
- Notes: ppO2/MOD warning context에 사용한다. 산소 독성을 확정 예측한다고 표현하지 않는다.
- Last checked: 2026-06-28

### DAN: Estimating Your Air Consumption

- Source: DAN: Estimating Your Air Consumption
- URL: <https://dan.org/alert-diver/article/estimating-your-air-consumption/>
- Used for: RMV/SAC calculations.
- Confidence: High
- Notes: v3 gas-integrated scope에서 RMV/SAC regression source 후보로 사용한다.
- Last checked: 2026-06-28

### Subsurface User Manual

- Source: Subsurface User Manual
- URL: <https://subsurface-divelog.org/subsurface-user-manual/>
- Used for: NDL, TTS, EAD, Surface GF, dive planning concepts.
- Confidence: Medium
- Notes: 오픈소스 dive log/computer ecosystem reference다. 단독 safety authority로 쓰지 않는다.
- Last checked: 2026-06-28

### DAN: Flying After Diving Guidelines

- Source: DAN: Flying After Diving Guidelines
- URL: <https://dan.org/health-medicine/health-resource/health-safety-guidelines/guidelines-for-flying-after-diving/>
- Used for: no-fly rule-based minimum, 12h, 18h, decompression dive caution.
- Confidence: High
- Notes: no-fly reminder에 사용한다. Medical/aviation guarantee로 표현하지 않는다.
- Last checked: 2026-06-28

### DAN: Shallow Water Blackout

- Source: DAN: Shallow Water Blackout
- URL: <https://dan.org/alert-diver/article/shallow-water-blackout/>
- Used for: freediving blackout behavioral risk.
- Confidence: High
- Notes: 프리다이빙에서 blackout risk를 숫자로 예측한다고 주장하지 않는 근거다.
- Last checked: 2026-06-28

### DAN: Could Breath-Hold Diving After Scuba Cause DCS?

- Source: DAN: Could Breath-Hold Diving After Scuba Cause DCS?
- URL: <https://dan.org/alert-diver/article/could-breath-hold-diving-after-scuba-cause-decompression-sickness/>
- Used for: freediving, repetitive deep freedives, DCS possibility.
- Confidence: High
- Notes: 반복 deep freedive와 scuba 후 breath-hold risk를 보수적으로 문서화할 때 사용한다.
- Last checked: 2026-06-28

### DANSA: Terrific Freedive Mode

- Source: DANSA: Terrific Freedive Mode
- URL: <https://www.dansa.org/blog/2023/03/01/terrific-freedive-mode>
- Used for: freedive mode, sampling, surface interval heuristics.
- Confidence: Needs Review
- Notes: 제품 heuristic 후보로만 사용한다. 구현 전 추가 source 검증이 필요하다.
- Last checked: 2026-06-28

### DAN: Performance Under Pressure

- Source: DAN: Performance Under Pressure
- URL: <https://dan.org/alert-diver/article/performance-under-pressure/>
- Used for: gas density, CO2 retention, work of breathing, gas density warning thresholds.
- Confidence: High
- Notes: gas density warning threshold policy 검토에 사용한다.
- Last checked: 2026-06-28

### DANSA: ESOT calculations

- Source: DANSA: ESOT calculations
- URL: <https://www.dansa.org/blog/2024/02/06/esot-calculations>
- Used for: OTU/UPTD context.
- Confidence: Needs Review
- Notes: OTU/UPTD implementation 전 table/unit/reset policy를 추가 검증해야 한다.
- Last checked: 2026-06-28

## 사용 원칙

공식이나 제품 요구사항을 변경할 때는 먼저 이 페이지의 관련 source를 확인한다. 공식 자체를 바꾸어야 한다면 [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md)를 덮어쓰지 말고 새 버전/변경 이력으로 남긴다.

## 관련 문서

- [Diving App / Immutable Algorithm Reference](../algorithms/diving-app-algorithm-reference.md)
- [Diving App / QA and Test Plan](diving-app-qa-test-plan.md)
- [Diving App / Product Roadmap](diving-app-product-roadmap.md)
- [Diving App / Safety UX and Legal Notes](../domains/diving-app-safety-ux-legal-notes.md)
