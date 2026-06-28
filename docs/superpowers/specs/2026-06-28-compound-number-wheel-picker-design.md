# Compound NumberWheelPicker 설계

작성일: 2026-06-28

## 배경

기존 `NumberWheelPicker`는 단일 숫자와 단위 조합에는 적합하지만, iOS Date Picker처럼 하나의 박스 안에서 여러 숫자 column을 동시에 고르는 경험은 제공하지 않는다. 프리다이버의 실제 로그에서는 초 단위 기록이 중요하고, 수심 입력은 `19.6m`처럼 정수부와 소수부를 분리해 고르는 편이 더 빠르고 정확하다.

이번 설계의 목표는 현재 개선된 wheel row/windowing/animation 동작을 보존하면서, 같은 박스 안에서 여러 column을 조합하는 `MultiColumnNumberWheelPicker` 계열을 추가하는 것이다.

## 확정 범위

- Logbook 수동 기록/수정의 시간 입력은 분/초 복합 picker로 바꾼다.
- Planning 시간 입력은 기존 분 단위 picker를 유지한다.
- Logbook 수동 기록/수정의 최대 수심 입력은 정수부/소수부/단위 복합 picker로 바꾼다.
- Planning 최대 수심 입력도 정수부/소수부/단위 복합 picker로 바꾼다.
- 압력, 반복 횟수, 별점, 계획 시간 등 다른 numeric field는 기존 단일 `NumberWheelPicker` 또는 기존 field를 유지한다.

## UX 결정

시간은 두 개의 scrollable column으로 표시한다.

```text
10 min | 03 sec
```

수심은 정수부, 소수부, 고정 단위 column으로 표시한다. 단위는 스크롤하지 않는다.

```text
19 | .6 | m
```

두 UI 모두 하나의 outer border, 하나의 selection band, 하나의 height를 공유한다. 각 scrollable column은 기존 `NumberWheelPicker`에서 만든 row emphasis, fast transform/opacity animation, scroll-backed manual windowing을 재사용한다.

## Data Model

저장 모델은 기존 타입을 유지한다.

- Logbook duration: `DiveLogManualMeasuredValues.durationSeconds`
- Logbook depth: `DiveLogManualMeasuredValues.maxDepthMeters`
- Planning duration: `DivePlanValues.plannedDurationMinutes`
- Planning depth: `DivePlanValues.plannedMaxDepthMeters`

Logbook editor form state는 duration field를 초 기준으로 다루도록 바꾼다. 기존 `durationMinutes` form value는 `durationSeconds`로 전환한다. 이 변경은 초 단위 watch import 값을 손실 없이 표시하고 저장하기 위한 것이다.

Planning form state는 기존 `plannedDurationMinutes`를 유지한다.

## Watch Defaults And Provenance

Watch에서 수신한 값은 form default로 보이되, 사용자가 건드리지 않는 한 manual override로 저장하지 않는다.

- Watch `durationSeconds = 602`는 Logbook editor에서 `10 min | 02 sec`로 표시한다.
- Watch `maxDepthMeters = 18.6`은 `18 | .6 | m`로 표시한다.
- 초기값 분해는 pure display transform이다. mount, prop sync, scroll position sync 과정에서 `field.onChange`를 호출하지 않는다.
- 사용자가 해당 composite wheel을 스크롤하거나 직접 입력을 commit할 때만 `react-hook-form` field가 dirty가 된다.
- untouched watch default는 기존 provenance fallback을 유지한다.
- touched value는 해당 field만 manual provenance로 저장한다.

Pending plan draft에서 온 값과 기존 manual edit 값도 같은 분해 규칙을 사용한다. 값의 출처가 watch, manual, pending draft 중 어디든 UI는 composite로 보여주고 저장은 기존 seconds/meters number로 합성한다.

## Component Architecture

`NumberWheelPicker`는 기존 단일 숫자 picker로 유지한다. 새 복합 picker는 별도 component로 추가한다.

```tsx
<MultiColumnNumberWheelPicker
  columns={[
    { id: 'minutes', value: 10, min: 0, max: 240, unitLabel: 'min' },
    { id: 'seconds', value: 3, min: 0, max: 59, unitLabel: 'sec', padStart: 2 },
  ]}
  onColumnChange={handleColumnChange}
/>
```

내부 구조는 다음과 같다.

- `MultiColumnNumberWheelPicker.Root`: outer border, disabled state, shared height, shared selection overlay를 소유한다.
- `MultiColumnNumberWheelPicker.Column`: scrollable number column이다. 기존 wheel row rendering, windowing, snap, animated emphasis를 공유한다.
- `MultiColumnNumberWheelPicker.FixedColumn`: `m` 같은 고정 단위 column이다.
- `MultiColumnNumberWheelPicker.CenterInputTrigger`: composite direct input을 연다.

구현에서는 기존 `NumberWheelPicker` 파일이 과도하게 커지지 않도록 공통 wheel helper를 분리할 수 있다. 단일 picker와 복합 picker가 같은 row/windowing/presentation helper를 사용하게 하되, 공개 API는 단순하게 유지한다.

## Field Wrappers

복합 picker는 화면에서 직접 사용하지 않고 field wrapper를 통해 연결한다.

### `DurationWheelField`

```tsx
<DurationWheelField
  valueSeconds={field.value}
  maxSeconds={240 * 60}
  onChange={field.onChange}
/>
```

- `valueSeconds`를 `minutes = floor(seconds / 60)`, `seconds = seconds % 60`으로 분해한다.
- seconds column은 항상 `00..59`로 표시한다.
- max에 닿은 minute에서는 seconds를 허용 가능한 범위로 clamp한다. 예를 들어 max가 240분이면 `240 min | 00 sec`까지만 가능하다.
- 직접 입력은 `10:03`, `10m03s`, `603` 같은 입력을 지원한다. `603`은 초로 해석한다.

### `DepthWheelField`

```tsx
<DepthWheelField
  valueMeters={field.value}
  maxMeters={60}
  onChange={field.onChange}
/>
```

- `valueMeters`를 `integerMeters`와 `decimalTenths`로 분해한다.
- decimal column은 `.0.. .9`를 표시한다.
- unit column은 `m`을 중앙 selection row에 고정 표시한다.
- max에 닿은 integer에서는 decimal을 허용 가능한 범위로 clamp한다. 예를 들어 max가 60이면 `60 | .0 | m`까지만 가능하다.
- 직접 입력은 `19.6`을 meter number로 해석한다.

## Error Handling And Edge Cases

- `undefined` value는 wheel 위치를 잡기 위해 visual fallback으로 min/0을 표시한다. 단, 사용자가 조작하기 전까지 form value는 `undefined`로 유지하며 `onChange`를 호출하지 않는다. Required validation은 submit 시 schema가 담당한다.
- 잘못된 direct input은 이전 표시값으로 되돌리고 `onChange`를 호출하지 않는다.
- composite value가 max/min을 넘으면 clamp한다.
- 소수 수심은 0.1m precision으로 normalize한다.
- duration은 정수 초로 normalize한다.
- column 간 의존성은 parent field wrapper가 처리한다. 예를 들어 minute이 max minute으로 이동하면 seconds column을 0으로 제한한다.

## Testing

새 테스트는 `apps/mobile/__tests__/number-wheel-picker.test.tsx`와 관련 form 테스트에 추가한다.

- `MultiColumnNumberWheelPicker`가 하나의 shared selection band와 여러 column을 렌더링하는지 검증한다.
- duration `602`가 `10 min | 02 sec`로 렌더링되는지 검증한다.
- duration wheel 변경이 정확한 seconds value를 emit하는지 검증한다.
- duration direct input `10:03`이 `603`초로 commit되는지 검증한다.
- depth `18.6`이 `18 | .6 | m`로 렌더링되는지 검증한다.
- depth wheel 변경이 정확한 meter value를 emit하는지 검증한다.
- depth direct input `19.6`이 `19.6`으로 commit되는지 검증한다.
- max clamp를 검증한다: `60 | .0 | m`, `240 min | 00 sec`.
- watch default value가 untouched 상태에서 manual override provenance를 만들지 않는지 `logbook-manual-entry.test.tsx`로 검증한다.
- touched watch default가 해당 field만 manual provenance로 저장되는지 검증한다.
- Planning duration은 기존 분 단위 picker로 남고, Planning depth만 split picker로 바뀌는지 검증한다.

최소 verification은 다음 순서로 실행한다.

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx logbook-manual-entry.test.tsx planning-screen.test.tsx --runInBand
yarn mobile:typecheck
```

## Out Of Scope

- Watch sync contract 변경
- WatchOS UI 변경
- Supabase, auth, cloud sync 변경
- 감압, 조직 loading, gas switching safety, emergency dive decision 계산
- 다이빙 안전 판단 또는 certified dive computer처럼 보이는 기능
