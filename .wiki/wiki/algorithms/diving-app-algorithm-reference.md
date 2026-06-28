# Diving App / Immutable Algorithm Reference

Sources: user pasted request, 2026-06-28; user pasted hardening request, 2026-06-28
Raw: [Diving app technical wiki request](../../raw/algorithms/2026-06-28-diving-app-technical-wiki-request.md); [Diving app wiki hardening request](../../raw/algorithms/2026-06-28-diving-app-wiki-hardening-request.md)
Updated: 2026-06-28
Status: Immutable / Needs Validation
Owner: local product/dev agent
Last reviewed: 2026-06-28
Change policy: formulas require versioned change
Related pages: [Diving App / References](../project/diving-app-references.md); [Diving App / QA and Test Plan](../project/diving-app-qa-test-plan.md); [Diving App / State Management](../architecture/diving-app-state-management.md); [Diving App / Non-Negotiable Safety Rules](../domains/diving-app-non-negotiable-safety-rules.md)
Slug: diving-app-algorithm-reference

> This page is an immutable algorithm reference. Do not edit formulas without creating a new version.
>
> Unit clarification, variable naming cleanup, and explanatory notes are allowed. Formula changes require a new version section, reason for change, changed by, changed date, validation requirements, and regression test impact.

## 요약

이 문서는 프리다이빙/스쿠버 제품 검토에서 반복 참조할 공식과 모델 전제를 보존하는 불변 레퍼런스다. 공식은 제품 구현의 후보 기준 자료일 뿐이며, 어떤 값도 안전 보장, 의료 판단, certified dive-computer 판단으로 취급하지 않는다.

## 공통 전제

스쿠버 관련 NDL, ceiling, decompression, CNS, OTU, MOD, gas calculation은 사용자가 다이브 컴퓨터처럼 받아들일 수 있다. 구현 시에는 단위, state 보존, 센서 실패, 이전 다이브 반영, regression test, 실제 기기 검증을 함께 요구한다.

현재 저장소의 v1 현실적 범위는 gauge, freedive, log다. 아래 공식이 존재한다고 해서 현재 앱이 certified dive computer 기능을 제공한다는 뜻은 아니다.

## Formula Status Labels

- Current Formula: 현재 구현 기준으로 삼을 공식.
- Needs Validation: 구현 전 canonical source 또는 테스트 검증이 필요한 공식.
- Deprecated Formula: 더 이상 사용하지 않는 공식.
- Future Extension: 현재 제품 범위에는 없지만 미래 확장을 위해 보관하는 공식.

## Formula Status Summary

| Section | Status | Reason |
|---|---|---|
| Depth and Pressure | Current Formula | NOAA pressure reference와 물리 단위 검증 대상이다. |
| Depth Rate | Current Formula | 단순 rate 공식은 기준으로 쓰되 smoothing은 Needs Validation이다. |
| Average Depth | Current Formula | 시간가중 평균 공식이다. |
| Gas Partial Pressure | Current Formula | gas fraction 입력 검증이 필요하지만 공식 자체는 기준으로 둔다. |
| Bühlmann Tissue Loading | Needs Validation | ZHL-16C coefficient table canonical source가 아직 고정되지 않았다. |
| N2 + He Mixed Gas Tissue Calculation | Future Extension / Needs Validation | Trimix와 helium loading은 v4 범위이며 coefficient source 검증이 필요하다. |
| Gradient Factor Ceiling | Needs Validation | GF policy와 coefficient source 검증이 필요하다. |
| NDL Calculation | Needs Validation | known dive profile regression과 previous dive state 검증이 필요하다. |
| Safety Stop | Needs Validation | trigger depth와 countdown policy가 제품 결정 대상이다. |
| Mandatory Decompression Stop | Future Extension / Needs Validation | 기본 제품 범위 밖이며 mandatory deco 처리 정책이 미확정이다. |
| TTS | Needs Validation | stop model, ascent profile, state 복구 검증이 필요하다. |
| Surface GF | Needs Validation | Subsurface 개념과 coefficient 검증이 필요하다. |
| ppO2 | Current Formula | limit policy는 제품 결정 대상이지만 공식은 기준으로 둔다. |
| MOD | Current Formula | ppO2 limit과 FO2 입력 검증이 필요하다. |
| CNS Oxygen Clock | Needs Validation | NOAA table source와 interpolation policy가 아직 고정되지 않았다. |
| OTU / UPTD | Needs Validation | source table/unit/reset policy가 필요하다. |
| SAC / RMV | Current Formula | gas integration 전 regression test가 필요하다. |
| Gas Remaining | Needs Validation | pressure transmitter/RMV/TTS 통합 검증 전 Current Formula로 승격하지 않는다. |
| Turn Pressure | Needs Validation | planning reference이며 제품 policy가 필요하다. |
| EAD | Current Formula | 정확 압력 모델과 근사값 차이를 문서화해야 한다. |
| END | Future Extension / Needs Validation | oxygen narcotic policy가 미확정이다. |
| Gas Density | Future Extension / Needs Validation | threshold source와 제품 policy가 필요하다. |
| No-fly Time | Needs Validation | rule-based reminder와 model-based simulation 정책이 필요하다. |

## 1. Depth and Pressure

공식:

```txt
P_abs = P_surface + ρ_water · g · d / 100000
P_abs ≈ P_surface + d / 10.06
P_abs ≈ 1.0 + d / 10
d = (P_abs - P_surface) · 100000 / (ρ_water · g)
```

입력값은 `P_surface`(bar), `ρ_water`(kg/m³), `g`(m/s²), `d`(m), 또는 역산 시 `P_abs`(bar)다. 해수 밀도 근사는 `1025 kg/m³`, 담수 근사는 `1000 kg/m³`, 표준 중력은 `9.80665 m/s²`다.

출력값은 절대압 `P_abs`(bar) 또는 수심 `d`(m)다. 고도 다이빙이나 비행 후 이동을 고려하려면 `P_surface`를 고정 `1.0 bar`로 두지 말고 실제 기압/고도를 반영해야 한다. 이 압력값은 이후 공식의 입력이며 안전 보장이 아니다.

## 2. Depth Rate

공식:

```txt
v = Δd / Δt
ascent_rate = max(0, -Δd / Δt)
descent_rate = max(0,  Δd / Δt)
ascent_rate_mpm = ascent_rate_mps × 60
```

입력값은 수심 변화 `Δd`(m)와 시간 변화 `Δt`(s 또는 min)다. 출력값은 상승/하강 속도이며, 초당 meter를 분당 meter로 변환할 때 `× 60`을 적용한다.

센서 노이즈 제거를 위해 3~10초 이동평균, low-pass filter, Kalman filter 중 하나를 선택해야 한다. 필터 선택은 열린 질문이며, 과도한 smoothing은 실제 급상승을 늦게 표시할 수 있다.

## 3. Average Depth

공식:

```txt
avg_depth = Σ(d_i · Δt_i) / ΣΔt_i
```

입력값은 각 sample의 수심 `d_i`(m)와 sample 유지 시간 `Δt_i`다. 출력값은 시간가중 평균 수심(m)이다.

sample 간격이 일정하지 않으면 단순 산술평균이 아니라 시간가중 평균을 사용한다. 센서 누락 구간은 별도 품질 표시가 필요하다.

## 4. Gas Partial Pressure

공식:

```txt
ppO2 = FO2 · P_abs
ppN2 = FN2 · P_abs
ppHe = FHe · P_abs
FO2 ≈ 0.21
FN2 ≈ 0.79
FO2 + FN2 + FHe = 1
```

입력값은 절대압 `P_abs`(bar)와 기체 fraction `FO2`, `FN2`, `FHe`다. 출력값은 각 기체의 partial pressure(bar 또는 ATA)다.

공기는 `FO2 ≈ 0.21`, `FN2 ≈ 0.79`로 둔다. EAN32 예시는 `FO2 = 0.32`, `FN2 = 0.68`이다. Trimix에서는 세 fraction 합이 1이어야 한다. 잘못된 gas setting은 이후 모든 스쿠버 계산을 오염시킨다.

## 5. Bühlmann Tissue Loading

전제는 Bühlmann ZH-L16 계열, 특히 ZHL-16C + Gradient Factors다.

공식:

```txt
k_i,g = ln(2) / T_half_i,g
P_alv_g = F_g · (P_abs - P_H2O)
P_H2O ≈ 0.0627 bar
P_tissue_g(t) = P_alv_g + (P_tissue_g(0) - P_alv_g) · e^(-k·t)
P_tissue(t)
= P_alv0 + R · (t - 1/k)
  - (P_alv0 - P_tissue0 - R/k) · e^(-k·t)
```

입력값은 tissue compartment half-time `T_half_i,g`(min), 절대압 `P_abs`(bar), gas fraction `F_g`, 시작 tissue pressure, 시간 `t`(min), 선형 변화 구간의 `P_alv0`와 `R`(bar/min)이다. 출력값은 gas별 tissue pressure(bar)다.

일정 수심에서는 exponential update를 사용하고, 상승/하강 중 선형 압력 변화 구간에서는 Schreiner equation을 사용한다. `P_H2O`는 수증기압 근사값이다. 계수 source와 regression profile은 [Diving App / Open Questions](../questions/diving-app-open-questions.md)에 남아 있다.

TODO:

- canonical ZHL-16C N2/He half-time, `a`, `b` coefficient table source 확정.
- coefficient table을 코드 상수로 고정하기 전 독립 출처 2개 이상과 대조.
- Subsurface, Shearwater 문서, Bühlmann 원자료 또는 검증된 오픈소스 구현과 비교.
- coefficient 변경 시 기존 dive state와 regression test에 미치는 영향 문서화.
- GF 기본값 정책 확정 전 제품 보수성 검토.

Bühlmann ZHL-16C coefficient table은 아직 이 문서에 최종 고정하지 않는다. 계수값을 넣어야 한다면 반드시 Needs Validation으로 표시하고, canonical source 확정 전까지 Current Formula로 승격하지 않는다.

## 6. N2 + He Mixed Gas Tissue Calculation

공식:

```txt
P_i = P_N2_i + P_He_i
a_i = (a_N2_i · P_N2_i + a_He_i · P_He_i) / (P_N2_i + P_He_i)
b_i = (b_N2_i · P_N2_i + b_He_i · P_He_i) / (P_N2_i + P_He_i)
```

입력값은 tissue별 `P_N2_i`, `P_He_i`와 gas별 Bühlmann `a`, `b` coefficient다. 출력값은 혼합 inert gas pressure와 혼합 coefficient다.

v1/v2에서 Trimix를 지원하지 않더라도 미래 확장용 레퍼런스로 보관한다. denominator가 0이 되는 상태는 허용하지 않는다. 이 식은 technical/trimix 범위이며 기본 제품 범위에 넣지 않는다.

## 7. Gradient Factor Ceiling

공식:

```txt
P_amb_allowed
= (P_tissue - a · GF) / (GF / b + 1 - GF)
ceiling_m = max(0, (P_amb_allowed - P_surface) · 10.06)
ceiling = max_i(ceiling_i)
x = (P_amb - P_surface) / (P_first_stop - P_surface)
GF_current = GF_high + x · (GF_low - GF_high)
```

검증:

```txt
first stop: P_amb = P_first_stop, x = 1, GF_current = GF_low
surface: P_amb = P_surface, x = 0, GF_current = GF_high
```

입력값은 tissue pressure `P_tissue`(bar), coefficient `a`, `b`, gradient factor `GF`, surface pressure, first-stop pressure, current ambient pressure다. 출력값은 허용 주변압과 ceiling depth(m)다.

모든 조직 중 가장 깊은 ceiling을 사용한다. GF 선택은 제품 보수성 정책이므로 기본값을 임의로 고정하지 않는다.

## 8. NDL Calculation

정의: NDL은 현재 수심에 그대로 머물렀을 때, 직접 상승 또는 safety stop 포함 상승을 해도 mandatory decompression ceiling이 생기지 않는 최대 남은 시간이다.

수치 시뮬레이션 의사코드:

```txt
function computeNDL(state, current_depth):
    for τ from 0 to max_search_time step 1 minute:
        test_state = clone(state)
        simulate_hold(test_state, current_depth, τ)
        simulate_ascent(test_state, ascent_rate_profile)

        if ceiling(test_state) > 0:
            return τ - 1 minute

    return "> max_search_time"
```

이분 탐색 버전:

```txt
low = 0
high = 200 min

while high - low > 0.5 min:
    mid = (low + high) / 2
    if ascent_after_hold_is_no_deco(mid):
        low = mid
    else:
        high = mid

NDL = low
```

입력값은 현재 tissue state, 현재 수심, 상승 profile, search limit다. 출력값은 남은 시간(min) 또는 `> max_search_time`이다.

NDL은 현재 다이브만이 아니라 이전 다이브의 tissue state를 포함해야 한다. state 유실 후 NDL/ceiling을 계속 표시하면 안 된다. NDL은 모델 기반 경계이지 DCS 위험을 확정 예측하지 않는다.

## 9. Safety Stop

공식과 규칙:

```txt
if no_deco_dive and max_depth >= safety_stop_trigger_depth:
    required_safety_stop = 180 sec
else:
    required_safety_stop = 0

safety_stop_trigger_depth = 10m
safety_stop_band = 3m ~ 6m
safety_stop_target = 5m

if 3m <= current_depth <= 6m and ascent_rate <= allowed_rate:
    remaining_stop_time -= Δt
else:
    pause countdown

if NDL <= 5min or ascent_rate_violation:
    required_safety_stop = 300 sec
```

입력값은 dive type, max depth, current depth, ascent rate, `Δt`, NDL 상태다. 출력값은 요구 또는 권장 stop time(sec)과 countdown state다.

이 값은 no-decompression recreational dive의 보조 reminder다. mandatory safety guidance로 표시하지 않는다.

## 10. Mandatory Decompression Stop

공식과 절차:

```txt
stop_depths = [30m, 27m, 24m, 21m, 18m, 15m, 12m, 9m, 6m, 3m]
next_stop = smallest stop_depth where stop_depth >= ceiling

while ceiling > next_shallower_stop_depth:
    hold at current_stop_depth
    update_tissues(Δt)
    stop_time += Δt
```

입력값은 현재 ceiling, stop depth ladder, tissue state, 시간 step이다. 출력값은 다음 정지 깊이와 정지 시간이다.

현재 ceiling보다 얕은 정지로 올라가면 안 된다는 모델 규칙을 보존한다. 다만 mandatory decompression은 MVP와 기본 제품 범위가 아니며, v2에서도 발생 시 계산을 계속할지 제한 문구 중심으로 처리할지는 열린 질문이다.

## 11. TTS

공식:

```txt
TTS =
    time_to_ascend_to_first_stop
  + Σ mandatory_stop_times
  + time_between_stops
  + optional_safety_stop_time
  + final_ascent_time
```

입력값은 상승 시간, mandatory stop times, stop 간 이동 시간, optional safety stop time, final ascent time이다. 출력값은 Time To Surface(min 또는 sec)다.

TTS는 tissue state와 stop model, gas remaining 계산에 영향을 받는다. 입력 state가 불완전하면 표시하지 않거나 fallback해야 한다.

## 12. Surface GF

공식:

```txt
GF_required =
(P_tissue - P_target) /
(a + P_target / b - P_target)

surface_GF = max_i(GF_required_i) × 100

if surface_GF > 100:
    show "즉시 수면 상승 금지 / ceiling 존재"
```

입력값은 tissue pressure, target pressure, `a`, `b` coefficient다. 출력값은 Surface GF(%)와 ceiling 존재 여부다.

원문 판정 예시는 `surface_GF > 100`일 때 ceiling 존재를 표시한다. 실제 제품 문구는 [Diving App / Safety UX and Legal Notes](../domains/diving-app-safety-ux-legal-notes.md)의 표현 제한을 따라야 하며, 생명안전 지시처럼 보이면 안 된다.

## 13. ppO2

공식:

```txt
ppO2 = FO2 · P_abs

if ppO2 > ppO2_limit:
    alert("MOD 초과 / ppO2 위험")
```

입력값은 `FO2`와 `P_abs`(bar/ATA)다. 출력값은 ppO2(ATA)와 limit 초과 상태다.

일반 기준은 recreational open circuit에서 `ppO2_limit = 1.4 ATA`를 기본 operational limit로 두고, `1.6 ATA`는 contingency 또는 절대 상한으로 다루는 것이다. 산소 독성 위험을 확정 예측하지 않는다.

## 14. MOD

공식:

```txt
MOD = 10.06 · (ppO2_limit / FO2 - P_surface)
MOD_m = 10 · (ppO2_limit / FO2 - 1)

EAN32, ppO2_limit = 1.4:
MOD = 10 · (1.4 / 0.32 - 1)
    = 33.75m
```

입력값은 `ppO2_limit`, `FO2`, `P_surface`다. 출력값은 maximum operating depth(m)다.

`FO2`가 잘못 입력되면 MOD는 무효다. `P_surface`를 고정 1.0으로 두는 근사는 고도/기압 조건에서 부정확해질 수 있다.

## 15. CNS Oxygen Clock

공식:

```txt
CNS_increment = 100 · Δt / T_limit(ppO2)
CNS = CNS + CNS_increment
CNS_after_surface =
CNS_before_surface · 0.5^(surface_interval_minutes / 90)

if CNS >= 80%:
    warn("CNS 80% 이상")
if CNS >= 100%:
    alert("CNS 한계 초과")
```

입력값은 ppO2, 노출 시간 `Δt`, `T_limit(ppO2)`, 수면 휴식 시간이다. 출력값은 CNS oxygen clock percent다.

`T_limit(ppO2)`는 NOAA oxygen exposure table 또는 그에 준하는 검증된 테이블에서 가져오고, 표 사이 값은 선형 보간한다. CNS table source는 열린 질문으로 남아 있다.

## 16. OTU / UPTD

공식:

```txt
if ppO2 <= 0.5:
    OTU_increment = 0
else:
    OTU_increment = Δt · ((ppO2 - 0.5) / 0.5)^0.83

OTU_total = Σ OTU_increment
```

입력값은 ppO2와 노출 시간 `Δt`다. 출력값은 OTU/UPTD 누적값이다.

OTU는 oxygen exposure reference metric이며 안전 보장이 아니다. 테이블, 단위, reset policy는 구현 전에 고정해야 한다.

## 17. SAC / RMV

공식:

```txt
RMV = (P_start - P_end) · V_cyl / (t · P_avg_abs)
SAC_bar = (P_start - P_end) / (t · P_avg_abs)
RMV = SAC_bar · V_cyl
```

입력값은 `P_start`(bar), `P_end`(bar), `V_cyl`(L), 시간 `t`(min), 평균 절대압 `P_avg_abs`(bar)다. 출력값은 RMV(L/min)와 SAC(bar/min)다.

탱크 압력 source가 수동 입력인지 송신기인지에 따라 신뢰성이 달라진다. Gas-integrated 범위는 v3 이후로 둔다.

## 18. Gas Remaining

공식:

```txt
usable_gas_L = (P_tank - P_reserve) · V_cyl
gas_rate_at_depth = RMV · P_abs
time_to_reserve = usable_gas_L / gas_rate_at_depth
```

입력값은 현재 탱크 압력, 예비압, 실린더 용적, RMV, 절대압이다. 출력값은 usable gas volume(L), 현재 수심 소비율(L/min), 예비압 도달까지 남은 시간이다.

RMV와 tank pressure가 불확실하면 gas remaining도 불확실하다. `time_to_reserve < TTS + margin` 같은 warning은 TTS와 RMV가 모두 검증된 뒤에만 쓴다.

## 19. Turn Pressure

공식:

```txt
usable_pressure = P_start - P_reserve
turn_pressure = P_start - usable_pressure / 2
turn_pressure = P_start - usable_pressure / 3
```

입력값은 시작 압력과 예비압이다. 출력값은 단순 왕복 또는 rule of thirds 기준 turn pressure다.

이 공식은 계획 reference이며 상황별 훈련, 환경, 팀 절차를 대체하지 않는다.

## 20. EAD

공식:

```txt
EAD = ((d + 10) · FN2 / 0.79) - 10

EAN32 at 30m:
FN2 = 0.68
EAD = ((30 + 10) · 0.68 / 0.79) - 10
    ≈ 24.4m
```

입력값은 수심 `d`(m)와 nitrogen fraction `FN2`다. 출력값은 equivalent air depth(m)다.

10m 근사는 surface pressure와 seawater approximation을 단순화한다. 고도/담수/정확 압력 모델에서는 보정이 필요할 수 있다.

## 21. END

공식:

```txt
END = (d + 10) · (1 - FHe) - 10
END = (d + 10) · (FN2 / 0.79) - 10
```

입력값은 수심 `d`, helium fraction `FHe`, nitrogen fraction `FN2`다. 출력값은 equivalent narcotic depth(m)다.

첫 식은 산소도 마취성으로 보는 경우, 둘째 식은 산소를 비마취성으로 보는 경우다. 이 가정은 교육기관/컴퓨터마다 다를 수 있으므로 설정과 reference source를 분리한다.

## 22. Gas Density

공식:

```txt
ρ_mix_surface = FO2·ρO2 + FN2·ρN2 + FHe·ρHe
ρ_mix_depth ≈ ρ_mix_surface · P_abs
ρ_mix_depth =
ρ_mix_surface · P_abs · (T_surface_K / T_gas_K)

if gas_density > 5.2 g/L:
    warn("가스 밀도 높음")
if gas_density > 6.2~6.3 g/L:
    alert("가스 밀도 위험")
```

입력값은 gas fraction, gas별 표면 밀도, 절대압, 온도(K)다. 출력값은 gas density(g/L)와 threshold 상태다.

가스 밀도는 work of breathing, CO2 retention risk와 관련된 reference metric이다. 단독 안전 판정으로 쓰지 않는다.

## 23. No-fly Time

공식과 규칙:

```txt
single no-decompression dive: 최소 12시간
repetitive or multi-day diving: 최소 18시간
decompression dive: 18시간보다 상당히 길게

P_cabin = pressure_at_altitude(8000 ft)

while surface_GF_at(P_cabin) > allowed_GF:
    simulate_surface_interval(Δt)
    wait_time += Δt

no_fly_time = max(rule_based_minimum, model_based_wait_time)
```

입력값은 dive category, cabin pressure, tissue state, allowed GF, surface interval simulation step이다. 출력값은 no-fly wait time이다.

No-fly 값은 medical 또는 aviation safety guarantee가 아니다. 현재 저장소에서는 non-certified reminder로만 다룬다.

## 관련 문서

- [Diving App / References](../project/diving-app-references.md)
- [Diving App / QA and Test Plan](../project/diving-app-qa-test-plan.md)
- [Diving App / State Management](../architecture/diving-app-state-management.md)
- [Diving App / Scuba Mode](../domains/diving-app-scuba-mode.md)
- [Diving App / Safety UX and Legal Notes](../domains/diving-app-safety-ux-legal-notes.md)
- [Diving App / Non-Negotiable Safety Rules](../domains/diving-app-non-negotiable-safety-rules.md)
