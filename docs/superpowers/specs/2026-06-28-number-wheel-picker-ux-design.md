# NumberWheelPicker UX 개선 설계

작성일: 2026-06-28

## 배경

`NumberWheelPicker`는 수동 로그와 계획 입력 화면에서 숫자를 고르는 공통 UI다. 현재 목표는 iOS Date Picker의 wheel 감각에 가깝게 만들면서, 큰 숫자를 빠르게 입력할 수 있는 직접 입력 기능도 유지하는 것이다.

현재 문제는 세 가지다.

- 스크롤 중 가운데에 포커스되는 값이 즉시 바뀌는 느낌이 부족하다.
- 숫자와 단위가 같은 중앙 overlay 안에서 겹칠 수 있다.
- wheel 높이가 고정되어 화면에서 너무 길게 느껴지고, 사용처별 밀도 조절이 어렵다.

## 결정 사항

- 기본 높이는 176px로 둔다. 행 높이는 36px이며, 기본 상태에서는 5개 후보가 보인다.
- `height` prop을 추가해 132px 수준에서는 3개 후보, 220px 수준에서는 7개 후보처럼 보이게 한다.
- 직접 숫자 입력은 유지한다. 사용자가 0에서 150 같은 큰 값으로 바로 이동할 수 있어야 한다.
- 기존 `NumberWheelPicker` public component는 backward-compatible preset으로 유지한다.
- 내부는 Vercel composition pattern에 맞춰 compound component 구조로 재정리한다.

## Architecture

`NumberWheelPicker`는 기존 call site를 깨지 않도록 같은 이름의 preset component로 남긴다.

내부 구현은 `NumberWheelPicker.Root` provider가 상태와 actions를 소유하고, 하위 UI 조각이 context를 소비하는 구조로 나눈다.

- `Root`: value, min, max, step, height, disabled, editing state, options, selected index, draft input state를 관리한다.
- `Wheel`: scrollable number rows를 렌더링하고 scroll event를 provider action으로 전달한다.
- `SelectionOverlay`: 중앙 selection band와 상하 fade를 렌더링한다.
- `CenterInputTrigger`: 중앙 band의 값 표시와 직접 입력 전환을 담당한다.
- `UnitLabel`: 숫자 row와 input 상태에서 동일한 고정 unit column을 제공한다.

기본 export는 아래 조합을 preset으로 제공한다.

```tsx
<NumberWheelPicker.Root {...props}>
  <NumberWheelPicker.Wheel />
  <NumberWheelPicker.SelectionOverlay />
  <NumberWheelPicker.CenterInputTrigger />
</NumberWheelPicker.Root>
```

향후 사용처가 필요하면 같은 provider 아래에서 input trigger를 wheel 밖으로 빼거나, unit 위치를 바꾸는 식으로 재사용할 수 있다.

## Public API

기존 props는 유지하고 `height?: number`를 추가한다.

```tsx
<NumberWheelPicker
  value={value}
  min={0}
  max={200}
  step={1}
  unitLabel="m"
  height={176}
  onChange={setValue}
/>
```

재사용용 compound API도 같은 module에서 노출한다.

```tsx
<NumberWheelPicker.Root value={value} min={0} max={200} step={1} height={132} onChange={setValue}>
  <NumberWheelPicker.Wheel />
  <NumberWheelPicker.CenterInputTrigger />
</NumberWheelPicker.Root>
```

처음 구현에서는 기존 form call site가 사용하는 preset을 우선 안정화한다. Compound API는 같은 파일 안에서 구성 가능하게 만들되, 불필요한 추가 variant prop은 늘리지 않는다.

## UX And Interaction

Wheel은 iOS picker처럼 중앙 selection band를 기준으로 동작한다. ScrollView의 `onScroll`에서 `contentOffset.y / ITEM_HEIGHT`를 반올림해 focused index를 계산하고, 값이 바뀌면 즉시 display value와 `onChange`에 반영한다. 값 변경은 momentum end를 기다리지 않는다.

`height`는 visual density를 결정한다. 내부 layout은 실제 높이를 기준으로 다음 값을 파생한다.

- `itemHeight`: 36
- `wheelHeight`: `height`를 최소 3개 후보 수준으로 clamp한 값
- `visibleItemCount`: `wheelHeight / itemHeight`에 가장 가까운 홀수 값
- `centerPadding`: `(wheelHeight - itemHeight) / 2`

단위는 숫자 옆의 고정 column에 둔다. 숫자 영역과 단위 영역을 React Native flex row 기준으로 분리해서 `150 m`, `999 bar`처럼 자릿수가 늘어도 겹치지 않게 한다. 직접 입력 상태에서도 unit은 input field 바깥 같은 column에 남긴다.

중앙 band를 탭하면 직접 입력 상태로 전환한다. 입력 commit은 scroll selection과 같은 value pipeline을 사용한다.

1. draft text를 number로 parse한다.
2. parse 실패 또는 빈 값이면 이전 표시값으로 복구한다.
3. min/max로 clamp한다.
4. step에 맞게 snap한다.
5. `onChange`를 호출하고 wheel 위치를 선택값으로 맞춘다.

disabled 상태에서는 scroll과 input trigger를 모두 막는다. editing 상태에서는 wheel scroll이 값을 emit하지 않는다.

## Error Handling And Edge Cases

- `step <= 0`은 안전하게 1로 취급한다.
- `height`가 너무 작으면 최소 3개 후보 높이로 clamp한다.
- `height`가 짝수 개 후보에 가까워도 내부 visible count는 가장 가까운 홀수로 계산한다.
- value가 option 사이에 있으면 가장 가까운 option을 focused value로 사용한다.
- decimal step은 기존 precision 계산과 formatting 규칙을 유지한다.
- 잘못된 직접 입력은 값 변경 없이 이전 표시값으로 되돌린다.

## Testing

기존 `apps/mobile/__tests__/number-wheel-picker.test.tsx`를 확장한다.

- min/max/step 기반 option 렌더링과 기존 preset compatibility를 검증한다.
- `onScroll` 중 focused value와 `onChange`가 즉시 바뀌는지 검증한다.
- `height={132}`, `height={176}`, `height={220}`에서 wheel height, padding, visible count 파생값을 검증한다.
- unit label이 별도 column으로 렌더링되고 중앙 값과 함께 접근성 value에 포함되는지 검증한다.
- 중앙 input trigger로 직접 입력을 열고 `150` 입력 시 parse, clamp, snap, `onChange`가 동작하는지 검증한다.
- 범위 밖 직접 입력은 min/max로 clamp되는지 검증한다.
- disabled 상태에서 scroll과 input trigger가 막히는지 검증한다.

구현 후 최소 verification은 다음 순서로 실행한다.

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx
yarn mobile:typecheck
```

## Out Of Scope

- 새로운 UI library 또는 native picker dependency 추가
- 다이빙 안전 판단, 감압 계산, emergency guidance와 관련된 기능
- manual log form 전체 레이아웃 재설계
- Supabase, watch sync contract, native iOS/watchOS 변경
