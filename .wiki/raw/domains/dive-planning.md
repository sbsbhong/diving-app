Source URL: .wiki/wiki/domains/dive-planning.md
Collected: 2026-06-28
Published: Unknown

# Pre-Karpathy: 다이브 계획 도메인

# 다이브 계획 도메인

## 요약

모바일 Planbook은 레크리에이션 다이빙 전 준비 내용을 기록하는 비중요 계획 알림이다. 계획값은 사용자의 의도와 준비 맥락이며, 실제 다이빙 기록이나 안전 계산 결과가 아니다.

## 현재 상태

모바일 앱은 `DivePlan`을 사용해 계획을 AsyncStorage 기반 `PersistentDivePlanRepository`에 저장한다. 상태는 `draft`, `planned`, `completed` 세 가지만 사용한다. `cancelled` 상태는 현재 구현하지 않는다.

계획은 `diveMode`와 optional `entryStyle`을 함께 갖는다. 현재 새 계획에서 선택 가능한 `diveMode`는 `scuba`와 `freedive` 두 가지이고, `entryStyle`은 shore, boat, pool 같은 입수 맥락을 뜻한다. 둘은 서로 다른 축이다.

Two-mode reset 이후 Planbook 기본 저장소는 v2 key namespace를 사용해 기존 local v1 Planbook 데이터와 분리한다.

## 상세

`DivePlan`은 site, buddy, gear, tags, objective, notes, checklist, planned values를 가진다. Planned values는 `plannedMaxDepthMeters`, `plannedDurationMinutes`, `gasLabel`, `waterCondition`, `visibilityExpectation`, `perceivedDifficulty`, `trainingFocus`, `repetitionTarget`처럼 계획과 준비를 표현한다. Type에는 legacy pool 계획 field가 남아 있지만, 현재 새 계획 UI는 scuba/freedive field만 노출한다.

Planbook editor는 `diveMode`별로 다른 입력 section을 보여준다. Scuba 계획은 gas label, water condition, visibility expectation, perceived difficulty를 다루고, freedive 계획은 repetition target, training focus, perceived difficulty를 다룬다. 숨겨진 모드 전용 field는 현재 선택된 계획값으로 저장하지 않는다.

완료 흐름은 사용자 부담을 줄이기 위해 자동 로그 작성이 아니다. 사용자가 계획을 `completed`로 표시하면 dialog에서 Logbook 초안을 지금 만들지 나중에 할지 선택한다. 나중에 선택해도 계획은 완료 상태로 남고, 완료된 계획 상세에서 다시 `Create log from plan`을 실행할 수 있다.

계획에서 Logbook 초안으로 복사하는 값은 site, buddy, gear, tags, dive mode, optional `entryStyle`, gas label, objective/training focus/notes 같은 metadata로 제한한다. 계획 최대 수심, 계획 시간, 예상 시야, 예상 난이도, checklist 상태는 실제 측정값이 아니므로 Logbook measured value에 복사하지 않는다. 초안은 Logbook editor에서 사용자가 확인하고 저장해야 실제 `DiveLogEntry`가 된다.

Watch 앱에서 모바일 계획을 선택해 기록을 시작하면 watch session은 `sourcePlanLocalId`와 `planTitle`을 함께 저장한다. 모바일 import는 이 id로 원본 계획을 찾아 계획 title, site, buddy, gear, tags, notes, dive mode, gas label, training metadata를 imported log의 manual overlay에 합치고, 원본 계획을 `completed` 상태와 `convertedLogLocalId`로 갱신한다. 이때 watch가 측정한 수심, 시간, 수온, sample profile은 watch capture 기준으로 유지하며 계획값으로 덮어쓰지 않는다.

현재 Planbook 기본 저장소는 AsyncStorage 기반 persistent repository다. Supabase나 cloud sync는 아직 없다.

## 관련 문서

- [[architecture/mobile]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
