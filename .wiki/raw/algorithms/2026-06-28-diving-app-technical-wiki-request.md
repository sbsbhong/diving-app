Source URL: /Users/hongseongbin/.codex/attachments/f09cac15-2007-4c14-960b-8913d0562bc7/pasted-text.txt
Collected: 2026-06-28
Published: Unknown

# Diving app technical wiki request

너는 내 로컬 개발 지식베이스를 관리하는 에이전트다.
karpathy-llm-wiki skill을 사용해서 아래 내용을 wiki에 구조화해서 저장해라.

목표:
Apple Watch Ultra급 워치에서 동작하는 프리다이빙/스쿠버 다이빙 앱을 만들기 위한 “항상 참고 가능한 기술 위키”를 작성한다.
특히 알고리즘, 공식, 계산식, 모델 전제는 제품 구현의 기준 자료로서 절대 임의 변경하지 말고, 출처와 함께 보존한다.

중요 원칙:
1. 이 문서는 의료/생명안전 보증 문서가 아니라 제품 개발 참고 문서다.
2. 스쿠버 관련 NDL, ceiling, decompression, CNS, OTU, MOD, gas calculation은 사용자가 다이브 컴퓨터처럼 받아들일 수 있으므로 매우 보수적으로 다뤄라.
3. 알고리즘/공식은 “불변 레퍼런스”로 저장하고, 수정이 필요하면 기존 내용을 덮어쓰지 말고 별도 버전/변경 이력으로 남겨라.
4. 공식마다 입력값, 출력값, 단위, 전제, 한계를 명시하라.
5. 안전 문구는 별도 UX/Legal 섹션으로 분리하되, 알고리즘 문서 안에도 “이 값은 안전 보장이 아님”을 명시하라.
6. Apple Watch Ultra는 전문 다이브 컴퓨터를 대체한다고 단정하지 말고, 레크리에이션 보조 장치로 다뤄라.
7. 스쿠버에서 tissue loading state는 앱의 source of truth로 취급하고, 이전 다이브 상태 유실을 가장 위험한 오류 중 하나로 기록하라.

wiki에 다음 페이지들을 생성하거나 갱신해라.

페이지 1:
title: Diving App / Overview
slug: diving-app-overview

내용:
- 앱의 목표
- 지원 대상:
  - Apple Watch Ultra급 워치
  - 프리다이빙
  - 레크리에이션 스쿠버
  - 향후 나이트록스/가스 연동 가능
- 명확한 비목표:
  - 전문 테크니컬 다이빙 컴퓨터 대체
  - 40m 초과 다이빙 보장
  - 의료적 안전 판단
  - 블랙아웃/DCS 위험의 확정 예측
- 핵심 데이터 흐름:
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
- 앱 모드:
  1. Freedive mode
  2. Gauge mode
  3. Recreational scuba no-decompression mode
  4. Gas-integrated scuba mode
  5. Future technical/trimix/deco mode

페이지 2:
title: Diving App / Immutable Algorithm Reference
slug: diving-app-algorithm-reference

이 페이지는 “불변 레퍼런스”로 작성해라.
각 공식은 임의로 바꾸지 말고 아래 구조로 정리한다.

섹션: 1. Depth and Pressure

공식:
P_abs = P_surface + ρ_water · g · d / 100000

간단 해수 근사:
P_abs ≈ P_surface + d / 10.06

일반 다이빙 근사:
P_abs ≈ 1.0 + d / 10

압력에서 수심:
d = (P_abs - P_surface) · 100000 / (ρ_water · g)

변수:
- P_abs: absolute pressure, bar
- P_surface: surface atmospheric pressure, bar
- ρ_water: water density, kg/m³
  - seawater approx 1025
  - freshwater approx 1000
- g: 9.80665 m/s²
- d: depth, m

주의:
고도 다이빙이나 비행 후 이동을 고려하려면 P_surface를 고정 1.0bar로 두지 말고 실제 기압/고도를 반영해야 한다.

섹션: 2. Depth Rate

공식:
v = Δd / Δt

ascent_rate = max(0, -Δd / Δt)
descent_rate = max(0,  Δd / Δt)

m/min 변환:
ascent_rate_mpm = ascent_rate_mps × 60

주의:
센서 노이즈 제거를 위해 3~10초 이동평균, low-pass filter, Kalman filter 중 하나를 사용한다.

섹션: 3. Average Depth

공식:
avg_depth = Σ(d_i · Δt_i) / ΣΔt_i

섹션: 4. Gas Partial Pressure

공식:
ppO2 = FO2 · P_abs
ppN2 = FN2 · P_abs
ppHe = FHe · P_abs

공기:
FO2 ≈ 0.21
FN2 ≈ 0.79

나이트록스 예:
EAN32:
FO2 = 0.32
FN2 = 0.68

트라이믹스:
FO2 + FN2 + FHe = 1

섹션: 5. Bühlmann Tissue Loading

전제:
스쿠버 NDL, ceiling, decompression stop 계산은 Bühlmann ZH-L16 계열, 특히 ZHL-16C + Gradient Factors를 기준 모델로 둔다.

각 tissue compartment i, gas g:
k_i,g = ln(2) / T_half_i,g

폐포/흡입 불활성기체 압력:
P_alv_g = F_g · (P_abs - P_H2O)

P_H2O ≈ 0.0627 bar

일정 수심에서 tissue loading:
P_tissue_g(t) = P_alv_g + (P_tissue_g(0) - P_alv_g) · e^(-k·t)

상승/하강 중 선형 압력 변화 구간, Schreiner equation:
P_tissue(t)
= P_alv0 + R · (t - 1/k)
  - (P_alv0 - P_tissue0 - R/k) · e^(-k·t)

변수:
- P_alv0: 구간 시작 시 흡입 불활성기체 압력
- R: 흡입 불활성기체 압력 변화율, bar/min
- t: 구간 시간, min
- k: ln(2)/T_half

섹션: 6. N2 + He Mixed Gas Tissue Calculation

총 불활성기체 압력:
P_i = P_N2_i + P_He_i

혼합 a coefficient:
a_i = (a_N2_i · P_N2_i + a_He_i · P_He_i) / (P_N2_i + P_He_i)

혼합 b coefficient:
b_i = (b_N2_i · P_N2_i + b_He_i · P_He_i) / (P_N2_i + P_He_i)

주의:
v1/v2에서는 트라이믹스를 지원하지 않더라도 이 식은 미래 확장용 레퍼런스로 보관한다.

섹션: 7. Gradient Factor Ceiling

공식:
P_amb_allowed
= (P_tissue - a · GF) / (GF / b + 1 - GF)

ceiling depth:
ceiling_m = max(0, (P_amb_allowed - P_surface) · 10.06)

모든 조직 중 가장 깊은 ceiling 사용:
ceiling = max_i(ceiling_i)

GF 보간:
x = (P_amb - P_surface) / (P_first_stop - P_surface)

GF_current = GF_high + x · (GF_low - GF_high)

검증:
- first stop: P_amb = P_first_stop, x = 1, GF_current = GF_low
- surface: P_amb = P_surface, x = 0, GF_current = GF_high

섹션: 8. NDL Calculation

정의:
NDL은 현재 수심에 그대로 머물렀을 때, 직접 상승 또는 safety stop 포함 상승을 해도 mandatory decompression ceiling이 생기지 않는 최대 남은 시간이다.

중요:
NDL은 현재 다이브만이 아니라 이전 다이브의 tissue state를 포함해야 한다.

수치 시뮬레이션 의사코드:
function computeNDL(state, current_depth):
    for τ from 0 to max_search_time step 1 minute:
        test_state = clone(state)
        simulate_hold(test_state, current_depth, τ)
        simulate_ascent(test_state, ascent_rate_profile)

        if ceiling(test_state) > 0:
            return τ - 1 minute

    return "> max_search_time"

이분 탐색 버전:
low = 0
high = 200 min

while high - low > 0.5 min:
    mid = (low + high) / 2
    if ascent_after_hold_is_no_deco(mid):
        low = mid
    else:
        high = mid

NDL = low

섹션: 9. Safety Stop

기본 규칙:
- no-decompression recreational dive
- 일반적으로 5m / 15ft 부근
- 최소 3분

구현:
if no_deco_dive and max_depth >= safety_stop_trigger_depth:
    required_safety_stop = 180 sec
else:
    required_safety_stop = 0

권장 설정:
safety_stop_trigger_depth = 10m
safety_stop_band = 3m ~ 6m
safety_stop_target = 5m

카운트다운:
if 3m <= current_depth <= 6m and ascent_rate <= allowed_rate:
    remaining_stop_time -= Δt
else:
    pause countdown

보수적 확장 예:
if NDL <= 5min or ascent_rate_violation:
    required_safety_stop = 300 sec

섹션: 10. Mandatory Decompression Stop

정지 깊이:
stop_depths = [30m, 27m, 24m, 21m, 18m, 15m, 12m, 9m, 6m, 3m]

현재 ceiling보다 얕은 정지로 올라가면 안 된다.

next_stop = smallest stop_depth where stop_depth >= ceiling

정지 시간:
while ceiling > next_shallower_stop_depth:
    hold at current_stop_depth
    update_tissues(Δt)
    stop_time += Δt

섹션: 11. TTS

정의:
TTS = Time To Surface

공식:
TTS =
    time_to_ascend_to_first_stop
  + Σ mandatory_stop_times
  + time_between_stops
  + optional_safety_stop_time
  + final_ascent_time

섹션: 12. Surface GF

GF_required:
GF_required =
(P_tissue - P_target) /
(a + P_target / b - P_target)

Surface GF:
surface_GF = max_i(GF_required_i) × 100

판정:
if surface_GF > 100:
    show "즉시 수면 상승 금지 / ceiling 존재"

섹션: 13. ppO2

공식:
ppO2 = FO2 · P_abs

경고:
if ppO2 > ppO2_limit:
    alert("MOD 초과 / ppO2 위험")

일반 기준:
- recreational open circuit에서는 ppO2 1.4 ATA 이하를 기본 operational limit로 둔다.
- 1.6 ATA는 contingency 또는 절대 상한으로 다룬다.
- 제품 기본값은 ppO2_limit = 1.4로 둔다.

섹션: 14. MOD

공식:
MOD = 10.06 · (ppO2_limit / FO2 - P_surface)

일반 근사:
MOD_m = 10 · (ppO2_limit / FO2 - 1)

예:
EAN32, ppO2_limit = 1.4:
MOD = 10 · (1.4 / 0.32 - 1)
    = 33.75m

섹션: 15. CNS Oxygen Clock

공식:
CNS_increment = 100 · Δt / T_limit(ppO2)

누적:
CNS = CNS + CNS_increment

수면 휴식 중 감소:
CNS_after_surface =
CNS_before_surface · 0.5^(surface_interval_minutes / 90)

경고:
if CNS >= 80%:
    warn("CNS 80% 이상")
if CNS >= 100%:
    alert("CNS 한계 초과")

주의:
T_limit(ppO2)는 NOAA oxygen exposure table 또는 그에 준하는 검증된 테이블에서 가져오고, 표 사이 값은 선형 보간한다.

섹션: 16. OTU / UPTD

공식:
if ppO2 <= 0.5:
    OTU_increment = 0
else:
    OTU_increment = Δt · ((ppO2 - 0.5) / 0.5)^0.83

누적:
OTU_total = Σ OTU_increment

섹션: 17. SAC / RMV

입력:
- P_start: 시작 탱크 압력, bar
- P_end: 종료 탱크 압력, bar
- V_cyl: 실린더 내부 용적, L
- t: 시간, min
- P_avg_abs: 평균 절대압, bar

RMV:
RMV = (P_start - P_end) · V_cyl / (t · P_avg_abs)

SAC in bar/min:
SAC_bar = (P_start - P_end) / (t · P_avg_abs)

관계:
RMV = SAC_bar · V_cyl

섹션: 18. Gas Remaining

사용 가능 기체량:
usable_gas_L = (P_tank - P_reserve) · V_cyl

현재 수심 소비율:
gas_rate_at_depth = RMV · P_abs

예비압 도달까지 남은 시간:
time_to_reserve = usable_gas_L / gas_rate_at_depth

섹션: 19. Turn Pressure

단순 왕복:
usable_pressure = P_start - P_reserve
turn_pressure = P_start - usable_pressure / 2

Rule of thirds:
turn_pressure = P_start - usable_pressure / 3

섹션: 20. EAD

공식:
EAD = ((d + 10) · FN2 / 0.79) - 10

예:
EAN32 at 30m:
FN2 = 0.68
EAD = ((30 + 10) · 0.68 / 0.79) - 10
    ≈ 24.4m

섹션: 21. END

산소도 마취성으로 보는 경우:
END = (d + 10) · (1 - FHe) - 10

산소를 비마취성으로 보는 경우:
END = (d + 10) · (FN2 / 0.79) - 10

주의:
이 가정은 교육기관/컴퓨터마다 다를 수 있으므로 설정으로 분리한다.

섹션: 22. Gas Density

표면 혼합기체 밀도:
ρ_mix_surface = FO2·ρO2 + FN2·ρN2 + FHe·ρHe

수심 밀도 근사:
ρ_mix_depth ≈ ρ_mix_surface · P_abs

온도 보정:
ρ_mix_depth =
ρ_mix_surface · P_abs · (T_surface_K / T_gas_K)

경고:
if gas_density > 5.2 g/L:
    warn("가스 밀도 높음")
if gas_density > 6.2~6.3 g/L:
    alert("가스 밀도 위험")

섹션: 23. No-fly Time

단순 규칙:
- single no-decompression dive: 최소 12시간
- repetitive or multi-day diving: 최소 18시간
- decompression dive: 18시간보다 상당히 길게

모델 기반:
P_cabin = pressure_at_altitude(8000 ft)

while surface_GF_at(P_cabin) > allowed_GF:
    simulate_surface_interval(Δt)
    wait_time += Δt

no_fly_time = max(rule_based_minimum, model_based_wait_time)

페이지 3:
title: Diving App / Freediving Mode
slug: diving-app-freediving-mode

내용:
프리다이빙 모드는 압축공기 호흡 기반 NDL 계산이 핵심이 아니다.
핵심은 수심, 시간, 속도, 회복, 반복 다이브 부하, 로그, 행동 경고다.

기능 표를 작성하라.

필수 기능:
1. 자동 다이브 감지
   - d > 1m가 3~5초 지속되면 시작
   - d < 0.5~1m가 일정 시간 지속되면 종료
2. 현재 수심
3. 최대 수심
4. 평균 수심
5. 다이브 시간
6. 수면 휴식 시간
7. 하강/상승 속도
8. 목표 수심 알림
9. 목표 시간 알림
10. 상승 속도 알림
11. 수면 회복 타이머
12. 30초 post-surface check timer
13. 반복 다이브 부하 지표
14. 로그 저장

수면 회복 타이머 기본 규칙:
SI_required = 2 × dive_time

더 깊거나 반복 세션이면 보수적으로:
SI_required = 3 × dive_time

또는 별도 옵션:
SI_required = max_depth / 5 minutes

반복 부하 지표:
total_apnea_time = Σ dive_time
total_vertical = Σ |Δd|
depth_time_index = Σ(max_depth_i × dive_time_i)

UX 경고 예:
if surface_interval < required_surface_interval:
    show "회복 시간 부족"

if dive_time > personal_best * 0.9:
    show "개인 한계 접근"

if max_depth > planned_depth:
    show "계획 수심 초과"

if repeated_deep_dives_count over threshold:
    show "반복 심수 다이브 증가"

중요:
워치 센서만으로 산소 잔량, 블랙아웃 가능성, 저산소 위험을 신뢰성 있게 계산할 수 없음을 명시한다.

페이지 4:
title: Diving App / Scuba Mode
slug: diving-app-scuba-mode

내용:
스쿠버 모드는 사용자가 다이브 컴퓨터로 인식할 수 있으므로 가장 엄격하게 설계한다.

필수 역할:
1. 현재 수심, 최대 수심, 평균 수심
2. 다이브 시간, 바텀 타임
3. 상승 속도 경고
4. Air/Nitrox gas setting
5. ppO2
6. MOD
7. Bühlmann ZHL-16C tissue loading
8. Gradient Factor
9. NDL
10. ceiling
11. safety stop
12. mandatory decompression stop
13. TTS
14. CNS
15. OTU
16. surface interval
17. no-fly time
18. repetitive dive carry-over
19. 로그
20. sensor/app failure handling

상승속도 기본 예:
if d > 18m:
    limit = 12 m/min
elif d > 6m:
    limit = 9 m/min
else:
    limit = 6 m/min

절대 초과 경고:
18 m/min보다 빠른 상승은 강한 경고로 처리한다.

경고 우선순위 표를 작성하라.

우선순위 1:
- MOD 초과: ppO2 > ppO2_limit
- 상승속도 초과: ascent_rate > limit(depth)
- 감압 ceiling 위반: current_depth < ceiling - tolerance
- 앱/센서 이상: 수심값 끊김, 압력 비정상, 배터리 위험

우선순위 2:
- NDL 임박: NDL < 5min, 3min, 1min
- Safety stop 필요
- Safety stop 이탈
- CNS 높음: CNS > 80%, CNS >= 100%
- 가스 부족: time_to_reserve < TTS + margin

우선순위 3:
- 저수온/장시간 노출
- 반복 다이브 보수성 경고
- surface interval 짧음
- residual load 높음

페이지 5:
title: Diving App / State Management
slug: diving-app-state-management

내용:
스쿠버에서 가장 치명적인 버그는 화면 표시 버그가 아니라 tissue state 유실이다.

필수 저장 상태:
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

저장 정책:
every sample:
    persist compact state

로그 정책:
every 1 second:
    append depth, pressure, temp, gas, computed metrics

중요 원칙:
- 앱이 tissue model의 source of truth인지 명확히 해야 한다.
- 마지막 다이브 후 일정 시간 이내 다른 다이브 앱/컴퓨터로 전환하면 residual nitrogen/tissue state가 달라질 수 있다.
- 앱 재시작, watch reboot, battery issue, crash 이후에도 tissue state 복구가 가능해야 한다.
- state corruption이 의심되면 NDL/ceiling을 계속 표시하지 말고 gauge fallback과 강한 경고를 띄운다.

페이지 6:
title: Diving App / Product Roadmap
slug: diving-app-product-roadmap

이 페이지에는 추천 제품 범위와 단계별 구현 순위를 저장한다.

v1: Gauge + Freedive + Log
목표:
가장 안전하고 현실적인 시작점.

기능:
- 현재 수심
- 최대 수심
- 평균 수심
- 다이브 시간
- 수온
- 상승/하강 속도
- 프리다이빙 surface interval
- 30초 post-surface timer
- 목표 수심/시간 알림
- 로그/프로파일
- 스쿠버 gauge mode

v1에서 하지 않는 것:
- NDL 표시
- decompression ceiling 표시
- mandatory deco 계산
- no-fly 계산
- gas remaining 계산

v2: Recreational Scuba No-Decompression
목표:
레크리에이션 Air/Nitrox 다이브 컴퓨터에 가까운 기능.

기능:
- Air/Nitrox
- ppO2
- MOD
- Bühlmann ZHL-16C + Gradient Factors
- NDL
- ceiling
- safety stop
- TTS
- CNS
- no-fly
- repetitive dive tissue carry-over

v2 진입 조건:
- tissue model unit test 완료
- known dive profile regression test 완료
- 앱 재시작 후 tissue state 복구 검증
- sensor failure fallback 검증
- battery/screen lock/background behavior 검증

v3: Gas-integrated Scuba
목표:
무선 압력 송신기 또는 수동 입력 기반 가스 관리.

기능:
- tank pressure
- SAC/RMV
- gas time remaining
- turn pressure
- reserve warning
- gas planning

v3 진입 조건:
- pressure transmitter integration 안정화
- tank profile 설정 UX 완성
- reserve pressure 경고 검증
- TTS + gas remaining 통합 검증

v4: Technical / Trimix / Deco
목표:
미래 확장 후보. MVP에서는 제외.

기능:
- Trimix
- multiple gas switch
- accelerated deco
- helium tissue loading
- END
- gas density
- mandatory deco planning

주의:
Apple Watch Ultra급 40m 레크리에이션 제한과 제품 리스크를 고려하면 v4는 기본 제품 범위에서 제외하고, 별도 제품/별도 인증/별도 검증 대상으로 다룬다.

페이지 7:
title: Diving App / Safety UX and Legal Notes
slug: diving-app-safety-ux-legal-notes

내용:
이 페이지는 safety copy, warning hierarchy, liability-related UX를 정리한다.

반드시 포함할 메시지:
- 이 앱은 훈련과 인증을 대체하지 않는다.
- 워치 앱은 전문 다이브 컴퓨터, 백업 수심계, 타이머, 감압표를 대체하지 않는다.
- 프리다이빙은 혼자 하지 않는다.
- 앱은 블랙아웃, DCS, 산소 독성, 질소 마취, CO2 retention을 확정 예측하지 못한다.
- 센서/배터리/앱 상태 이상 시 즉시 보수적인 절차를 따른다.
- 스쿠버에서 NDL/ceiling을 표시하는 경우, 이전 다이브 정보가 누락되면 값이 틀릴 수 있다.
- 다른 다이브 앱/컴퓨터와 혼용하면 residual nitrogen/tissue loading이 일치하지 않을 수 있다.

UX 원칙:
- 위험 경고는 haptic + visual + persistent state로 제공한다.
- critical warning은 사용자가 실수로 dismiss해도 상태가 해결되기 전까지 계속 남긴다.
- NDL, ceiling, TTS, CNS, gas remaining은 항상 단위와 기준을 함께 표시한다.
- “safe”라는 단어를 함부로 쓰지 않는다.
- “within model limit”, “no mandatory deco obligation currently shown”처럼 제한된 표현을 사용한다.

페이지 8:
title: Diving App / References
slug: diving-app-references

아래 출처들을 레퍼런스로 저장한다.
가능하면 각 출처별로 어떤 기능/공식에 쓰였는지 메모한다.

Reference list:
1. Apple Watch Ultra Depth app and diving safety guidance
   - Topic: device limits, 40m recreational use, Depth app scope, third-party diving app caution, tissue loading app switching caution
   - URL: https://support.apple.com/en-gu/guide/watch/apd9073c83d6/watchos

2. Oceanic+ for Apple Watch Ultra
   - Topic: Apple Watch Ultra scuba/freedive app positioning, Bühlmann ZHL-16C use, recreational dive computer scope
   - URL: https://www.oceanicworldwide.com/oceanic-plus/

3. NOAA Ocean Service: pressure underwater
   - Topic: depth-pressure relationship, 33ft / 10.06m per atmosphere
   - URL: https://oceanservice.noaa.gov/facts/pressure.html

4. PADI Golden Rules of Scuba Diving
   - Topic: ascent rate, safety stop, recreational planning principles, rule of thirds reference
   - URL: https://blog.padi.com/the-golden-rules-of-scuba-diving/

5. DAN: A Critical Look at No-Decompression Limits
   - Topic: NDL as model-based probabilistic boundary, safety stop behavior, computer variation
   - URL: https://dan.org/alert-diver/article/a-critical-look-at-no-decompression-limits/

6. DecoTengu ZH-L16C-GF documentation
   - Topic: Bühlmann ZHL-16C-GF, tissue loading, Schreiner equation, gradient factor ceiling, N2/He mixing
   - URL: https://wrobell.dcmod.org/decotengu/model.html

7. Shearwater: Flexible Control of Decompression Stress
   - Topic: Gradient Factors, GF Low, GF High, decompression conservatism
   - URL: https://shearwater.com/en-kr/blogs/community/flexible-control-of-decompression-stress

8. Shearwater: CNS Oxygen Clock
   - Topic: CNS oxygen exposure calculation, NOAA table, 90-minute CNS half-time on surface
   - URL: https://shearwater.com/en-kr/blogs/community/shearwater-and-the-cns-oxygen-clock

9. DAN: Oxygen Toxicity
   - Topic: ppO2 operating limits, 1.4 ATA, 1.6 ATA, oxygen toxicity risk
   - URL: https://dan.org/health-medicine/health-resources/diseases-conditions/oxygen-toxicity/

10. DAN: Estimating Your Air Consumption
    - Topic: RMV/SAC calculations
    - URL: https://dan.org/alert-diver/article/estimating-your-air-consumption/

11. Subsurface User Manual
    - Topic: NDL, TTS, EAD, Surface GF, dive planning concepts
    - URL: https://subsurface-divelog.org/subsurface-user-manual/

12. DAN: Flying After Diving Guidelines
    - Topic: no-fly time, 12h, 18h, decompression dive caution
    - URL: https://dan.org/health-medicine/health-resource/health-safety-guidelines/guidelines-for-flying-after-diving/

13. DAN: Shallow Water Blackout
    - Topic: freediving blackout risk, behavioral safety
    - URL: https://dan.org/alert-diver/article/shallow-water-blackout/

14. DAN: Could Breath-Hold Diving After Scuba Cause DCS?
    - Topic: freediving, repetitive deep freedives, DCS possibility
    - URL: https://dan.org/alert-diver/article/could-breath-hold-diving-after-scuba-cause-decompression-sickness/

15. DANSA: Terrific Freedive Mode
    - Topic: freedive mode, sampling, surface interval heuristics
    - URL: https://www.dansa.org/blog/2023/03/01/terrific-freedive-mode

16. DAN: Performance Under Pressure
    - Topic: gas density, CO2 retention, work of breathing
    - URL: https://dan.org/alert-diver/article/performance-under-pressure/

17. DANSA: ESOT calculations
    - Topic: OTU/UPTD context
    - URL: https://www.dansa.org/blog/2024/02/06/esot-calculations

페이지 9:
title: Diving App / Open Questions
slug: diving-app-open-questions

내용:
아직 결정해야 할 사항을 저장한다.

질문:
1. v2에서 기본 Gradient Factor 값을 무엇으로 둘 것인가?
   - 예: GF 40/85, 45/85, 50/80 등
   - 제품 보수성 정책 필요
2. Air-only v2로 시작할지, Nitrox까지 v2에 포함할지?
3. Apple Watch Ultra의 depth sensor sampling rate와 background execution behavior를 실제 기기에서 어떻게 검증할지?
4. 수심 센서값 이상치 제거 필터를 어떤 방식으로 구현할지?
5. safety stop trigger depth를 10m로 둘지, 6m/10m/30ft 등 사용자 설정으로 둘지?
6. CNS table은 NOAA 원표 기반으로 내장할지, 검증된 라이브러리 기반으로 둘지?
7. Bühlmann ZHL-16C coefficients는 어떤 canonical source에서 고정할지?
8. v2에서 mandatory deco 상황 발생 시 계속 계산할지, “deco obligation 발생 / 즉시 보수 절차” 중심으로 제한할지?
9. 무선 탱크 압력 송신기 지원 가능성은 어떤 하드웨어/프로토콜에 의존하는지?
10. 로그 export format은 UDDF, Subsurface-compatible format, CSV, JSON 중 무엇을 지원할지?

마지막으로:
- 모든 페이지에 “Last reviewed” 필드를 추가해라.
- Immutable Algorithm Reference 페이지에는 “Do not edit formulas without creating a new version” 경고를 상단에 넣어라.
- Product Roadmap 페이지에는 v1 → v2 → v3 → v4 단계가 명확히 보이도록 작성해라.
- References 페이지는 알고리즘과 제품 요구사항을 검증할 때 항상 먼저 확인하는 링크 모음으로 구성해라.
