Source URL: /Users/hongseongbin/.codex/attachments/62b3175f-bbdd-4b07-bae8-6887d1db7779/pasted-text.txt
Collected: 2026-06-28
Published: Unknown

# Diving app wiki hardening request

너는 내 로컬 개발 지식베이스를 관리하는 에이전트다.
karpathy-llm-wiki skill을 사용해서, 방금 생성한 Diving App 관련 wiki 문서들을 보강해라.

중요:
여기서 말하는 “page”는 Mobile app이나 Watch app 안의 UI 화면이 아니다.
모든 page는 karpathy-llm-wiki 안의 개발용 wiki 문서를 뜻한다.
절대 사용자에게 노출되는 앱 화면, Watch 화면, 테스트 메뉴, 디버그 UI를 만들지 마라.

이번 작업의 목적:
기존 Diving App wiki를 “구현 전에 반드시 참고해야 하는 제품/알고리즘/QA 기준 문서”로 보강한다.
특히 다음 내용을 추가한다.

1. 알고리즘 불변성 규칙 보강
2. Bühlmann ZHL-16C 계수 고정 전 검증 TODO 추가
3. Mobile app / Watch app / shared algorithm core에 맞는 QA/Test Plan wiki 문서 추가
4. 출시 차단 조건 release blockers 추가
5. 절대 위반하면 안 되는 safety rule 문서 추가
6. wiki 내부 링크와 metadata 보강
7. references 문서 구조 보강
8. 최종 요약 제공

작업 원칙:
- 기존 Diving App wiki 문서를 중복 생성하지 말고, 이미 존재하는 문서는 갱신하라.
- 기존 공식과 알고리즘은 임의로 바꾸지 마라.
- 공식 자체를 수정해야 할 것 같으면 수정하지 말고 TODO 또는 Needs Validation으로 표시하라.
- 알고리즘 레퍼런스 문서는 제품 구현의 기준 자료로 보존하라.
- 새로운 정보를 추가할 때는 “검증 완료”, “검증 필요”, “제품 정책 결정 필요”를 구분하라.
- 사용자가 다이브 컴퓨터처럼 받아들일 수 있는 값, 예를 들어 NDL, ceiling, TTS, CNS, MOD, gas remaining은 특히 보수적으로 문서화하라.
- 앱이 “safe”를 보장한다고 표현하지 마라.
- “within model limit”, “currently no mandatory deco obligation shown”처럼 제한된 표현을 사용하도록 UX 원칙에 남겨라.

────────────────────────
작업 1. Algorithm Reference 보강
────────────────────────

기존 문서:
title: Diving App / Immutable Algorithm Reference
slug: diving-app-algorithm-reference

이 문서 상단에 다음 경고를 추가하라.

경고:
This page is an immutable algorithm reference.
Do not edit formulas without creating a new version.
Unit clarification, variable naming cleanup, and explanatory notes are allowed.
Formula changes require:
- new version section
- reason for change
- changed by
- changed date
- validation requirements
- regression test impact

또한 다음 구분 규칙을 추가하라.

Formula status labels:
- Current Formula: 현재 구현 기준으로 삼을 공식
- Needs Validation: 구현 전 canonical source 또는 테스트 검증이 필요한 공식
- Deprecated Formula: 더 이상 사용하지 않는 공식
- Future Extension: 현재 제품 범위에는 없지만 미래 확장을 위해 보관하는 공식

Bühlmann ZHL-16C 관련 섹션에 다음 TODO를 추가하라.

TODO:
- canonical ZHL-16C N2/He half-time, a, b coefficient table source 확정
- coefficient table을 코드 상수로 고정하기 전 독립 출처 2개 이상과 대조
- Subsurface, Shearwater 문서, Bühlmann 원자료 또는 검증된 오픈소스 구현과 비교
- coefficient 변경 시 기존 dive state와 regression test에 미치는 영향 문서화
- GF 기본값 정책 확정 전 제품 보수성 검토

중요:
Bühlmann ZHL-16C coefficient table은 아직 문서에 최종 고정하지 마라.
계수값을 넣어야 한다면 반드시 Needs Validation으로 표시하고, canonical source 확정 전까지 Current Formula로 승격하지 마라.

────────────────────────
작업 2. QA/Test Plan wiki 문서 추가
────────────────────────

새 wiki 문서를 생성하라.

title: Diving App / QA and Test Plan
slug: diving-app-qa-test-plan

주의:
이 문서는 앱 내부 화면이 아니다.
Mobile app, Watch app, shared algorithm core, sensor pipeline, cross-device sync, failure fallback을 검증하기 위한 개발용 wiki 문서다.

문서 상단 metadata:

Status: Draft / Needs Validation
Owner: local product/dev agent
Last reviewed: YYYY-MM-DD
Change policy: test cases can be expanded freely, but safety-critical expected outputs require review
Related pages:
- Diving App / Overview
- Diving App / Immutable Algorithm Reference
- Diving App / Scuba Mode
- Diving App / Freediving Mode
- Diving App / State Management
- Diving App / Non-Negotiable Safety Rules
- Diving App / Product Roadmap

문서 목적:
출시 전에 Mobile app, Watch app, shared algorithm core, cross-device sync, failure fallback이 통과해야 하는 테스트 기준을 정리한다.
특히 NDL, ceiling, tissue loading, CNS, MOD 같은 safety-critical 계산은 UI 테스트와 별도로 deterministic algorithm test를 가져야 한다.

다음 섹션으로 작성하라.

섹션 1. Shared Algorithm Core Tests

대상:
- iOS app과 watchOS app이 공통으로 쓰는 계산 로직
- 또는 서버 없이 로컬에서 돌아가는 dive calculation module
- 수심/압력/기체/조직부하/감압/산소노출/가스계산 로직

포함할 테스트:
1. pressure ↔ depth 변환 테스트
2. average depth 계산 테스트
3. ascent/descent rate 계산 테스트
4. ascent rate smoothing 테스트
5. gas partial pressure 계산 테스트
6. ppO2 계산 테스트
7. MOD 계산 테스트
8. EAD 계산 테스트
9. END 계산 테스트
10. gas density 계산 테스트
11. Bühlmann single compartment tissue loading 테스트
12. 일정 수심 exposure 테스트
13. Schreiner equation 상승/하강 구간 테스트
14. N2/He mixed gas tissue pressure 계산 테스트
15. Gradient Factor ceiling 테스트
16. GF interpolation 테스트
17. Surface GF 테스트
18. NDL binary search 테스트
19. safety stop requirement 테스트
20. mandatory decompression 발생 테스트
21. TTS 계산 테스트
22. CNS 누적 테스트
23. CNS surface half-time decay 테스트
24. OTU 누적 테스트
25. SAC/RMV 계산 테스트
26. gas remaining 계산 테스트
27. turn pressure 계산 테스트
28. no-fly rule-based minimum 테스트
29. model-based no-fly 시뮬레이션 테스트

각 테스트는 다음 형식으로 문서화하라.

- Test name
- Purpose
- Inputs
- Expected output
- Tolerance
- Source/reference
- Notes
- Safety critical: yes/no

섹션 2. Watch App Runtime Tests

대상:
- Apple Watch Ultra급 기기에서 실제 수중 또는 수중 시뮬레이션 환경으로 검증해야 하는 watchOS 동작

포함할 테스트:
1. depth sensor sampling 안정성
2. pressure 값 이상치 처리
3. 수심 1m 진입 후 자동 다이브 시작 조건
4. 수면 복귀 후 자동 다이브 종료 조건
5. 수중 상태에서 화면 표시 가독성
6. water lock / touch 제한 상황
7. Digital Crown 또는 버튼 기반 조작 가능성
8. haptic warning 전달성
9. MOD 초과 critical warning 지속성
10. ascent rate warning 지속성
11. ceiling violation warning 지속성
12. NDL 임박 warning
13. safety stop countdown pause/resume
14. 배터리 부족 경고
15. 저전력 모드 동작
16. app foreground/background 전환
17. watch reboot/crash 이후 state recovery
18. depth sensor dropout 발생 시 fallback
19. 로그 샘플링 유실 여부
20. 다이빙 중 iPhone 연결이 끊긴 상태에서 독립 동작 가능 여부

섹션 3. Mobile App Tests

대상:
- iPhone companion app
- 로그 조회, 설정 관리, 동기화, export, 사용자 설명 UI

포함할 테스트:
1. dive log 목록 표시
2. dive profile chart 표시
3. current/max/avg depth 표시
4. gas setting 관리
5. FO2 입력 validation
6. ppO2 limit 설정 validation
7. GF 설정 validation
8. Watch app으로 설정 sync
9. previous dive history 관리
10. no-fly time 표시
11. surface interval 표시
12. CNS/OTU 표시
13. Watch app에서 넘어온 로그 검증
14. incomplete dive log 처리
15. corrupted log 처리
16. export format 검증
17. CSV export
18. JSON export
19. future: UDDF 또는 Subsurface-compatible export 검토
20. safety copy 표시 위치 검증

섹션 4. Cross-device Sync Tests

대상:
- Watch app ↔ iPhone app 간 상태 동기화
- 다이빙 중/후 연결 끊김
- 설정/로그 충돌 처리

포함할 테스트:
1. 다이빙 전 iPhone 설정이 Watch에 반영되는지
2. FO2 변경이 Watch에 반영되는지
3. GF 설정 변경이 Watch에 반영되는지
4. 다이빙 중 iPhone 연결이 끊긴 경우 Watch 독립 기록
5. 다이빙 후 연결 복구 시 로그 동기화
6. Watch에만 로그가 있고 iPhone에는 없는 경우
7. iPhone에는 설정 변경이 있고 Watch는 이전 설정으로 다이빙을 시작하려는 경우
8. 앱 재설치 후 기존 dive history 복구
9. 앱 업데이트 후 기존 dive state 호환성
10. 중복 로그 merge
11. 충돌 발생 시 사용자가 이해할 수 있는 상태 표시
12. sync 실패를 조용히 무시하지 않는지

섹션 5. Failure and Fallback Tests

대상:
- 위험 상황에서 앱이 잘못된 값을 확정적으로 보여주지 않는지 검증
- 계산 불가능하거나 상태가 불완전할 때 gauge fallback으로 전환되는지 검증

포함할 테스트:
1. tissue state 손상
2. tissue state 누락
3. 이전 다이브 기록 누락
4. gas setting 누락
5. FO2 비정상값
6. GF 비정상값
7. depth sensor 값 끊김
8. pressure spike
9. pressure flatline
10. 비정상 수심값
11. 배터리 부족
12. app crash
13. watch reboot
14. 로그 저장 실패
15. NDL 계산 실패
16. ceiling 계산 실패
17. CNS 계산 실패
18. gas remaining 계산 실패
19. 계산 불가능 상태에서 NDL 숨김
20. gauge fallback 동작
21. fallback 상태에서 safety-critical warning 표시

섹션 6. Regression Test Policy

내용:
- 알고리즘 공식이 바뀌면 regression test를 반드시 업데이트한다.
- coefficient table이 바뀌면 known dive profile 결과를 다시 검증한다.
- GF 기본값이 바뀌면 NDL, ceiling, TTS 결과 차이를 문서화한다.
- 앱 업데이트가 기존 dive state와 호환되는지 검증한다.
- release build에서는 debug-only 계산값이 사용자에게 노출되지 않도록 검증한다.

────────────────────────
작업 3. Non-Negotiable Safety Rules 문서 추가
────────────────────────

새 wiki 문서를 생성하라.

title: Diving App / Non-Negotiable Safety Rules
slug: diving-app-non-negotiable-safety-rules

문서 상단 metadata:

Status: Reference / Safety Critical
Owner: local product/dev agent
Last reviewed: YYYY-MM-DD
Change policy: rules can only be relaxed with explicit review and documented rationale
Related pages:
- Diving App / Safety UX and Legal Notes
- Diving App / State Management
- Diving App / Scuba Mode
- Diving App / QA and Test Plan
- Diving App / Product Roadmap

내용:
이 문서는 제품 구현에서 절대 위반하면 안 되는 안전 규칙을 정리한다.

반드시 포함할 규칙:
1. tissue state가 없거나 손상되었는데 NDL을 표시하지 않는다.
2. 이전 다이브 정보가 누락되었는데 “safe”라고 표현하지 않는다.
3. 센서 값이 불안정한 상태에서 ceiling/NDL을 확정값처럼 표시하지 않는다.
4. MOD 초과 경고는 사용자가 dismiss해도 상태가 해결되기 전까지 유지한다.
5. ppO2, CNS, ceiling, TTS, gas remaining은 항상 단위와 기준을 함께 표시한다.
6. deco obligation 발생 시 앱은 사용자를 안심시키는 표현을 쓰지 않는다.
7. 프리다이빙에서 블랙아웃 위험을 숫자로 예측한다고 주장하지 않는다.
8. Apple Watch Ultra를 전문 다이브 컴퓨터의 완전 대체재로 표현하지 않는다.
9. 로그 저장 실패를 조용히 무시하지 않는다.
10. 앱 업데이트 후 알고리즘 변경이 있으면 기존 dive state와의 호환성을 검증한다.
11. state corruption이 의심되면 NDL/ceiling을 계속 표시하지 않고 gauge fallback으로 전환한다.
12. gas setting이 불명확하면 ppO2, MOD, CNS, NDL을 신뢰 가능한 값처럼 표시하지 않는다.
13. 사용자가 다른 다이브 앱/컴퓨터와 혼용한 경우 residual nitrogen/tissue loading 불일치를 경고한다.
14. critical warning은 단순 toast로 끝내지 않고 persistent 상태로 유지한다.
15. 수중에서 앱이 죽거나 센서가 끊기면 보수적인 fallback UX를 제공한다.

각 규칙마다 다음 필드를 추가하라:
- Rule
- Why it matters
- Product behavior
- Test coverage
- Related warning copy

────────────────────────
작업 4. Product Roadmap에 release blockers 추가
────────────────────────

기존 문서:
title: Diving App / Product Roadmap
slug: diving-app-product-roadmap

각 버전에 release blockers를 추가하라.

v1: Gauge + Freedive + Log

v1 release blockers:
- depth sensor sampling 안정성 검증 전 출시 금지
- 수중 화면 잠금/터치/크라운 UX 검증 전 출시 금지
- 로그 유실 가능성 검증 전 출시 금지
- 저전력/배터리 경고 UX 검증 전 출시 금지
- 프리다이빙 surface interval timer 검증 전 출시 금지
- post-surface 30초 timer 검증 전 출시 금지
- Watch 단독 로그 저장 검증 전 출시 금지

v2: Recreational Scuba No-Decompression

v2 release blockers:
- Bühlmann coefficient source 확정 전 출시 금지
- tissue loading regression test 통과 전 출시 금지
- NDL/ceiling known profile 테스트 통과 전 출시 금지
- 앱 재시작 후 tissue state recovery 검증 전 출시 금지
- 잘못된 tissue state에서 NDL 표시 방지 검증 전 출시 금지
- ppO2/MOD/CNS 계산 테스트 통과 전 출시 금지
- safety stop countdown 테스트 통과 전 출시 금지
- no-fly calculation 정책 확정 전 출시 금지
- 다른 다이브 앱/컴퓨터와 혼용 시 경고 UX 확정 전 출시 금지

v3: Gas-integrated Scuba

v3 release blockers:
- tank pressure transmitter reliability 검증 전 출시 금지
- pressure dropout 처리 검증 전 출시 금지
- tank profile 설정 UX 검증 전 출시 금지
- reserve pressure 경고 검증 전 출시 금지
- gas remaining이 TTS보다 부족한 상황의 critical warning 검증 전 출시 금지
- SAC/RMV 계산 regression test 통과 전 출시 금지

v4: Technical / Trimix / Deco

v4 release blockers:
- 별도 기술 다이빙 검증 계획 없이 출시 금지
- multiple gas switch 검증 전 출시 금지
- helium tissue loading 검증 전 출시 금지
- accelerated deco planning 검증 전 출시 금지
- END/gas density 정책 확정 전 출시 금지
- mandatory decompression planning을 사용자가 어떻게 이해할지 UX 검증 전 출시 금지
- Apple Watch Ultra급 40m 제한과 제품 리스크를 다시 검토하기 전 출시 금지

또한 Product Roadmap 문서 상단에 다음 원칙을 추가하라.

Roadmap principle:
v1은 gauge/freedive/log 중심이다.
v2부터 사용자가 사실상 dive computer로 받아들일 수 있으므로 algorithm validation과 state recovery가 release gate가 된다.
v3는 가스 연동 신뢰성이 release gate가 된다.
v4는 MVP 범위가 아니며 별도 제품/검증/책임 범위로 다룬다.

────────────────────────
작업 5. State Management 문서 보강
────────────────────────

기존 문서:
title: Diving App / State Management
slug: diving-app-state-management

다음 섹션을 추가하라.

섹션: Source of Truth

내용:
- 스쿠버 모드에서 tissue_N2[16], tissue_He[16], CNS, OTU, gas setting, GF setting은 계산의 source of truth다.
- Mobile app과 Watch app 사이에 값이 충돌하면 다이빙 중에는 Watch app의 runtime state를 우선한다.
- 다이빙 후 sync 과정에서는 원본 샘플 로그와 compact state snapshot을 모두 보존한다.
- state snapshot만 있고 원본 로그가 없으면 Needs Review로 표시한다.
- 원본 로그만 있고 state snapshot이 손상되었으면 가능한 경우 재계산하되, 재계산 결과임을 표시한다.

섹션: Fallback Policy

내용:
- tissue state가 손상되면 NDL/ceiling을 숨긴다.
- pressure/depth sensor가 불안정하면 computed decompression metrics를 확정적으로 표시하지 않는다.
- 계산 실패 시 gauge mode fallback을 제공한다.
- fallback 중에도 current depth, elapsed time, ascent rate, warning copy는 가능한 범위에서 유지한다.
- fallback 상태는 로그에 반드시 기록한다.

섹션: Persistence Policy

내용:
- every sample: compact state persist
- every 1 second: depth, pressure, temperature, gas, computed metrics append
- every critical event: immediate persist
- app lifecycle event: immediate persist
- watch battery warning: immediate persist
- crash recovery marker: write before risky transition if possible

────────────────────────
작업 6. Safety UX and Legal Notes 보강
────────────────────────

기존 문서:
title: Diving App / Safety UX and Legal Notes
slug: diving-app-safety-ux-legal-notes

다음 표현 원칙을 추가하라.

금지 표현:
- safe
- guaranteed
- no risk
- prevents blackout
- prevents DCS
- medical-grade
- professional dive computer replacement

권장 표현:
- currently within configured model limits
- no mandatory decompression obligation currently shown
- based on available dive history
- based on current sensor data
- verify with training and backup instruments
- use conservative procedures
- computation unavailable, fallback to gauge information

Critical warning UX:
- haptic + visual + persistent state
- dismiss 가능하더라도 resolved 전까지 warning state 유지
- warning 발생/해제 모두 로그 기록
- 수중에서는 긴 문장보다 짧고 명확한 문구 사용
- iPhone companion app에는 사후 설명과 세부 로그 제공

────────────────────────
작업 7. References 문서 구조 보강
────────────────────────

기존 문서:
title: Diving App / References
slug: diving-app-references

각 reference를 단순 URL 목록이 아니라 다음 필드로 정리하라.

형식:
- Source:
- URL:
- Used for:
- Confidence:
- Notes:
- Last checked:

Confidence 값:
- High: 공식 문서, 표준, 널리 검증된 전문기관 자료
- Medium: 전문 벤더 문서, 오픈소스 문서, 교육기관 자료
- Needs Review: 구현 전 추가 검증 필요

각 reference에 used for를 구체적으로 작성하라.
예:
- Apple Watch Ultra guidance: device scope, 40m recreational limitation, app switching/tissue loading caution
- NOAA pressure: depth-pressure relationship
- DecoTengu: Bühlmann ZHL-16C-GF formulas, Schreiner equation, GF ceiling
- Shearwater GF: gradient factor interpretation
- Shearwater CNS: CNS oxygen clock and 90-minute half-time
- DAN oxygen toxicity: ppO2 limit context
- DAN air consumption: RMV/SAC
- Subsurface: NDL, TTS, Surface GF, EAD concepts
- DAN flying after diving: no-fly rule-based minimum
- DAN shallow water blackout: freediving behavioral risk
- DAN gas density/performance: gas density warning thresholds

────────────────────────
작업 8. Wiki 내부 링크 보강
────────────────────────

다음 내부 링크를 각 관련 문서에 추가하라.

- Overview → Immutable Algorithm Reference
- Overview → Product Roadmap
- Overview → QA and Test Plan
- Freediving Mode → Safety UX and Legal Notes
- Freediving Mode → Non-Negotiable Safety Rules
- Scuba Mode → Immutable Algorithm Reference
- Scuba Mode → State Management
- Scuba Mode → QA and Test Plan
- State Management → Non-Negotiable Safety Rules
- Product Roadmap → QA and Test Plan
- Product Roadmap → Non-Negotiable Safety Rules
- Immutable Algorithm Reference → References
- QA and Test Plan → Immutable Algorithm Reference
- QA and Test Plan → State Management
- Safety UX and Legal Notes → Non-Negotiable Safety Rules

────────────────────────
작업 9. Metadata 보강
────────────────────────

모든 Diving App 관련 wiki 문서 상단에 metadata를 넣어라.

형식:
Status:
Owner:
Last reviewed:
Change policy:
Related pages:

Status 예:
- Draft
- Reference
- Immutable
- Safety Critical
- Needs Validation

Owner:
local product/dev agent

Last reviewed:
현재 날짜를 YYYY-MM-DD 형식으로 넣어라.

Change policy 예:
- formulas require versioned change
- safety rules require explicit review
- roadmap can change with documented rationale
- test plan can expand freely but safety-critical expected outputs require review

────────────────────────
작업 10. 최종 응답
────────────────────────

wiki 저장/갱신이 끝나면 최종 응답으로 다음을 요약하라.

1. 생성한 wiki 문서 목록
2. 수정한 wiki 문서 목록
3. Immutable 또는 Safety Critical로 표시한 문서
4. 아직 검증이 필요한 TODO
5. 구현 전에 반드시 확인해야 할 release blockers
6. 알고리즘 계수/테이블 중 아직 source 고정이 필요한 항목
7. Mobile app / Watch app / shared algorithm core / cross-device sync / failure fallback 중 어떤 테스트 범주를 만들었는지

성공 기준:
이 작업의 성공 기준은 문서가 예쁘게 정리되는 것이 아니다.
나중에 구현 에이전트가 이 wiki만 보고도 다음을 즉시 판단할 수 있어야 한다.

- 어떤 공식이 구현 기준인지
- 어떤 공식은 아직 검증 대기인지
- 어떤 기능은 아직 출시하면 안 되는지
- Mobile app과 Watch app 각각 무엇을 검증해야 하는지
- shared algorithm core가 어떤 테스트를 통과해야 하는지
- state가 손상되었을 때 어떤 값을 숨기고 어떤 fallback을 해야 하는지
