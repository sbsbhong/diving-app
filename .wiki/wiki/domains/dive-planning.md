# 다이브 계획 도메인

## 요약

모바일 Planbook은 레크리에이션 다이빙 전 준비 내용을 기록하는 비중요 계획 알림이다. 계획값은 사용자의 의도와 준비 맥락이며, 실제 다이빙 기록이나 안전 계산 결과가 아니다.

## 현재 상태

모바일 앱은 `DivePlan`을 사용해 계획을 in-memory `LocalDivePlanRepository`에 저장한다. 상태는 `draft`, `planned`, `completed` 세 가지만 사용한다. `cancelled` 상태는 현재 구현하지 않는다.

계획은 `diveMode`와 optional `entryStyle`을 함께 갖는다. `diveMode`는 scuba, freedive, snorkel, pool 같은 활동 종류를 뜻하고, `entryStyle`은 shore, boat, pool 같은 입수 맥락을 뜻한다. 둘은 서로 다른 축이다.

## 상세

`DivePlan`은 site, buddy, gear, tags, objective, notes, checklist, planned values를 가진다. Planned values는 `plannedMaxDepthMeters`, `plannedDurationMinutes`, `gasLabel`, `waterCondition`, `visibilityExpectation`, `perceivedDifficulty`, `trainingFocus`, `repetitionTarget`, `poolLengthMeters`, `lapTarget`처럼 계획과 준비를 표현한다.

Planbook editor는 `diveMode`별로 다른 입력 section을 보여준다. Pool 계획은 계획 최대 수심 field를 쓰지 않고 pool length, lap target, planned duration, training focus를 다룬다. Scuba, freedive, snorkel 계획은 각 모드에 맞는 planned field를 보여준다. 숨겨진 모드 전용 field는 현재 선택된 계획값으로 저장하지 않는다.

완료 흐름은 사용자 부담을 줄이기 위해 자동 로그 작성이 아니다. 사용자가 계획을 `completed`로 표시하면 dialog에서 Logbook 초안을 지금 만들지 나중에 할지 선택한다. 나중에 선택해도 계획은 완료 상태로 남고, 완료된 계획 상세에서 다시 `Create log from plan`을 실행할 수 있다.

계획에서 Logbook 초안으로 복사하는 값은 site, buddy, gear, tags, dive mode, optional `entryStyle`, gas label, objective/training focus/notes 같은 metadata로 제한한다. 계획 최대 수심, 계획 시간, 예상 시야, 예상 난이도, checklist 상태는 실제 측정값이 아니므로 Logbook measured value에 복사하지 않는다. 초안은 Logbook editor에서 사용자가 확인하고 저장해야 실제 `DiveLogEntry`가 된다.

현재 Planbook 저장소는 production persistence가 아니다. 앱 실행 중 React Query와 local repository가 상태를 들고 있으며, Supabase나 device storage가 생기기 전까지 앱 재시작 뒤 계획 보존은 제공하지 않는다.

## 관련 문서

- [[architecture/mobile]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
