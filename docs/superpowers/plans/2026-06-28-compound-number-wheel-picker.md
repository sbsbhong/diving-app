# Compound NumberWheelPicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add iOS-style multi-column number wheels so Logbook duration can pick minutes and seconds, and Logbook/Planning depth can pick integer meters, decimal tenths, and fixed `m` in one shared picker box.

**Architecture:** Extract the reusable wheel math and animated option row presentation from the current single-column `NumberWheelPicker` into a small core module, then keep `NumberWheelPicker` backward-compatible while adding a separate `MultiColumnNumberWheelPicker`. Screen code should use field wrappers (`DurationWheelField`, `DepthWheelField`) so form storage stays in existing seconds/meters values and watch defaults are displayed without becoming dirty manual overrides.

**Tech Stack:** React Native 0.85, React 19, TypeScript, React Hook Form, Zod, Jest, React Test Renderer, existing gluestack UI primitives.

---

## Files

- Create: `apps/mobile/src/components/ui/wheel-picker-core.tsx`
  - Shared layout constants, option generation, clamp/round/format helpers, render-window math, animated option row presentation, and shared selection overlay.
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`
  - Import shared core helpers, re-export existing public constants/helpers, preserve the current single-column API and compound `Root/Wheel/SelectionOverlay/CenterInputTrigger`.
- Create: `apps/mobile/src/components/ui/multi-column-number-wheel-picker.tsx`
  - Multi-column picker with one outer border, one selection band, scrollable numeric columns, fixed label columns, and one direct-input trigger.
- Create: `apps/mobile/src/screens/common/form/compound-number-wheel-fields.tsx`
  - `DurationWheelField`, `DepthWheelField`, and pure split/merge/parse helpers for seconds and meters.
- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
  - Add component and field-wrapper coverage for multi-column duration/depth display, scroll emit, direct input, clamp, and no mount emit.
- Modify: `apps/mobile/src/screens/logbook/log-entry-form-schema.ts`
  - Rename form draft field `durationMinutes` to `durationSeconds`, keep storage model as `DiveLogManualMeasuredValues.durationSeconds`, and preserve watch provenance unless the field is dirty or changed.
- Modify: `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
  - Use `DurationWheelField` for duration and `DepthWheelField` for max depth.
- Modify: `apps/mobile/src/screens/planning/plan-mode-fields.tsx`
  - Use `DepthWheelField` for planned max depth while leaving `plannedDurationMinutes` on `NumericSliderField`.
- Modify: `apps/mobile/src/i18n/resources.ts`
  - Add Logbook `durationSeconds` labels in Korean/English. Leave Planning `plannedDurationMinutes` unchanged.
- Modify: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`
  - Update duration form expectations, direct-input helper calls, watch default/provenance tests, and render test IDs.
- Modify: `apps/mobile/__tests__/planning-screen.test.tsx`
  - Update depth render test IDs and keep planned duration tests on the single-column picker.

## Baseline

- [ ] **Step 1: Confirm branch and dirty worktree**

Run:

```bash
git status --short
git branch --show-current
```

Expected:

```text
main
```

`git status --short` should be empty or contain only unrelated user changes. Do not revert unrelated changes.

- [ ] **Step 2: Run the current focused tests before changing behavior**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx logbook-manual-entry.test.tsx planning-screen.test.tsx --runInBand
```

Expected: all three focused suites pass before this plan starts. If a suite fails before edits, record the failure and only fix it when it is in a file owned by this plan.

## Task 1: Extract Reusable Wheel Core

**Files:**

- Create: `apps/mobile/src/components/ui/wheel-picker-core.tsx`
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`
- Test: `apps/mobile/__tests__/number-wheel-picker.test.tsx`

- [ ] **Step 1: Create the shared core module**

Create `apps/mobile/src/components/ui/wheel-picker-core.tsx` with these exports. Move the matching implementations from `number-wheel-picker.tsx`; keep the behavior and test IDs identical.

```tsx
import React from 'react';
import { Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Box } from './box';
import { Text } from './text';

export const ITEM_HEIGHT = 36;
export const DEFAULT_WHEEL_HEIGHT = 176;
export const OPTION_EMPHASIS_ANIMATION_DURATION_MS = 90;

const MIN_VISIBLE_ITEM_COUNT = 3;
const MIN_WHEEL_HEIGHT = ITEM_HEIGHT * MIN_VISIBLE_ITEM_COUNT;
export const WINDOW_BUFFER_ITEM_COUNT = 6;

export type NumberWheelLayout = {
  wheelHeight: number;
  visibleItemCount: number;
  centerPadding: number;
};

export type WheelRenderWindow = {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
};

export type OptionPresentation = {
  valueClassName: string;
  unitClassName: string;
  scale: number;
  opacity: number;
};

export function getWheelLayout(height = DEFAULT_WHEEL_HEIGHT): NumberWheelLayout {
  const requestedHeight = Number.isFinite(height) ? height : DEFAULT_WHEEL_HEIGHT;
  const wheelHeight = Math.max(MIN_WHEEL_HEIGHT, Math.round(requestedHeight));
  const approximateCount = Math.max(MIN_VISIBLE_ITEM_COUNT, wheelHeight / ITEM_HEIGHT);
  const visibleItemCount = toOddVisibleItemCount(approximateCount);

  return {
    wheelHeight,
    visibleItemCount,
    centerPadding: (wheelHeight - ITEM_HEIGHT) / 2,
  };
}

function toOddVisibleItemCount(value: number): number {
  const count = Math.max(MIN_VISIBLE_ITEM_COUNT, value);
  const floor = Math.floor(count);
  const ceiling = Math.ceil(count);
  const lowerOdd = Math.max(MIN_VISIBLE_ITEM_COUNT, floor % 2 === 1 ? floor : floor - 1);
  const upperOdd = Math.max(MIN_VISIBLE_ITEM_COUNT, ceiling % 2 === 1 ? ceiling : ceiling + 1);

  return count - lowerOdd <= upperOdd - count ? lowerOdd : upperOdd;
}

export function makeNumberOptions(min: number, max: number, step: number): number[] {
  const safeStep = step > 0 ? step : 1;
  const precision = getStepPrecision(safeStep);
  const count = Math.floor((max - min) / safeStep);
  const options: number[] = [];

  for (let index = 0; index <= count; index += 1) {
    options.push(Number((min + safeStep * index).toFixed(precision)));
  }

  const roundedMax = Number(max.toFixed(precision));
  if (!areNumbersEqual(options[options.length - 1] ?? min, roundedMax)) {
    options.push(roundedMax);
  }

  return options;
}

export function keyExtractor(value: number): string {
  return `${value}`;
}

export function getWheelRenderWindow(optionsLength: number, displayIndex: number, visibleItemCount: number): WheelRenderWindow {
  if (optionsLength <= 0) {
    return {
      startIndex: 0,
      endIndex: -1,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
    };
  }

  const radius = Math.ceil(visibleItemCount / 2) + WINDOW_BUFFER_ITEM_COUNT;
  const startIndex = Math.max(0, displayIndex - radius);
  const endIndex = Math.min(optionsLength - 1, displayIndex + radius);

  return {
    startIndex,
    endIndex,
    topSpacerHeight: startIndex * ITEM_HEIGHT,
    bottomSpacerHeight: (optionsLength - endIndex - 1) * ITEM_HEIGHT,
  };
}

export function getOptionPresentation(distanceFromCenter: number): OptionPresentation {
  if (distanceFromCenter === 0) {
    return {
      valueClassName: 'text-xl font-semibold text-foreground',
      unitClassName: 'text-sm font-semibold text-foreground',
      scale: 1,
      opacity: 1,
    };
  }

  if (distanceFromCenter === 1) {
    return {
      valueClassName: 'text-lg font-semibold text-muted-foreground',
      unitClassName: 'text-sm font-semibold text-muted-foreground',
      scale: 1.06,
      opacity: 0.72,
    };
  }

  if (distanceFromCenter === 2) {
    return {
      valueClassName: 'text-base font-medium text-muted-foreground/60',
      unitClassName: 'text-xs font-semibold text-muted-foreground/60',
      scale: 0.98,
      opacity: 0.42,
    };
  }

  return {
    valueClassName: 'text-sm font-medium text-muted-foreground/40',
    unitClassName: 'text-xs font-semibold text-muted-foreground/40',
    scale: 0.94,
    opacity: 0.24,
  };
}

export function getClosestOptionIndex(options: readonly number[], value: number): number {
  if (options.length === 0) {
    return 0;
  }

  let closestIndex = 0;
  let closestDistance = Math.abs(options[0] - value);
  for (let index = 1; index < options.length; index += 1) {
    const distance = Math.abs(options[index] - value);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

export function normalizeDraftValue(value: string, valueType: 'int' | 'float'): string {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  if (valueType === 'int') {
    return normalized.replace(/\./g, '');
  }

  const [wholePart, ...decimalParts] = normalized.split('.');
  if (decimalParts.length === 0) {
    return wholePart;
  }

  return `${wholePart}.${decimalParts.join('')}`;
}

export function parseDraftValue(value: string): number | undefined {
  if (value.trim().length === 0 || value === '.') {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampIndex(value: number, length: number): number {
  return Math.max(0, Math.min(length - 1, value));
}

export function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }

  const precision = getStepPrecision(step);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

export function formatNumber(value: number, step: number): string {
  const precision = getStepPrecision(step);
  return value.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function getStepPrecision(step: number): number {
  const decimalPart = `${step}`.split('.')[1];
  return decimalPart?.length ?? 0;
}

export function areNumbersEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}

export function WheelSelectionOverlay(props: {
  disabled?: boolean;
  layout: NumberWheelLayout;
  testID?: string;
}): React.JSX.Element {
  const shadeClassName = props.disabled ? 'bg-muted/80' : 'bg-card/80';
  const frameClassName = props.disabled ? 'border-y border-border bg-muted/40' : 'border-y border-border bg-muted/30';

  return (
    <>
      <Box pointerEvents="none" style={[coreStyles.topShade, { height: props.layout.centerPadding }]} className={shadeClassName} />
      <Box pointerEvents="none" style={[coreStyles.bottomShade, { height: props.layout.centerPadding }]} className={shadeClassName} />
      <Box
        testID={props.testID}
        pointerEvents="none"
        style={[coreStyles.selectionFrame, { top: props.layout.centerPadding }]}
        className={frameClassName}
      />
    </>
  );
}

export function WheelOptionContent(props: {
  testIDPrefix: string;
  valueText: string;
  unitLabel?: string;
  distanceFromCenter: number;
  hideWhenCentered?: boolean;
  valueColumnStyle?: StyleProp<ViewStyle>;
  unitColumnStyle?: StyleProp<ViewStyle>;
  valueClassName?: string;
  unitClassName?: string;
}): React.JSX.Element {
  const presentation = getOptionPresentation(props.distanceFromCenter);
  const scale = React.useRef(new Animated.Value(presentation.scale)).current;
  const opacity = React.useRef(new Animated.Value(presentation.opacity)).current;
  const hasMountedRef = React.useRef(false);
  const centerHiddenClassName = props.hideWhenCentered && props.distanceFromCenter === 0 ? ' opacity-0' : '';

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: presentation.scale,
        duration: OPTION_EMPHASIS_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: presentation.opacity,
        duration: OPTION_EMPHASIS_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, presentation.opacity, presentation.scale, scale]);

  return (
    <Animated.View
      testID={`${props.testIDPrefix}-content`}
      style={[coreStyles.item, coreStyles.optionContent, { opacity, transform: [{ scale }] }]}
    >
      <Box testID={`${props.testIDPrefix}-value-column`} style={[coreStyles.valueColumn, props.valueColumnStyle]} className="items-end justify-center">
        <Text
          testID={`${props.testIDPrefix}-value`}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className={`${props.valueClassName ?? presentation.valueClassName}${centerHiddenClassName}`}
        >
          {props.valueText}
        </Text>
      </Box>
      <Box testID={`${props.testIDPrefix}-unit-column`} style={[coreStyles.unitColumn, props.unitColumnStyle]} className="items-start justify-center">
        {props.unitLabel ? (
          <Text
            testID={`${props.testIDPrefix}-unit`}
            numberOfLines={1}
            className={`${props.unitClassName ?? presentation.unitClassName}${centerHiddenClassName}`}
          >
            {props.unitLabel}
          </Text>
        ) : null}
      </Box>
    </Animated.View>
  );
}

export const coreStyles = StyleSheet.create({
  bottomShade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  item: {
    height: ITEM_HEIGHT,
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  selectionFrame: {
    height: ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  topShade: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  unitColumn: {
    width: 52,
  },
  valueColumn: {
    flex: 1,
    paddingRight: 6,
  },
});
```

- [ ] **Step 2: Update `number-wheel-picker.tsx` imports and re-exports**

At the top of `apps/mobile/src/components/ui/number-wheel-picker.tsx`, remove `Animated` and `Easing` from the `react-native` import and import the core helpers:

```tsx
import {
  DEFAULT_WHEEL_HEIGHT,
  ITEM_HEIGHT,
  OPTION_EMPHASIS_ANIMATION_DURATION_MS,
  WheelOptionContent,
  WheelSelectionOverlay,
  areNumbersEqual,
  clamp,
  clampIndex,
  coreStyles,
  formatNumber,
  getClosestOptionIndex,
  getStepPrecision,
  getWheelLayout,
  getWheelRenderWindow,
  keyExtractor,
  makeNumberOptions,
  normalizeDraftValue,
  parseDraftValue,
  roundToStep,
  type NumberWheelLayout,
} from './wheel-picker-core';

export {
  DEFAULT_WHEEL_HEIGHT,
  ITEM_HEIGHT,
  OPTION_EMPHASIS_ANIMATION_DURATION_MS,
  getWheelLayout,
};
export type { NumberWheelLayout };
```

Delete the local duplicate declarations for:

```ts
ITEM_HEIGHT
DEFAULT_WHEEL_HEIGHT
OPTION_EMPHASIS_ANIMATION_DURATION_MS
NumberWheelLayout
WheelRenderWindow
OptionPresentation
getWheelLayout
toOddVisibleItemCount
makeNumberOptions
keyExtractor
getWheelRenderWindow
getOptionPresentation
getClosestOptionIndex
normalizeDraftValue
parseDraftValue
clamp
clampIndex
roundToStep
formatNumber
getStepPrecision
areNumbersEqual
```

- [ ] **Step 3: Replace local option and overlay renderers with core components**

In `NumberWheelPickerOption`, replace the animated row body with:

```tsx
function NumberWheelPickerOption({ value, index }: NumberWheelPickerOptionProps): React.JSX.Element {
  const {
    state: { displayIndex, step, testID, unitLabel },
  } = useNumberWheelPicker('NumberWheelPicker.Option');
  const distanceFromCenter = Math.abs(index - displayIndex);
  const formattedValue = formatNumber(value, step);

  return (
    <WheelOptionContent
      testIDPrefix={`${testID}-option-${formattedValue}`}
      valueText={formattedValue}
      unitLabel={unitLabel}
      distanceFromCenter={distanceFromCenter}
      hideWhenCentered
    />
  );
}
```

In `NumberWheelPickerSelectionOverlay`, replace the fragment with:

```tsx
function NumberWheelPickerSelectionOverlay(): React.JSX.Element {
  const {
    state: { disabled, layout },
  } = useNumberWheelPicker('NumberWheelPicker.SelectionOverlay');

  return <WheelSelectionOverlay disabled={disabled} layout={layout} />;
}
```

In the local `styles`, keep only styles that are not supplied by `coreStyles`:

```tsx
const styles = StyleSheet.create({
  centerInputTrigger: {
    height: ITEM_HEIGHT,
    left: 8,
    position: 'absolute',
    right: 8,
  },
  contentContainer: {},
  scroller: {},
  unitColumn: coreStyles.unitColumn,
  valueColumn: coreStyles.valueColumn,
  wheel: {},
});
```

- [ ] **Step 4: Run the existing picker tests after the refactor**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all existing `NumberWheelPicker` tests still pass. The option row test IDs such as `depth-picker-option-150-value` and `depth-picker-option-150-unit` should be unchanged.

- [ ] **Step 5: Commit the core extraction**

Run:

```bash
git add apps/mobile/src/components/ui/wheel-picker-core.tsx apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "refactor: share number wheel core"
```

## Task 2: Add MultiColumnNumberWheelPicker

**Files:**

- Create: `apps/mobile/src/components/ui/multi-column-number-wheel-picker.tsx`
- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`

- [ ] **Step 1: Add RED tests for the multi-column picker shell**

In `apps/mobile/__tests__/number-wheel-picker.test.tsx`, add the import:

```tsx
import { MultiColumnNumberWheelPicker } from '../src/components/ui/multi-column-number-wheel-picker';
```

Add this test inside `describe('NumberWheelPicker', () => { ... })`:

```tsx
it('renders multiple numeric columns in one shared wheel box', async () => {
  const onColumnChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <MultiColumnNumberWheelPicker
        columns={[
          { id: 'minutes', value: 10, min: 0, max: 240, step: 1, unitLabel: 'min' },
          { id: 'seconds', value: 3, min: 0, max: 59, step: 1, unitLabel: 'sec', padStart: 2 },
        ]}
        onColumnChange={onColumnChange}
        directInput={{
          value: '10:03',
          normalize: value => value,
          onCommit: () => false,
          keyboardType: 'numbers-and-punctuation',
        }}
        testID="duration-picker"
      />,
    );
  });
  renderers.push(renderer!);

  expect(renderer!.root.findByProps({ testID: 'duration-picker-wheel' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'duration-picker-selection-frame' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'duration-picker-column-minutes-wheel-list' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'duration-picker-column-seconds-wheel-list' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'duration-picker-minutes-value' }).props.children).toBe('10');
  expect(renderer!.root.findByProps({ testID: 'duration-picker-minutes-unit' }).props.children).toBe('min');
  expect(renderer!.root.findByProps({ testID: 'duration-picker-seconds-value' }).props.children).toBe('03');
  expect(renderer!.root.findByProps({ testID: 'duration-picker-seconds-unit' }).props.children).toBe('sec');
});

it('emits only the changed multi-column value while scrolling', async () => {
  const onColumnChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <MultiColumnNumberWheelPicker
        columns={[
          { id: 'minutes', value: 10, min: 0, max: 240, step: 1, unitLabel: 'min' },
          { id: 'seconds', value: 0, min: 0, max: 59, step: 1, unitLabel: 'sec', padStart: 2 },
        ]}
        onColumnChange={onColumnChange}
        directInput={{
          value: '10:00',
          normalize: value => value,
          onCommit: () => false,
          keyboardType: 'numbers-and-punctuation',
        }}
        testID="duration-picker"
      />,
    );
  });
  renderers.push(renderer!);

  const secondsList = renderer!.root.findByProps({ testID: 'duration-picker-column-seconds-wheel-list' });
  await ReactTestRenderer.act(async () => {
    secondsList.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
  });

  expect(onColumnChange).toHaveBeenCalledWith('seconds', 3);
  expect(renderer!.root.findByProps({ testID: 'duration-picker-seconds-value' }).props.children).toBe('03');
});

it('renders fixed columns in the shared center row without a scroll view', async () => {
  const onColumnChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <MultiColumnNumberWheelPicker
        columns={[
          { id: 'meters', value: 19, min: 0, max: 60, step: 1 },
          { id: 'tenths', value: 6, min: 0, max: 9, step: 1, formatValue: value => `.${value}` },
          { id: 'unit', fixedLabel: 'm' },
        ]}
        onColumnChange={onColumnChange}
        directInput={{
          value: '19.6',
          normalize: value => value,
          onCommit: () => false,
          keyboardType: 'decimal-pad',
        }}
        testID="depth-picker"
      />,
    );
  });
  renderers.push(renderer!);

  expect(renderer!.root.findByProps({ testID: 'depth-picker-meters-value' }).props.children).toBe('19');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-tenths-value' }).props.children).toBe('.6');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-unit-fixed' }).props.children).toBe('m');
  expect(renderer!.root.findAllByProps({ testID: 'depth-picker-column-unit-wheel-list' })).toHaveLength(0);
});
```

- [ ] **Step 2: Run the RED tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: fail because `multi-column-number-wheel-picker.tsx` does not exist.

- [ ] **Step 3: Implement the multi-column picker public API and type guards**

Create `apps/mobile/src/components/ui/multi-column-number-wheel-picker.tsx` with these types and helpers:

```tsx
import React from 'react';
import {
  Keyboard,
  StyleSheet,
  type KeyboardTypeOptions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView as RNScrollView,
} from 'react-native';
import { Box } from './box';
import { HStack } from './hstack';
import { Input, InputField } from './input';
import { Pressable } from './pressable';
import { ScrollView } from './scroll-view';
import { Text } from './text';
import {
  DEFAULT_WHEEL_HEIGHT,
  ITEM_HEIGHT,
  WheelOptionContent,
  WheelSelectionOverlay,
  areNumbersEqual,
  clampIndex,
  coreStyles,
  formatNumber,
  getClosestOptionIndex,
  getWheelLayout,
  getWheelRenderWindow,
  keyExtractor,
  makeNumberOptions,
  type NumberWheelLayout,
} from './wheel-picker-core';

export type MultiColumnNumberWheelScrollableColumn = {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unitLabel?: string;
  padStart?: number;
  formatValue?: (value: number) => string;
  width?: number;
};

export type MultiColumnNumberWheelFixedColumn = {
  id: string;
  fixedLabel: string;
  width?: number;
};

export type MultiColumnNumberWheelColumn =
  | MultiColumnNumberWheelScrollableColumn
  | MultiColumnNumberWheelFixedColumn;

export type MultiColumnNumberWheelDirectInput = {
  value: string;
  normalize: (value: string) => string;
  onCommit: (value: string) => boolean;
  keyboardType?: KeyboardTypeOptions;
  accessibilityLabel?: string;
};

export type MultiColumnNumberWheelPickerProps = {
  columns: MultiColumnNumberWheelColumn[];
  onColumnChange: (columnId: string, value: number) => void;
  directInput: MultiColumnNumberWheelDirectInput;
  height?: number;
  disabled?: boolean;
  testID?: string;
};

function isScrollableColumn(column: MultiColumnNumberWheelColumn): column is MultiColumnNumberWheelScrollableColumn {
  return 'value' in column;
}

function formatColumnValue(column: MultiColumnNumberWheelScrollableColumn, value: number): string {
  const formatted = column.formatValue ? column.formatValue(value) : formatNumber(value, column.step ?? 1);
  return column.padStart === undefined ? formatted : formatted.padStart(column.padStart, '0');
}
```

- [ ] **Step 4: Implement picker state, scroll sync, and direct input**

In the same file, add the component:

```tsx
export function MultiColumnNumberWheelPicker({
  columns,
  onColumnChange,
  directInput,
  height = DEFAULT_WHEEL_HEIGHT,
  disabled = false,
  testID = 'multi-column-number-wheel-picker',
}: MultiColumnNumberWheelPickerProps): React.JSX.Element {
  const layout = React.useMemo(() => getWheelLayout(height), [height]);
  const scrollableColumns = React.useMemo(() => columns.filter(isScrollableColumn), [columns]);
  const [displayIndexes, setDisplayIndexes] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(scrollableColumns.map(column => [column.id, getColumnIndex(column)])),
  );
  const scrollableColumnSignature = scrollableColumns
    .map(column => `${column.id}:${column.value}:${column.min}:${column.max}:${column.step ?? 1}`)
    .join('|');
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(directInput.value);
  const listRefs = React.useRef<Record<string, RNScrollView | null>>({});
  const displayIndexesRef = React.useRef(displayIndexes);
  const lastEmittedValuesRef = React.useRef<Record<string, number>>(
    Object.fromEntries(scrollableColumns.map(column => [column.id, column.value])),
  );
  const interactingColumnsRef = React.useRef<Record<string, boolean>>({});
  const inputRef = React.useRef<React.ComponentRef<typeof InputField>>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(directInput.value);
    }
  }, [directInput.value, isEditing]);

  React.useEffect(() => {
    const nextIndexes = Object.fromEntries(scrollableColumns.map(column => [column.id, getColumnIndex(column)]));
    lastEmittedValuesRef.current = Object.fromEntries(scrollableColumns.map(column => [column.id, column.value]));
    displayIndexesRef.current = nextIndexes;
    setDisplayIndexes(nextIndexes);

    for (const column of scrollableColumns) {
      if (!interactingColumnsRef.current[column.id]) {
        listRefs.current[column.id]?.scrollTo({ y: nextIndexes[column.id] * ITEM_HEIGHT, animated: false });
      }
    }
  }, [scrollableColumnSignature]);

  const setColumnDisplayIndex = React.useCallback((column: MultiColumnNumberWheelScrollableColumn, nextIndex: number, shouldEmit: boolean) => {
    const options = makeNumberOptions(column.min, column.max, column.step ?? 1);
    const clampedIndex = clampIndex(nextIndex, options.length);
    const nextValue = options[clampedIndex];
    if (nextValue === undefined) {
      return;
    }

    if (displayIndexesRef.current[column.id] !== clampedIndex) {
      displayIndexesRef.current = {
        ...displayIndexesRef.current,
        [column.id]: clampedIndex,
      };
      setDisplayIndexes(displayIndexesRef.current);
    }

    if (shouldEmit && !areNumbersEqual(nextValue, lastEmittedValuesRef.current[column.id] ?? column.value)) {
      lastEmittedValuesRef.current = {
        ...lastEmittedValuesRef.current,
        [column.id]: nextValue,
      };
      onColumnChange(column.id, nextValue);
    }
  }, [onColumnChange]);

  const openInput = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setDraftValue(directInput.value);
    setIsEditing(true);
    setTimeout(() => {
      (inputRef.current as unknown as { focus?: () => void } | null)?.focus?.();
    }, 0);
  }, [directInput.value, disabled]);

  const commitDraft = React.useCallback(() => {
    setIsEditing(false);
    Keyboard.dismiss();
    const didCommit = directInput.onCommit(draftValue);
    if (!didCommit) {
      setDraftValue(directInput.value);
    }
  }, [directInput, draftValue]);

  return (
    <Box testID={testID} accessibilityRole="adjustable" accessibilityState={{ disabled }}>
      <Box
        testID={`${testID}-wheel`}
        className={disabled ? 'overflow-hidden rounded-xl border border-border bg-muted' : 'overflow-hidden rounded-xl border border-border bg-card'}
        style={[styles.wheel, { height: layout.wheelHeight }]}
      >
        <HStack className="h-full w-full items-stretch justify-center">
          {columns.map(column =>
            isScrollableColumn(column) ? (
              <MultiColumnWheelColumn
                key={column.id}
                column={column}
                layout={layout}
                disabled={disabled || isEditing}
                displayIndex={displayIndexes[column.id] ?? getColumnIndex(column)}
                setListRef={ref => {
                  listRefs.current[column.id] = ref;
                }}
                onBegin={() => {
                  interactingColumnsRef.current[column.id] = true;
                }}
                onEnd={() => {
                  interactingColumnsRef.current[column.id] = false;
                }}
                onScrollIndex={(nextIndex, shouldEmit) => setColumnDisplayIndex(column, nextIndex, shouldEmit)}
                testID={`${testID}-column-${column.id}`}
              />
            ) : (
              <Box key={column.id} testID={`${testID}-column-${column.id}`} style={[styles.fixedColumn, column.width === undefined ? null : { width: column.width }]} />
            ),
          )}
        </HStack>
        <WheelSelectionOverlay disabled={disabled} layout={layout} testID={`${testID}-selection-frame`} />
        <MultiColumnCenterInputTrigger
          columns={columns}
          disabled={disabled}
          isEditing={isEditing}
          layout={layout}
          draftValue={draftValue}
          directInput={directInput}
          inputRef={inputRef}
          onOpen={openInput}
          onChangeDraft={value => setDraftValue(directInput.normalize(value))}
          onCommit={commitDraft}
          testID={testID}
        />
      </Box>
    </Box>
  );
}

function getColumnIndex(column: MultiColumnNumberWheelScrollableColumn): number {
  return getClosestOptionIndex(makeNumberOptions(column.min, column.max, column.step ?? 1), column.value);
}
```

- [ ] **Step 5: Implement scrollable column and center trigger**

In the same file, add:

```tsx
function MultiColumnWheelColumn(props: {
  column: MultiColumnNumberWheelScrollableColumn;
  layout: NumberWheelLayout;
  disabled: boolean;
  displayIndex: number;
  setListRef: (ref: RNScrollView | null) => void;
  onBegin: () => void;
  onEnd: () => void;
  onScrollIndex: (index: number, shouldEmit: boolean) => void;
  testID: string;
}): React.JSX.Element {
  const step = props.column.step ?? 1;
  const options = React.useMemo(() => makeNumberOptions(props.column.min, props.column.max, step), [props.column.max, props.column.min, step]);
  const renderWindow = React.useMemo(
    () => getWheelRenderWindow(options.length, props.displayIndex, props.layout.visibleItemCount),
    [options.length, props.displayIndex, props.layout.visibleItemCount],
  );
  const visibleOptions = React.useMemo(
    () => options.slice(renderWindow.startIndex, renderWindow.endIndex + 1),
    [options, renderWindow.endIndex, renderWindow.startIndex],
  );

  return (
    <ScrollView
      ref={props.setListRef}
      testID={`${props.testID}-wheel-list`}
      contentOffset={{ x: 0, y: props.displayIndex * ITEM_HEIGHT }}
      onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!props.disabled) {
          props.onScrollIndex(Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT), true);
        }
      }}
      onScrollBeginDrag={props.onBegin}
      onMomentumScrollBegin={props.onBegin}
      onScrollEndDrag={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        props.onScrollIndex(Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT), true);
        if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) {
          props.onEnd();
        }
      }}
      onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        props.onScrollIndex(Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT), true);
        props.onEnd();
      }}
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      scrollEnabled={!props.disabled}
      nestedScrollEnabled
      bounces={false}
      scrollEventThrottle={16}
      style={[styles.scroller, props.column.width === undefined ? null : { width: props.column.width }, { height: props.layout.wheelHeight }]}
      contentContainerStyle={[styles.contentContainer, { paddingVertical: props.layout.centerPadding }]}
    >
      {renderWindow.topSpacerHeight > 0 ? <Box testID={`${props.testID}-top-spacer`} style={{ height: renderWindow.topSpacerHeight }} /> : null}
      {visibleOptions.map((option, offset) => {
        const index = renderWindow.startIndex + offset;
        const valueText = formatColumnValue(props.column, option);

        return (
          <WheelOptionContent
            key={keyExtractor(option)}
            testIDPrefix={`${props.testID}-option-${valueText}`}
            valueText={valueText}
            unitLabel={props.column.unitLabel}
            distanceFromCenter={Math.abs(index - props.displayIndex)}
            hideWhenCentered
          />
        );
      })}
      {renderWindow.bottomSpacerHeight > 0 ? <Box testID={`${props.testID}-bottom-spacer`} style={{ height: renderWindow.bottomSpacerHeight }} /> : null}
    </ScrollView>
  );
}

function MultiColumnCenterInputTrigger(props: {
  columns: MultiColumnNumberWheelColumn[];
  disabled: boolean;
  isEditing: boolean;
  layout: NumberWheelLayout;
  draftValue: string;
  directInput: MultiColumnNumberWheelDirectInput;
  inputRef: React.RefObject<React.ComponentRef<typeof InputField> | null>;
  onOpen: () => void;
  onChangeDraft: (value: string) => void;
  onCommit: () => void;
  testID: string;
}): React.JSX.Element {
  return (
    <Pressable
      testID={`${props.testID}-input-trigger`}
      accessibilityRole="button"
      accessibilityLabel={props.directInput.accessibilityLabel ?? 'Enter number'}
      disabled={props.disabled}
      onPress={props.onOpen}
      style={[styles.centerInputTrigger, { top: props.layout.centerPadding }]}
      className="self-center px-2 data-[active=true]:bg-primary/10"
    >
      {props.isEditing ? (
        <HStack testID={`${props.testID}-center-row`} className="w-full items-center justify-center">
          <Input className="h-10 w-full rounded-none border-0 bg-transparent px-0 shadow-none">
            <InputField
              ref={props.inputRef}
              testID={`${props.testID}-input`}
              value={props.draftValue}
              onChangeText={props.onChangeDraft}
              onSubmitEditing={props.onCommit}
              onBlur={props.onCommit}
              keyboardType={props.directInput.keyboardType ?? 'numbers-and-punctuation'}
              returnKeyType="done"
              selectTextOnFocus
              autoFocus
              editable={!props.disabled}
              className="text-center text-2xl font-semibold text-foreground"
            />
          </Input>
        </HStack>
      ) : (
        <HStack testID={`${props.testID}-center-row`} className="w-full items-baseline justify-center">
          {props.columns.map(column =>
            isScrollableColumn(column) ? (
              <CenterScrollableColumn key={column.id} column={column} testID={props.testID} />
            ) : (
              <Box key={column.id} style={[styles.fixedCenterColumn, column.width === undefined ? null : { width: column.width }]} className="items-start justify-center">
                <Text testID={`${props.testID}-${column.id}-fixed`} className="text-sm font-semibold text-foreground">
                  {column.fixedLabel}
                </Text>
              </Box>
            ),
          )}
        </HStack>
      )}
    </Pressable>
  );
}

function CenterScrollableColumn(props: {
  column: MultiColumnNumberWheelScrollableColumn;
  testID: string;
}): React.JSX.Element {
  return (
    <HStack
      testID={`${props.testID}-${props.column.id}-center-column`}
      style={props.column.width === undefined ? styles.centerColumn : [styles.centerColumn, { width: props.column.width }]}
      className="items-baseline justify-center"
    >
      <Text
        testID={`${props.testID}-${props.column.id}-value`}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        className="text-2xl font-semibold text-foreground"
      >
        {formatColumnValue(props.column, props.column.value)}
      </Text>
      {props.column.unitLabel ? (
        <Text testID={`${props.testID}-${props.column.id}-unit`} className="ml-1 text-sm font-semibold text-foreground">
          {props.column.unitLabel}
        </Text>
      ) : null}
    </HStack>
  );
}

const styles = StyleSheet.create({
  centerColumn: {
    minWidth: 84,
  },
  centerInputTrigger: {
    height: ITEM_HEIGHT,
    left: 8,
    position: 'absolute',
    right: 8,
  },
  contentContainer: {},
  fixedCenterColumn: {
    minWidth: 28,
  },
  fixedColumn: {
    minWidth: 28,
  },
  scroller: {
    flex: 1,
  },
  wheel: {},
});
```

- [ ] **Step 6: Run the multi-column picker tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all existing and new picker tests pass.

- [ ] **Step 7: Commit the multi-column primitive**

Run:

```bash
git add apps/mobile/src/components/ui/multi-column-number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "feat: add multi-column number wheel"
```

## Task 3: Add Duration And Depth Field Wrappers

**Files:**

- Create: `apps/mobile/src/screens/common/form/compound-number-wheel-fields.tsx`
- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`

- [ ] **Step 1: Add RED tests for duration and depth wrappers**

In `apps/mobile/__tests__/number-wheel-picker.test.tsx`, add:

```tsx
import { DepthWheelField, DurationWheelField } from '../src/screens/common/form/compound-number-wheel-fields';
```

Add these tests:

```tsx
it('renders duration seconds as minute and second columns without emitting on mount', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <DurationWheelField
        label="Duration"
        valueSeconds={602}
        maxSeconds={240 * 60}
        onChange={onChange}
        testID="duration-picker"
      />,
    );
  });
  renderers.push(renderer!);

  expect(renderer!.root.findByProps({ testID: 'duration-picker-minutes-value' }).props.children).toBe('10');
  expect(renderer!.root.findByProps({ testID: 'duration-picker-seconds-value' }).props.children).toBe('02');
  expect(onChange).not.toHaveBeenCalled();
});

it('emits composed seconds when the duration seconds column changes', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <DurationWheelField
        label="Duration"
        valueSeconds={600}
        maxSeconds={240 * 60}
        onChange={onChange}
        testID="duration-picker"
      />,
    );
  });
  renderers.push(renderer!);

  const secondsList = renderer!.root.findByProps({ testID: 'duration-picker-column-seconds-wheel-list' });
  await ReactTestRenderer.act(async () => {
    secondsList.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
  });

  expect(onChange).toHaveBeenCalledWith(603);
});

it('commits duration direct input in colon, unit, and seconds forms', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <DurationWheelField
        label="Duration"
        valueSeconds={0}
        maxSeconds={240 * 60}
        onChange={onChange}
        testID="duration-picker"
      />,
    );
  });
  renderers.push(renderer!);

  const root = renderer!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'duration-picker-input-trigger' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'duration-picker-input' }).find(match => typeof match.props.onChangeText === 'function')!.props.onChangeText('10:03');
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'duration-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function')!.props.onSubmitEditing();
  });
  expect(onChange).toHaveBeenLastCalledWith(603);

  await ReactTestRenderer.act(async () => {
    renderer!.update(
      <DurationWheelField
        label="Duration"
        valueSeconds={0}
        maxSeconds={240 * 60}
        onChange={onChange}
        testID="duration-picker"
      />,
    );
  });
  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'duration-picker-input-trigger' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'duration-picker-input' }).find(match => typeof match.props.onChangeText === 'function')!.props.onChangeText('10m03s');
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'duration-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function')!.props.onSubmitEditing();
  });
  expect(onChange).toHaveBeenLastCalledWith(603);

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'duration-picker-input-trigger' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'duration-picker-input' }).find(match => typeof match.props.onChangeText === 'function')!.props.onChangeText('603');
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'duration-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function')!.props.onSubmitEditing();
  });
  expect(onChange).toHaveBeenLastCalledWith(603);
});

it('renders depth meters as integer, decimal, and fixed meter columns', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <DepthWheelField
        label="Max depth"
        valueMeters={18.6}
        maxMeters={60}
        onChange={onChange}
        testID="depth-picker"
      />,
    );
  });
  renderers.push(renderer!);

  expect(renderer!.root.findByProps({ testID: 'depth-picker-meters-value' }).props.children).toBe('18');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-tenths-value' }).props.children).toBe('.6');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-unit-fixed' }).props.children).toBe('m');
  expect(onChange).not.toHaveBeenCalled();
});

it('commits depth direct input and clamps to max tenth precision', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <DepthWheelField
        label="Max depth"
        valueMeters={0}
        maxMeters={60}
        onChange={onChange}
        testID="depth-picker"
      />,
    );
  });
  renderers.push(renderer!);

  const root = renderer!.root;
  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onChangeText === 'function')!.props.onChangeText('19.6');
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function')!.props.onSubmitEditing();
  });

  expect(onChange).toHaveBeenLastCalledWith(19.6);

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onChangeText === 'function')!.props.onChangeText('99.9');
  });
  await ReactTestRenderer.act(async () => {
    root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function')!.props.onSubmitEditing();
  });

  expect(onChange).toHaveBeenLastCalledWith(60);
});

it('keeps undefined compound values visual only until the user changes them', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <DepthWheelField
        label="Max depth"
        valueMeters={undefined}
        maxMeters={60}
        onChange={onChange}
        testID="depth-picker"
      />,
    );
  });
  renderers.push(renderer!);

  expect(renderer!.root.findByProps({ testID: 'depth-picker-meters-value' }).props.children).toBe('0');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-tenths-value' }).props.children).toBe('.0');
  expect(onChange).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the RED tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: fail because `compound-number-wheel-fields.tsx` does not exist.

- [ ] **Step 3: Implement duration/depth split, merge, parse helpers**

Create `apps/mobile/src/screens/common/form/compound-number-wheel-fields.tsx` with these helpers:

```tsx
import React from 'react';
import { MultiColumnNumberWheelPicker } from '../../../components/ui/multi-column-number-wheel-picker';
import { EditorField } from './editor-field';

type CompoundFieldBaseProps = {
  label: string;
  required?: boolean;
  error?: string;
  testID: string;
  className?: string;
  disabled?: boolean;
  pickerHeight?: number;
};

export type DurationWheelFieldProps = CompoundFieldBaseProps & {
  valueSeconds?: number;
  maxSeconds: number;
  onChange: (value: number | undefined) => void;
};

export type DepthWheelFieldProps = CompoundFieldBaseProps & {
  valueMeters?: number;
  maxMeters: number;
  onChange: (value: number | undefined) => void;
};

export function splitDurationSeconds(valueSeconds: number | undefined, maxSeconds: number): { minutes: number; seconds: number } {
  const normalized = clampInteger(valueSeconds ?? 0, 0, maxSeconds);
  return {
    minutes: Math.floor(normalized / 60),
    seconds: normalized % 60,
  };
}

export function mergeDurationParts(minutes: number, seconds: number, maxSeconds: number): number {
  return clampInteger(minutes * 60 + seconds, 0, maxSeconds);
}

export function parseDurationDraft(value: string, maxSeconds: number): number | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed.length) {
    return undefined;
  }

  const colonMatch = /^(\d+)\s*:\s*(\d{1,2})$/.exec(trimmed);
  if (colonMatch) {
    const minutes = Number(colonMatch[1]);
    const seconds = Number(colonMatch[2]);
    return seconds > 59 ? undefined : mergeDurationParts(minutes, seconds, maxSeconds);
  }

  const compact = trimmed.replace(/\s+/g, '');
  const unitMatch = /^(\d+)(?:m|min)(?:(\d{1,2})(?:s|sec))?$/.exec(compact);
  if (unitMatch) {
    const minutes = Number(unitMatch[1]);
    const seconds = unitMatch[2] === undefined ? 0 : Number(unitMatch[2]);
    return seconds > 59 ? undefined : mergeDurationParts(minutes, seconds, maxSeconds);
  }

  const secondsMatch = /^\d+$/.exec(compact);
  if (secondsMatch) {
    return clampInteger(Number(compact), 0, maxSeconds);
  }

  return undefined;
}

export function normalizeDurationDraft(value: string): string {
  return value.replace(',', ':').replace(/[^\d:msinec\s]/gi, '');
}

export function formatDurationDraft(valueSeconds: number | undefined, maxSeconds: number): string {
  const { minutes, seconds } = splitDurationSeconds(valueSeconds, maxSeconds);
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
}

export function splitDepthMeters(valueMeters: number | undefined, maxMeters: number): { meters: number; tenths: number } {
  const normalizedTenths = Math.round(clampNumber(valueMeters ?? 0, 0, maxMeters) * 10);
  return {
    meters: Math.floor(normalizedTenths / 10),
    tenths: normalizedTenths % 10,
  };
}

export function mergeDepthParts(meters: number, tenths: number, maxMeters: number): number {
  return Number(clampNumber(meters + tenths / 10, 0, maxMeters).toFixed(1));
}

export function parseDepthDraft(value: string, maxMeters: number): number | undefined {
  const normalized = value.trim().replace(',', '.').replace(/[^\d.]/g, '');
  if (!normalized.length || normalized === '.') {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Number(clampNumber(Math.round(parsed * 10) / 10, 0, maxMeters).toFixed(1));
}

export function normalizeDepthDraft(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [wholePart, ...decimalParts] = normalized.split('.');
  return decimalParts.length === 0 ? wholePart : `${wholePart}.${decimalParts.join('').slice(0, 1)}`;
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

- [ ] **Step 4: Implement the duration wrapper**

In the same file, below the helpers, add:

```tsx
export function DurationWheelField(props: DurationWheelFieldProps): React.JSX.Element {
  const { minutes, seconds } = splitDurationSeconds(props.valueSeconds, props.maxSeconds);
  const maxMinutes = Math.floor(props.maxSeconds / 60);
  const maxSecondsForMinute = minutes >= maxMinutes ? props.maxSeconds % 60 : 59;

  const commit = React.useCallback(
    (draft: string) => {
      const parsedValue = parseDurationDraft(draft, props.maxSeconds);
      if (parsedValue === undefined) {
        return false;
      }

      props.onChange(parsedValue);
      return true;
    },
    [props],
  );

  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.testID}-error`}
      className={props.className}
    >
      <MultiColumnNumberWheelPicker
        columns={[
          { id: 'minutes', value: minutes, min: 0, max: maxMinutes, step: 1, unitLabel: 'min' },
          { id: 'seconds', value: Math.min(seconds, maxSecondsForMinute), min: 0, max: maxSecondsForMinute, step: 1, unitLabel: 'sec', padStart: 2 },
        ]}
        onColumnChange={(columnId, value) => {
          if (columnId === 'minutes') {
            const nextMaxSeconds = value >= maxMinutes ? props.maxSeconds % 60 : 59;
            props.onChange(mergeDurationParts(value, Math.min(seconds, nextMaxSeconds), props.maxSeconds));
            return;
          }

          props.onChange(mergeDurationParts(minutes, value, props.maxSeconds));
        }}
        directInput={{
          value: formatDurationDraft(props.valueSeconds, props.maxSeconds),
          normalize: normalizeDurationDraft,
          onCommit: commit,
          keyboardType: 'numbers-and-punctuation',
          accessibilityLabel: 'Enter duration',
        }}
        height={props.pickerHeight}
        disabled={props.disabled}
        testID={props.testID}
      />
    </EditorField>
  );
}
```

- [ ] **Step 5: Implement the depth wrapper**

In the same file, add:

```tsx
export function DepthWheelField(props: DepthWheelFieldProps): React.JSX.Element {
  const { meters, tenths } = splitDepthMeters(props.valueMeters, props.maxMeters);
  const maxMetersInteger = Math.floor(props.maxMeters);
  const maxTenthsForMeter = meters >= maxMetersInteger ? Math.round((props.maxMeters - maxMetersInteger) * 10) : 9;

  const commit = React.useCallback(
    (draft: string) => {
      const parsedValue = parseDepthDraft(draft, props.maxMeters);
      if (parsedValue === undefined) {
        return false;
      }

      props.onChange(parsedValue);
      return true;
    },
    [props],
  );

  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.testID}-error`}
      className={props.className}
    >
      <MultiColumnNumberWheelPicker
        columns={[
          { id: 'meters', value: meters, min: 0, max: maxMetersInteger, step: 1, width: 84 },
          {
            id: 'tenths',
            value: Math.min(tenths, maxTenthsForMeter),
            min: 0,
            max: maxTenthsForMeter,
            step: 1,
            width: 64,
            formatValue: value => `.${value}`,
          },
          { id: 'unit', fixedLabel: 'm', width: 28 },
        ]}
        onColumnChange={(columnId, value) => {
          if (columnId === 'meters') {
            const nextMaxTenths = value >= maxMetersInteger ? Math.round((props.maxMeters - maxMetersInteger) * 10) : 9;
            props.onChange(mergeDepthParts(value, Math.min(tenths, nextMaxTenths), props.maxMeters));
            return;
          }

          props.onChange(mergeDepthParts(meters, value, props.maxMeters));
        }}
        directInput={{
          value: props.valueMeters === undefined ? '0.0' : props.valueMeters.toFixed(1),
          normalize: normalizeDepthDraft,
          onCommit: commit,
          keyboardType: 'decimal-pad',
          accessibilityLabel: 'Enter depth',
        }}
        height={props.pickerHeight}
        disabled={props.disabled}
        testID={props.testID}
      />
    </EditorField>
  );
}
```

- [ ] **Step 6: Run wrapper tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all picker and wrapper tests pass.

- [ ] **Step 7: Commit field wrappers**

Run:

```bash
git add apps/mobile/src/screens/common/form/compound-number-wheel-fields.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "feat: add duration and depth wheel fields"
```

## Task 4: Wire Logbook Duration Seconds And Depth Columns

**Files:**

- Modify: `apps/mobile/src/screens/logbook/log-entry-form-schema.ts`
- Modify: `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
- Modify: `apps/mobile/src/i18n/resources.ts`
- Modify: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`

- [ ] **Step 1: Add RED tests for Logbook compound fields and watch defaults**

In `apps/mobile/__tests__/logbook-manual-entry.test.tsx`, add this fixture near `watchEntry`:

```ts
const secondPreciseWatchEntry = watchSessionToDiveLogEntry({
  now: 1781353000,
  session: {
    localSessionId: 'watch-entry-second-precise',
    schemaVersion: 1,
    siteName: 'Second Precise Reef',
    syncStatus: 'pending',
    startedAt: 1781352000,
    endedAt: 1781352602,
    maxDepthMeters: 18.6,
    averageDepthMeters: 8,
    diveMode: 'freedive',
    samples: [],
  } satisfies WatchSession,
});
```

Update the existing “manual editor renders date time as a row trigger and numeric values as wheel pickers” assertions:

```tsx
expect(root.findByProps({ testID: 'log-entry-editor-duration-column-minutes-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'log-entry-editor-duration-column-seconds-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'log-entry-editor-max-depth-column-meters-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'log-entry-editor-max-depth-column-tenths-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'log-entry-editor-max-depth-unit-fixed' }).props.children).toBe('m');
```

Replace the old single-column assertions for `log-entry-editor-duration-wheel-list` and `log-entry-editor-max-depth-wheel-list`.

Add this test:

```tsx
test('renders watch duration seconds and depth tenths without dirtying untouched watch metrics', async () => {
  const repository = new LocalDiveLogRepository([secondPreciseWatchEntry]);
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-list-item-Second Precise Reef');
  await press(root, 'log-entry-detail-edit');

  expect(root.findByProps({ testID: 'log-entry-editor-duration-minutes-value' }).props.children).toBe('10');
  expect(root.findByProps({ testID: 'log-entry-editor-duration-seconds-value' }).props.children).toBe('02');
  expect(root.findByProps({ testID: 'log-entry-editor-max-depth-meters-value' }).props.children).toBe('18');
  expect(root.findByProps({ testID: 'log-entry-editor-max-depth-tenths-value' }).props.children).toBe('.6');

  await changeText(root, 'log-entry-editor-site-name', 'Reviewed Precise Reef');
  await press(root, 'log-entry-editor-save');

  const [savedEntry] = await repository.list();
  expect(savedEntry.manual.measuredValues.durationSeconds).toBeUndefined();
  expect(savedEntry.manual.measuredValues.maxDepthMeters).toBeUndefined();
  expect(savedEntry.provenance.durationSeconds).toBe('watch');
  expect(savedEntry.provenance.maxDepthMeters).toBe('watch');
});

test('saves edited watch duration seconds as a manual override without changing untouched depth', async () => {
  const repository = new LocalDiveLogRepository([secondPreciseWatchEntry]);
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-list-item-Second Precise Reef');
  await press(root, 'log-entry-detail-edit');
  await changeTextInput(root, 'log-entry-editor-duration', '11:03');
  await press(root, 'log-entry-editor-save');

  const [savedEntry] = await repository.list();
  expect(savedEntry.manual.measuredValues.durationSeconds).toBe(663);
  expect(savedEntry.manual.measuredValues.maxDepthMeters).toBeUndefined();
  expect(savedEntry.provenance.durationSeconds).toBe('manual');
  expect(savedEntry.provenance.maxDepthMeters).toBe('watch');
});
```

Add this helper next to `changeNumber`:

```ts
const changeTextInput = async (root: ReactTestRenderer.ReactTestInstance, testID: string, value: string) => {
  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: `${testID}-input-trigger` }).props.onPress();
  });

  await ReactTestRenderer.act(async () => {
    const input = root.findAllByProps({ testID: `${testID}-input` }).find(match => typeof match.props.onChangeText === 'function');
    input!.props.onChangeText(value);
  });

  await ReactTestRenderer.act(async () => {
    const input = root.findAllByProps({ testID: `${testID}-input` }).find(match => typeof match.props.onSubmitEditing === 'function');
    input!.props.onSubmitEditing();
  });
};
```

- [ ] **Step 2: Update Logbook test helpers and expected schema keys**

In `fillManualDraft`, change the default duration input:

```ts
const values = {
  'log-entry-editor-site-name': 'Blue Corner',
  'log-entry-editor-duration': '47:00',
  'log-entry-editor-max-depth': '18.6',
  'log-entry-editor-buddies-input': 'Mina, Alex,',
  'log-entry-editor-tags-input': 'reef, training,',
  'log-entry-editor-marine-life-input': 'turtle, nudibranch,',
  'log-entry-editor-notes': 'Calm review dive with clear water.',
  ...overrides,
};
```

Change the loop branch so duration uses text input, while depth and other numeric fields keep numeric input:

```ts
if (testID === 'log-entry-editor-duration') {
  await changeTextInput(root, testID, value);
  continue;
}

if (numericTestIDs.has(testID) && value.trim().length > 0 && Number.isFinite(Number(value)) && Number(value) >= 0) {
  await changeNumber(root, testID, Number(value));
  continue;
}
```

Update direct calls that set duration minutes:

```ts
await changeTextInput(root, 'log-entry-editor-duration', '47:00');
await changeTextInput(root, 'log-entry-editor-duration', '41:00');
```

Update schema invalid test input:

```ts
const result = logEntryFormSchema.safeParse({
  startedAt: new Date('2026-06-20T09:30:00'),
  diveMode: 'freedive',
  siteName: 'Invalid Metrics Reef',
  durationSeconds: -5,
  maxDepthMeters: -18,
  gearIds: [],
  buddies: [],
  tags: [],
  observedMarineLife: [],
  pressure: { unit: 'bar' },
});
```

Update expected error keys and copy:

```ts
expect(result.error.flatten().fieldErrors.durationSeconds).toContain('시간은 0 이상이어야 합니다.');
```

Update required field error expectations:

```tsx
expect(root.findByProps({ testID: 'log-entry-editor-duration-error' }).props.children).toBe('시간을 선택해주세요.');
```

Update the existing watch-backed edit display expectations:

```tsx
expect(root.findByProps({ testID: 'log-entry-editor-duration-minutes-value' }).props.children).toBe('10');
expect(root.findByProps({ testID: 'log-entry-editor-duration-seconds-value' }).props.children).toBe('00');
expect(root.findByProps({ testID: 'log-entry-editor-max-depth-meters-value' }).props.children).toBe('12');
expect(root.findByProps({ testID: 'log-entry-editor-max-depth-tenths-value' }).props.children).toBe('.0');
```

- [ ] **Step 3: Run the RED Logbook tests**

Run:

```bash
yarn workspace @repo/mobile test -- logbook-manual-entry.test.tsx --runInBand
```

Expected: fail because `LogEntryFormValues.durationSeconds`, new i18n key, and compound field wiring do not exist.

- [ ] **Step 4: Change Logbook form schema to seconds**

In `apps/mobile/src/screens/logbook/log-entry-form-schema.ts`, change the type:

```ts
export type LogEntryFormValues = {
  startedAt: Date | undefined;
  diveMode: NonNullable<WatchSession['diveMode']>;
  entryStyle?: DiveEntryStyle;
  siteName: string;
  durationSeconds: number | undefined;
  maxDepthMeters: number | undefined;
  gasLabel?: 'Air';
  gearIds: string[];
  waterCondition?: WatchSession['waterCondition'];
  visibilityRating?: number;
  perceivedExertion?: number;
  repetitionCount?: number;
  trainingFocus?: string;
  buddies: string[];
  tags: string[];
  observedMarineLife: string[];
  notes?: string;
  rating?: number;
  pressure: DivePressureValues;
};
```

Change the schema field:

```ts
durationSeconds: requiredNumber(makeNumberMessages('시간', '선택'), 240 * 60),
```

Change `entryToLogEntryFormValues`:

```ts
durationSeconds: getEditorNumber(entry, 'durationSeconds'),
```

Change `logEntryFormValuesToEntry` duration application:

```ts
applyEditableNumberValue(entry, measuredValues, provenance, {
  field: 'durationSeconds',
  draftKey: 'durationSeconds',
  value: values.durationSeconds,
  dirtyFields,
  visible: true,
});
```

Delete `minutesToSeconds` and `secondsToMinutesNumber` at the bottom of the file.

- [ ] **Step 5: Wire `DurationWheelField` and `DepthWheelField` in the editor**

In `apps/mobile/src/screens/logbook/log-entry-editor.tsx`, replace the import:

```tsx
import { DepthWheelField, DurationWheelField } from '../common/form/compound-number-wheel-fields';
```

Keep `NumericSliderField` imported for mode-specific fields in `log-entry-mode-fields.tsx`; it is no longer needed in `log-entry-editor.tsx`.

Replace the duration controller:

```tsx
<Controller
  control={form.control}
  name="durationSeconds"
  render={({ field }) => (
    <DurationWheelField
      className="flex-1"
      label={t('logbook.durationSeconds', { defaultValue: 'Duration' })}
      valueSeconds={field.value}
      onChange={field.onChange}
      maxSeconds={240 * 60}
      required
      error={errors.durationSeconds?.message}
      testID="log-entry-editor-duration"
    />
  )}
/>
```

Replace the max-depth controller:

```tsx
<Controller
  control={form.control}
  name="maxDepthMeters"
  render={({ field }) => (
    <DepthWheelField
      className="flex-1"
      label={t('logbook.maxDepthMeters')}
      valueMeters={field.value}
      onChange={field.onChange}
      maxMeters={60}
      required
      error={errors.maxDepthMeters?.message}
      testID="log-entry-editor-max-depth"
    />
  )}
/>
```

Update `getFirstLogEntryErrorField`:

```ts
const fieldOrder: Array<keyof LogEntryFormValues> = [
  'startedAt',
  'diveMode',
  'siteName',
  'durationSeconds',
  'maxDepthMeters',
  'gearIds',
  'waterCondition',
  'visibilityRating',
  'perceivedExertion',
  'pressure',
  'repetitionCount',
  'trainingFocus',
  'buddies',
  'tags',
  'observedMarineLife',
  'notes',
  'rating',
];
```

- [ ] **Step 6: Add Logbook duration translation keys**

In `apps/mobile/src/i18n/resources.ts`, add Korean key near `durationMinutes`:

```ts
durationSeconds: '시간',
durationMinutes: '시간(분)',
```

Add English key near `durationMinutes`:

```ts
durationSeconds: 'Duration',
durationMinutes: 'Duration (min)',
```

- [ ] **Step 7: Run Logbook tests**

Run:

```bash
yarn workspace @repo/mobile test -- logbook-manual-entry.test.tsx --runInBand
```

Expected: Logbook manual entry tests pass. If TypeScript reports remaining `durationMinutes` references in Logbook form files, replace them with `durationSeconds`; do not change Planning fields.

- [ ] **Step 8: Commit Logbook wiring**

Run:

```bash
git add apps/mobile/src/screens/logbook/log-entry-form-schema.ts apps/mobile/src/screens/logbook/log-entry-editor.tsx apps/mobile/src/i18n/resources.ts apps/mobile/__tests__/logbook-manual-entry.test.tsx
git commit -m "feat: use compound wheels in logbook metrics"
```

## Task 5: Wire Planning Depth Only

**Files:**

- Modify: `apps/mobile/src/screens/planning/plan-mode-fields.tsx`
- Modify: `apps/mobile/__tests__/planning-screen.test.tsx`

- [ ] **Step 1: Add RED planning render assertions**

In `apps/mobile/__tests__/planning-screen.test.tsx`, update “renders date time as a row trigger and numeric values as wheel pickers”:

```tsx
expect(root.findByProps({ testID: 'planning-editor-planned-duration-wheel' })).toBeTruthy();
expect(root.findByProps({ testID: 'planning-editor-planned-duration-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'planning-editor-planned-max-depth-column-meters-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'planning-editor-planned-max-depth-column-tenths-wheel-list' })).toBeTruthy();
expect(root.findByProps({ testID: 'planning-editor-planned-max-depth-unit-fixed' }).props.children).toBe('m');
```

Add this test:

```tsx
it('keeps planned duration single-column while planned depth uses split meter columns', async () => {
  const renderer = await renderPlanning(
    new LocalDivePlanRepository([
      plan({
        localId: 'plan-depth-split',
        status: 'draft',
        site: { name: 'Split Depth Reef' },
        plannedValues: {
          plannedMaxDepthMeters: 19.6,
          plannedDurationMinutes: 45,
        },
      }),
    ]),
  );
  const root = renderer.root;

  await press(root, 'planning-plan-row-Split Depth Reef');
  await press(root, 'planning-detail-edit');

  expect(root.findByProps({ testID: 'planning-editor-planned-duration-value' }).props.children).toBe('45');
  expect(root.findByProps({ testID: 'planning-editor-planned-max-depth-meters-value' }).props.children).toBe('19');
  expect(root.findByProps({ testID: 'planning-editor-planned-max-depth-tenths-value' }).props.children).toBe('.6');
});
```

- [ ] **Step 2: Run the RED planning tests**

Run:

```bash
yarn workspace @repo/mobile test -- planning-screen.test.tsx --runInBand
```

Expected: fail because planned max depth still uses the single-column picker.

- [ ] **Step 3: Replace planned max depth with `DepthWheelField`**

In `apps/mobile/src/screens/planning/plan-mode-fields.tsx`, add the import:

```tsx
import { DepthWheelField } from '../common/form/compound-number-wheel-fields';
```

Replace only the `plannedMaxDepthMeters` controller render body:

```tsx
<DepthWheelField
  className="flex-1"
  label={t('planning.plannedMaxDepthMeters', { defaultValue: 'Planned max (m)' })}
  valueMeters={field.value}
  onChange={field.onChange}
  maxMeters={60}
  required
  error={props.errors.plannedMaxDepthMeters?.message}
  testID="planning-editor-planned-max-depth"
/>
```

Leave the `plannedDurationMinutes` controller exactly on `NumericSliderField`:

```tsx
<NumericSliderField
  className="flex-1"
  label={t('planning.plannedDurationMinutes', { defaultValue: 'Planned duration (min)' })}
  value={field.value}
  onChange={field.onChange}
  min={0}
  max={240}
  step={1}
  unitLabel="min"
  valueType="int"
  required
  error={props.errors.plannedDurationMinutes?.message}
  testID="planning-editor-planned-duration"
  placeholder="45"
/>
```

- [ ] **Step 4: Run planning tests**

Run:

```bash
yarn workspace @repo/mobile test -- planning-screen.test.tsx --runInBand
```

Expected: planning tests pass, with planned duration still using `planning-editor-planned-duration-wheel-list`.

- [ ] **Step 5: Commit Planning wiring**

Run:

```bash
git add apps/mobile/src/screens/planning/plan-mode-fields.tsx apps/mobile/__tests__/planning-screen.test.tsx
git commit -m "feat: split planned depth wheel columns"
```

## Task 6: Final Verification And Cleanup

**Files:**

- Review only unless verification exposes an owned-file defect.

- [ ] **Step 1: Search for stale Logbook duration form keys**

Run:

```bash
rg -n "durationMinutes" apps/mobile/src/screens/logbook apps/mobile/__tests__/logbook-manual-entry.test.tsx
```

Expected: no matches in Logbook form/editor/test files. Matches in `apps/mobile/src/i18n/resources.ts`, Planning files, details, or list metric code are allowed only when they describe existing minute labels or non-form concepts.

- [ ] **Step 2: Run all focused tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx logbook-manual-entry.test.tsx planning-screen.test.tsx --runInBand
```

Expected: all focused tests pass.

- [ ] **Step 3: Run TypeScript verification**

Run:

```bash
yarn mobile:typecheck
```

Expected: typecheck passes.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff -- apps/mobile/src/components/ui/wheel-picker-core.tsx apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/src/components/ui/multi-column-number-wheel-picker.tsx apps/mobile/src/screens/common/form/compound-number-wheel-fields.tsx apps/mobile/src/screens/logbook/log-entry-form-schema.ts apps/mobile/src/screens/logbook/log-entry-editor.tsx apps/mobile/src/screens/planning/plan-mode-fields.tsx apps/mobile/src/i18n/resources.ts apps/mobile/__tests__/number-wheel-picker.test.tsx apps/mobile/__tests__/logbook-manual-entry.test.tsx apps/mobile/__tests__/planning-screen.test.tsx
```

Expected: diff is limited to the files in this plan. No generated contract files, native project files, or watchOS files should change.

- [ ] **Step 5: Commit final fixes if Step 2 or Step 3 required cleanup**

If cleanup edits were needed, run:

```bash
git add apps/mobile/src/components/ui/wheel-picker-core.tsx apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/src/components/ui/multi-column-number-wheel-picker.tsx apps/mobile/src/screens/common/form/compound-number-wheel-fields.tsx apps/mobile/src/screens/logbook/log-entry-form-schema.ts apps/mobile/src/screens/logbook/log-entry-editor.tsx apps/mobile/src/screens/planning/plan-mode-fields.tsx apps/mobile/src/i18n/resources.ts apps/mobile/__tests__/number-wheel-picker.test.tsx apps/mobile/__tests__/logbook-manual-entry.test.tsx apps/mobile/__tests__/planning-screen.test.tsx
git commit -m "fix: polish compound wheel integration"
```

Expected: commit is created only if verification required additional edits. If no cleanup edits were needed, skip this commit.

## Self-Review

- Spec coverage:
  - Logbook duration minute/second picker: Task 3 creates `DurationWheelField`; Task 4 wires it to `durationSeconds`.
  - Planning duration remains minute picker: Task 5 explicitly leaves `plannedDurationMinutes` on `NumericSliderField`.
  - Logbook and Planning depth integer/decimal/fixed unit picker: Task 3 creates `DepthWheelField`; Tasks 4 and 5 wire it.
  - Shared outer border, shared selection band, height: Task 2 `MultiColumnNumberWheelPicker` owns one `wheel` and `WheelSelectionOverlay`.
  - Watch defaults and provenance: Task 4 adds tests for `602 -> 10/02`, `18.6 -> 18/.6`, untouched watch fallback, and touched manual override.
  - Direct input: Task 3 tests and implements `10:03`, `10m03s`, `603`, and `19.6`.
  - Max clamp: Task 3 clamps duration/depth and tests depth max; duration max is enforced by `maxSeconds` column ranges and `parseDurationDraft`.
  - Undefined values visual-only: Task 3 tests no `onChange` on mount for undefined values.
- Placeholder scan:
  - The plan contains no red-flag placeholder terms or unspecified validation steps.
  - The only conditional cleanup step names exact commands and exact files.
- Type consistency:
  - Logbook form value is consistently `durationSeconds`.
  - Storage field remains `DiveLogManualMeasuredValues.durationSeconds`.
  - Planning form value remains `plannedDurationMinutes`.
  - Multi-column callback consistently uses `(columnId: string, value: number)`.
