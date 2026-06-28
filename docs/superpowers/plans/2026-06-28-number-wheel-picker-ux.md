# NumberWheelPicker UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `NumberWheelPicker` as an iOS-style numeric wheel with immediate focused-value updates, adjustable height, non-overlapping units, and retained direct numeric entry.

**Architecture:** Keep the existing `NumberWheelPicker` preset API backward-compatible, but move implementation state into a compound `Root` provider with context-driven child components. Use derived wheel layout math from `height`, render options through a virtualized `FlatList`, and keep scroll selection and direct input commit on the same clamp/snap/emit value pipeline.

**Tech Stack:** React Native 0.85, React 19, TypeScript, Jest, React Test Renderer, existing gluestack UI primitives, existing mobile form wrappers.

---

## Files

- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`
  - Owns layout constants, helper math, compound context, default preset, virtualized wheel, selection overlay, center input trigger, unit column, parsing/clamp/snap helpers.
- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
  - Covers backward compatibility, height-derived layout, immediate scroll updates, compound API, direct input, clamping, disabled behavior, and unit rendering.
- Modify: `apps/mobile/src/screens/common/form/numeric-slider-field.tsx`
  - Passes optional picker height from form-level wrappers to `NumberWheelPicker`.

## Baseline

- [ ] **Step 1: Confirm the current dirty worktree before implementation**

Run:

```bash
git status --short
```

Expected: existing unrelated mobile form changes may already be present. Do not revert them. The files touched by this plan are only:

```text
apps/mobile/src/components/ui/number-wheel-picker.tsx
apps/mobile/__tests__/number-wheel-picker.test.tsx
apps/mobile/src/screens/common/form/numeric-slider-field.tsx
```

- [ ] **Step 2: Run the current picker test as baseline**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: the existing `NumberWheelPicker` test file should pass before refactor. If it fails for the current worktree, record the exact failure and fix only if the failure is in one of the three files owned by this plan.

## Task 1: Height-Derived Wheel Layout

**Files:**

- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`

- [ ] **Step 1: Add RED tests for layout constants and height profiles**

In `apps/mobile/__tests__/number-wheel-picker.test.tsx`, update the import at the top to include the new layout helpers:

```ts
import {
  DEFAULT_WHEEL_HEIGHT,
  ITEM_HEIGHT,
  NumberWheelPicker,
  getWheelLayout,
} from '../src/components/ui/number-wheel-picker';
```

Then add these tests inside `describe('NumberWheelPicker', () => { ... })`:

```tsx
it('uses a 176px default wheel height with five visible candidates', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
    );
  });
  renderers.push(renderer!);

  const wheel = renderer!.root.findByProps({ testID: 'depth-picker-wheel' });
  const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

  expect(ITEM_HEIGHT).toBe(36);
  expect(DEFAULT_WHEEL_HEIGHT).toBe(176);
  expect(wheel.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ height: 176 })]));
  expect(list.props.snapToInterval).toBe(36);
  expect(list.props.contentContainerStyle).toEqual(expect.arrayContaining([expect.objectContaining({ paddingVertical: 70 })]));
});

it('derives visible candidate counts from custom picker heights', () => {
  expect(getWheelLayout(132)).toEqual({ wheelHeight: 132, visibleItemCount: 3, centerPadding: 48 });
  expect(getWheelLayout(176)).toEqual({ wheelHeight: 176, visibleItemCount: 5, centerPadding: 70 });
  expect(getWheelLayout(220)).toEqual({ wheelHeight: 220, visibleItemCount: 7, centerPadding: 92 });
  expect(getWheelLayout(80)).toEqual({ wheelHeight: 108, visibleItemCount: 3, centerPadding: 36 });
});
```

- [ ] **Step 2: Run the RED tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: fail because `DEFAULT_WHEEL_HEIGHT` and `getWheelLayout` do not exist, and `ITEM_HEIGHT` is still `44`.

- [ ] **Step 3: Add height layout helpers**

In `apps/mobile/src/components/ui/number-wheel-picker.tsx`, replace the current constants:

```ts
export const ITEM_HEIGHT = 44;

const VISIBLE_ITEM_COUNT = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEM_COUNT;
const CENTER_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEM_COUNT / 2);
```

with:

```ts
export const ITEM_HEIGHT = 36;
export const DEFAULT_WHEEL_HEIGHT = 176;

const MIN_VISIBLE_ITEM_COUNT = 3;
const MIN_WHEEL_HEIGHT = ITEM_HEIGHT * MIN_VISIBLE_ITEM_COUNT;

export type NumberWheelLayout = {
  wheelHeight: number;
  visibleItemCount: number;
  centerPadding: number;
};

export function getWheelLayout(height = DEFAULT_WHEEL_HEIGHT): NumberWheelLayout {
  const requestedHeight = Number.isFinite(height) ? height : DEFAULT_WHEEL_HEIGHT;
  const wheelHeight = Math.max(MIN_WHEEL_HEIGHT, Math.round(requestedHeight));
  const approximateCount = Math.max(MIN_VISIBLE_ITEM_COUNT, Math.round(wheelHeight / ITEM_HEIGHT));
  const visibleItemCount = toOddVisibleItemCount(approximateCount);

  return {
    wheelHeight,
    visibleItemCount,
    centerPadding: (wheelHeight - ITEM_HEIGHT) / 2,
  };
}

function toOddVisibleItemCount(value: number): number {
  const count = Math.max(MIN_VISIBLE_ITEM_COUNT, value);
  return count % 2 === 0 ? count + 1 : count;
}
```

Add `height?: number;` to `NumberWheelPickerProps`:

```ts
  height?: number;
```

Add `height = DEFAULT_WHEEL_HEIGHT` to the function parameters:

```ts
  height = DEFAULT_WHEEL_HEIGHT,
```

Inside `NumberWheelPicker`, after `inputValueType`, derive layout:

```ts
  const layout = React.useMemo(() => getWheelLayout(height), [height]);
```

Replace `style={styles.wheel}`, `style={styles.scroller}`, and `style={styles.contentContainer}` usage with arrays that include the derived layout:

```tsx
style={[styles.wheel, { height: layout.wheelHeight }]}
style={[styles.scroller, { height: layout.wheelHeight }]}
contentContainerStyle={[styles.contentContainer, { paddingVertical: layout.centerPadding }]}
```

Replace `styles.selectionFrame`, `styles.selectionRail`, `styles.topShade`, and `styles.bottomShade` usages with arrays that include derived positions:

```tsx
style={[styles.topShade, { height: layout.centerPadding }]}
style={[styles.bottomShade, { height: layout.centerPadding }]}
style={[styles.selectionFrame, { top: layout.centerPadding }]}
style={[styles.selectionRail, { top: layout.centerPadding + 8 }]}
```

Remove fixed layout values from `StyleSheet.create`:

```ts
  bottomShade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  contentContainer: {},
  scroller: {},
  topShade: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  wheel: {},
```

- [ ] **Step 4: Run the layout tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: the new layout tests pass. Existing scroll/input tests may still pass with the old monolithic component.

- [ ] **Step 5: Commit layout math**

Run:

```bash
git add apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "feat: add adjustable number wheel layout"
```

Expected: commit contains only the picker source and picker test changes from this task.

## Task 2: Compound Provider API

**Files:**

- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`

- [ ] **Step 1: Add RED test for compound composition**

Add this test to `apps/mobile/__tests__/number-wheel-picker.test.tsx`:

```tsx
it('supports compound Root, Wheel, SelectionOverlay, and CenterInputTrigger composition', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumberWheelPicker.Root value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker">
        <NumberWheelPicker.Wheel />
        <NumberWheelPicker.SelectionOverlay />
        <NumberWheelPicker.CenterInputTrigger />
      </NumberWheelPicker.Root>,
    );
  });
  renderers.push(renderer!);

  const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });
  expect(list.props.snapToInterval).toBe(ITEM_HEIGHT);
  expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('10');

  await ReactTestRenderer.act(async () => {
    list.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
  });

  expect(onChange).toHaveBeenCalledWith(15);
  expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('15');
});
```

- [ ] **Step 2: Run the RED compound test**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: fail because `NumberWheelPicker.Root`, `Wheel`, `SelectionOverlay`, and `CenterInputTrigger` do not exist.

- [ ] **Step 3: Add context types and hook**

In `apps/mobile/src/components/ui/number-wheel-picker.tsx`, add these types after `NumberWheelPickerProps`:

```ts
type NumberWheelPickerRootProps = NumberWheelPickerProps & {
  children: React.ReactNode;
};

type NumberWheelPickerState = {
  value: number;
  min: number;
  max: number;
  step: number;
  unitLabel?: string;
  disabled: boolean;
  valueType: 'int' | 'float';
  testID: string;
  layout: NumberWheelLayout;
  options: number[];
  selectedIndex: number;
  selectedValue: number;
  displayIndex: number;
  displayValue: number;
  draftValue: string;
  isEditing: boolean;
};

type NumberWheelPickerActions = {
  beginWheelInteraction: () => void;
  updateFromScrollOffset: (offsetY: number) => void;
  finishWheelScroll: (offsetY: number) => void;
  endDragWheelScroll: (offsetY: number, velocityY?: number) => void;
  openInput: () => void;
  changeDraft: (nextDraftValue: string) => void;
  commitDraft: () => void;
};

type NumberWheelPickerMeta = {
  listRef: React.RefObject<import('react-native').FlatList<number> | null>;
  inputRef: React.RefObject<React.ComponentRef<typeof InputField> | null>;
  onBlur?: () => void;
};

type NumberWheelPickerContextValue = {
  state: NumberWheelPickerState;
  actions: NumberWheelPickerActions;
  meta: NumberWheelPickerMeta;
};

const NumberWheelPickerContext = React.createContext<NumberWheelPickerContextValue | null>(null);

function useNumberWheelPicker(componentName: string): NumberWheelPickerContextValue {
  const context = React.use(NumberWheelPickerContext);
  if (context === null) {
    throw new Error(`${componentName} must be used within NumberWheelPicker.Root`);
  }

  return context;
}
```

- [ ] **Step 4: Split the preset from the provider root**

Replace the current `export function NumberWheelPicker(...)` function declaration with a preset wrapper and a new root component shell:

```tsx
function NumberWheelPickerPreset(props: NumberWheelPickerProps): React.JSX.Element {
  return (
    <NumberWheelPickerRoot {...props}>
      <NumberWheelPickerWheel />
      <NumberWheelPickerSelectionOverlay />
      <NumberWheelPickerCenterInputTrigger />
    </NumberWheelPickerRoot>
  );
}

function NumberWheelPickerRoot({
  value,
  min,
  max,
  step = 1,
  onChange,
  unitLabel,
  disabled = false,
  valueType,
  onBlur,
  testID = 'number-wheel-picker',
  height = DEFAULT_WHEEL_HEIGHT,
  children,
}: NumberWheelPickerRootProps): React.JSX.Element {
  const listRef = React.useRef<import('react-native').FlatList<number>>(null);
  const inputRef = React.useRef<React.ComponentRef<typeof InputField>>(null);
  const safeStep = step > 0 ? step : 1;
  const options = React.useMemo(() => makeNumberOptions(min, max, safeStep), [max, min, safeStep]);
  const selectedIndex = React.useMemo(() => getClosestOptionIndex(options, value), [options, value]);
  const selectedValue = options[selectedIndex] ?? clamp(roundToStep(value, safeStep), min, max);
  const inputValueType = valueType ?? (getStepPrecision(safeStep) > 0 ? 'float' : 'int');
  const layout = React.useMemo(() => getWheelLayout(height), [height]);
  const [displayIndex, setDisplayIndex] = React.useState(selectedIndex);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(() => formatNumber(selectedValue, safeStep));
  const displayIndexRef = React.useRef(selectedIndex);
  const isWheelInteractingRef = React.useRef(false);
  const lastEmittedValueRef = React.useRef(selectedValue);
  const displayValue = options[displayIndex] ?? selectedValue;

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(formatNumber(displayValue, safeStep));
    }
  }, [displayValue, isEditing, safeStep]);

  React.useEffect(() => {
    const nextIndex = clampIndex(selectedIndex, options.length);
    displayIndexRef.current = nextIndex;
    lastEmittedValueRef.current = selectedValue;
    setDisplayIndex(nextIndex);

    if (!isWheelInteractingRef.current) {
      listRef.current?.scrollToOffset({ offset: nextIndex * ITEM_HEIGHT, animated: false });
    }
  }, [options.length, selectedIndex, selectedValue]);

  const selectIndex = React.useCallback(
    (nextIndex: number, shouldEmit: boolean) => {
      const clampedIndex = clampIndex(nextIndex, options.length);
      const nextValue = options[clampedIndex];
      if (nextValue === undefined) {
        return;
      }

      if (clampedIndex !== displayIndexRef.current) {
        displayIndexRef.current = clampedIndex;
        setDisplayIndex(clampedIndex);
      }

      if (shouldEmit && !areNumbersEqual(nextValue, lastEmittedValueRef.current)) {
        lastEmittedValueRef.current = nextValue;
        onChange(nextValue);
      }
    },
    [onChange, options],
  );

  const updateFromScrollOffset = React.useCallback(
    (offsetY: number) => {
      if (options.length === 0) {
        return;
      }

      selectIndex(Math.round(offsetY / ITEM_HEIGHT), true);
    },
    [options.length, selectIndex],
  );

  const beginWheelInteraction = React.useCallback(() => {
    if (!disabled) {
      isWheelInteractingRef.current = true;
    }
  }, [disabled]);

  const finishWheelScroll = React.useCallback(
    (offsetY: number) => {
      if (disabled || isEditing) {
        return;
      }

      updateFromScrollOffset(offsetY);
      isWheelInteractingRef.current = false;
    },
    [disabled, isEditing, updateFromScrollOffset],
  );

  const endDragWheelScroll = React.useCallback(
    (offsetY: number, velocityY = 0) => {
      if (disabled || isEditing) {
        return;
      }

      updateFromScrollOffset(offsetY);
      if (Math.abs(velocityY) < 0.05) {
        isWheelInteractingRef.current = false;
      }
    },
    [disabled, isEditing, updateFromScrollOffset],
  );

  const changeDraft = React.useCallback(
    (nextDraftValue: string) => {
      setDraftValue(normalizeDraftValue(nextDraftValue, inputValueType));
    },
    [inputValueType],
  );

  const openInput = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setDraftValue(formatNumber(displayValue, safeStep));
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus?.();
    }, 0);
  }, [disabled, displayValue, safeStep]);

  const commitDraft = React.useCallback(() => {
    const parsedValue = parseDraftValue(draftValue);
    setIsEditing(false);
    Keyboard.dismiss();
    onBlur?.();

    if (parsedValue === undefined) {
      setDraftValue(formatNumber(displayValue, safeStep));
      return;
    }

    const nextValue = clamp(roundToStep(parsedValue, safeStep), min, max);
    const nextIndex = getClosestOptionIndex(options, nextValue);
    setDraftValue(formatNumber(nextValue, safeStep));
    selectIndex(nextIndex, !areNumbersEqual(nextValue, value));
    listRef.current?.scrollToOffset({ offset: nextIndex * ITEM_HEIGHT, animated: false });
  }, [displayValue, draftValue, max, min, onBlur, options, safeStep, selectIndex, value]);

  const contextValue = React.useMemo<NumberWheelPickerContextValue>(
    () => ({
      state: {
        value,
        min,
        max,
        step: safeStep,
        unitLabel,
        disabled,
        valueType: inputValueType,
        testID,
        layout,
        options,
        selectedIndex,
        selectedValue,
        displayIndex,
        displayValue,
        draftValue,
        isEditing,
      },
      actions: {
        beginWheelInteraction,
        updateFromScrollOffset,
        finishWheelScroll,
        endDragWheelScroll,
        openInput,
        changeDraft,
        commitDraft,
      },
      meta: {
        listRef,
        inputRef,
        onBlur,
      },
    }),
    [
      beginWheelInteraction,
      changeDraft,
      commitDraft,
      disabled,
      displayIndex,
      displayValue,
      draftValue,
      endDragWheelScroll,
      finishWheelScroll,
      inputValueType,
      isEditing,
      layout,
      max,
      min,
      onBlur,
      openInput,
      options,
      safeStep,
      selectedIndex,
      selectedValue,
      testID,
      unitLabel,
      updateFromScrollOffset,
      value,
    ],
  );

  return (
    <NumberWheelPickerContext value={contextValue}>
      <Box
        testID={testID}
        accessibilityRole="adjustable"
        accessibilityLabel={unitLabel ? `Number picker, ${unitLabel}` : 'Number picker'}
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min,
          max,
          now: displayValue,
          text: unitLabel ? `${formatNumber(displayValue, safeStep)} ${unitLabel}` : formatNumber(displayValue, safeStep),
        }}
      >
        {children}
      </Box>
    </NumberWheelPickerContext>
  );
}
```

- [ ] **Step 5: Add temporary child components and export the compound object**

Below `NumberWheelPickerRoot`, add these temporary child components. Task 3 will replace `ScrollView` with `FlatList`, but this step makes the compound API test pass while preserving existing behavior.

```tsx
function NumberWheelPickerWheel(): React.JSX.Element {
  const {
    state: { disabled, isEditing, layout, options, displayIndex, step, testID },
    actions: { beginWheelInteraction, endDragWheelScroll, finishWheelScroll, updateFromScrollOffset },
    meta: { listRef },
  } = useNumberWheelPicker('NumberWheelPicker.Wheel');

  const optionRows = React.useMemo(
    () =>
      options.map((item, index) => {
        const distanceFromCenter = Math.abs(index - displayIndex);
        const itemTextClassName =
          distanceFromCenter === 0
            ? 'text-xl font-semibold text-foreground'
            : distanceFromCenter === 1
              ? 'text-base font-medium text-muted-foreground'
              : 'text-sm font-medium text-muted-foreground/50';

        return (
          <Box key={keyExtractor(item)} style={styles.item} className="items-center justify-center">
            <Text className={itemTextClassName}>{formatNumber(item, step)}</Text>
          </Box>
        );
      }),
    [displayIndex, options, step],
  );

  return (
    <ScrollView
      ref={listRef as unknown as React.Ref<React.ComponentRef<typeof ScrollView>>}
      testID={`${testID}-wheel-list`}
      contentOffset={{ x: 0, y: displayIndex * ITEM_HEIGHT }}
      onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!disabled && !isEditing) {
          updateFromScrollOffset(event.nativeEvent.contentOffset.y);
        }
      }}
      onScrollBeginDrag={beginWheelInteraction}
      onMomentumScrollBegin={beginWheelInteraction}
      onScrollEndDrag={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        endDragWheelScroll(event.nativeEvent.contentOffset.y, event.nativeEvent.velocity?.y);
      }}
      onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        finishWheelScroll(event.nativeEvent.contentOffset.y);
      }}
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      scrollEnabled={!disabled && !isEditing}
      nestedScrollEnabled
      bounces={false}
      scrollEventThrottle={16}
      style={[styles.scroller, { height: layout.wheelHeight }]}
      contentContainerStyle={[styles.contentContainer, { paddingVertical: layout.centerPadding }]}
    >
      {optionRows}
    </ScrollView>
  );
}

function NumberWheelPickerSelectionOverlay(): React.JSX.Element {
  const {
    state: { disabled, layout },
  } = useNumberWheelPicker('NumberWheelPicker.SelectionOverlay');
  const shadeClassName = disabled ? 'bg-muted/80' : 'bg-card/80';

  return (
    <>
      <Box pointerEvents="none" style={[styles.topShade, { height: layout.centerPadding }]} className={shadeClassName} />
      <Box pointerEvents="none" style={[styles.bottomShade, { height: layout.centerPadding }]} className={shadeClassName} />
      <Box pointerEvents="none" style={[styles.selectionFrame, { top: layout.centerPadding }]} className="border-y border-primary/30 bg-primary/10" />
      <Box pointerEvents="none" style={[styles.selectionRail, { top: layout.centerPadding + 8 }]} className="bg-primary" />
    </>
  );
}

function NumberWheelPickerCenterInputTrigger(): React.JSX.Element {
  const {
    state: { disabled, displayValue, draftValue, isEditing, layout, step, testID, unitLabel, valueType },
    actions: { changeDraft, commitDraft, openInput },
    meta: { inputRef },
  } = useNumberWheelPicker('NumberWheelPicker.CenterInputTrigger');

  return (
    <Pressable
      testID={`${testID}-input-trigger`}
      accessibilityRole="button"
      accessibilityLabel="Enter number"
      disabled={disabled}
      onPress={openInput}
      style={[styles.selectionFrame, { top: layout.centerPadding }]}
      className="items-center justify-center px-4 data-[active=true]:bg-primary/10"
    >
      {isEditing ? (
        <HStack space="xs" className="w-full items-center justify-center">
          <Input className="h-10 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none">
            <InputField
              ref={inputRef}
              testID={`${testID}-input`}
              value={draftValue}
              onChangeText={changeDraft}
              onSubmitEditing={commitDraft}
              onBlur={commitDraft}
              keyboardType={valueType === 'float' ? 'decimal-pad' : 'number-pad'}
              returnKeyType="done"
              selectTextOnFocus
              autoFocus
              editable={!disabled}
              className="text-center text-2xl font-semibold text-foreground"
            />
          </Input>
          {unitLabel ? (
            <Text testID={`${testID}-unit`} className="text-xs font-semibold text-primary">
              {unitLabel}
            </Text>
          ) : null}
        </HStack>
      ) : (
        <HStack space="xs" className="items-baseline justify-center">
          <Text testID={`${testID}-value`} className="text-2xl font-semibold text-foreground">
            {formatNumber(displayValue, step)}
          </Text>
          {unitLabel ? (
            <Text testID={`${testID}-unit`} className="text-xs font-semibold text-primary">
              {unitLabel}
            </Text>
          ) : null}
        </HStack>
      )}
    </Pressable>
  );
}

export const NumberWheelPicker = Object.assign(NumberWheelPickerPreset, {
  Root: NumberWheelPickerRoot,
  Wheel: NumberWheelPickerWheel,
  SelectionOverlay: NumberWheelPickerSelectionOverlay,
  CenterInputTrigger: NumberWheelPickerCenterInputTrigger,
});
```

Remove the old monolithic `export function NumberWheelPicker(...)` body after the new components are in place. Keep helper functions below `StyleSheet.create`.

- [ ] **Step 6: Run compound tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all current picker tests pass, including the new compound API test.

- [ ] **Step 7: Commit compound provider**

Run:

```bash
git add apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "refactor: compose number wheel picker internals"
```

Expected: commit contains only picker source and picker test changes from this task.

## Task 3: Virtualized Wheel Rows And Non-Overlapping Units

**Files:**

- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`

- [ ] **Step 1: Add RED tests for FlatList data and unit columns**

Update the first test, `renders a vertical snapping wheel from min to max using step`, so it expects `FlatList` data instead of mapped `ScrollView` children:

```tsx
expect(list.props.data).toEqual([0, 5, 10, 15, 20]);
expect(list.props.getItemLayout(undefined, 3)).toEqual({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * 3, index: 3 });
```

Remove this assertion from the same test:

```tsx
expect(React.Children.count(list.props.children)).toBe(5);
```

Add this test:

```tsx
it('renders option rows with separate value and unit columns', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumberWheelPicker value={150} min={148} max={152} step={1} unitLabel="m" onChange={onChange} testID="depth-picker" />,
    );
  });
  renderers.push(renderer!);

  expect(renderer!.root.findByProps({ testID: 'depth-picker-option-150-value' }).props.children).toBe('150');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-option-150-unit' }).props.children).toBe('m');
  expect(renderer!.root.findByProps({ testID: 'depth-picker-center-value-column' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'depth-picker-center-unit-column' })).toBeTruthy();
});
```

- [ ] **Step 2: Run RED tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: fail because `NumberWheelPicker.Wheel` still renders a `ScrollView`, list `data` does not exist, and unit column test IDs do not exist.

- [ ] **Step 3: Replace ScrollView with FlatList**

In `apps/mobile/src/components/ui/number-wheel-picker.tsx`, remove the `ScrollView` import:

```ts
import { ScrollView } from './scroll-view';
```

Add these imports:

```ts
import type { FlatList as RNFlatList } from 'react-native';
import { FlatList } from './flat-list';
```

Update `NumberWheelPickerMeta`:

```ts
type NumberWheelPickerMeta = {
  listRef: React.RefObject<RNFlatList<number> | null>;
  inputRef: React.RefObject<React.ComponentRef<typeof InputField> | null>;
  onBlur?: () => void;
};
```

Update the `listRef` in `NumberWheelPickerRoot`:

```ts
  const listRef = React.useRef<RNFlatList<number>>(null);
```

Add these module-level list helpers above `NumberWheelPickerWheel`:

```ts
type NumberWheelOptionRenderItem = {
  item: number;
  index: number;
};

function getOptionItemLayout(_: ArrayLike<number> | null | undefined, index: number): { length: number; offset: number; index: number } {
  return {
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  };
}
```

Replace `NumberWheelPickerWheel` with:

```tsx
function NumberWheelPickerWheel(): React.JSX.Element {
  const {
    state: { disabled, isEditing, layout, options, displayIndex, testID },
    actions: { beginWheelInteraction, endDragWheelScroll, finishWheelScroll, updateFromScrollOffset },
    meta: { listRef },
  } = useNumberWheelPicker('NumberWheelPicker.Wheel');

  const renderItem = React.useCallback(
    ({ item, index }: NumberWheelOptionRenderItem) => <NumberWheelPickerOption value={item} index={index} />,
    [],
  );

  return (
    <FlatList
      ref={listRef}
      testID={`${testID}-wheel-list`}
      data={options}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getOptionItemLayout}
      initialScrollIndex={displayIndex}
      extraData={displayIndex}
      onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!disabled && !isEditing) {
          updateFromScrollOffset(event.nativeEvent.contentOffset.y);
        }
      }}
      onScrollBeginDrag={beginWheelInteraction}
      onMomentumScrollBegin={beginWheelInteraction}
      onScrollEndDrag={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        endDragWheelScroll(event.nativeEvent.contentOffset.y, event.nativeEvent.velocity?.y);
      }}
      onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        finishWheelScroll(event.nativeEvent.contentOffset.y);
      }}
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      scrollEnabled={!disabled && !isEditing}
      nestedScrollEnabled
      bounces={false}
      scrollEventThrottle={16}
      style={[styles.scroller, { height: layout.wheelHeight }]}
      contentContainerStyle={[styles.contentContainer, { paddingVertical: layout.centerPadding }]}
    />
  );
}
```

- [ ] **Step 4: Add option rows with fixed value/unit columns**

Add this component below `NumberWheelPickerWheel`:

```tsx
type NumberWheelPickerOptionProps = {
  value: number;
  index: number;
};

function NumberWheelPickerOption({ value, index }: NumberWheelPickerOptionProps): React.JSX.Element {
  const {
    state: { displayIndex, step, testID, unitLabel },
  } = useNumberWheelPicker('NumberWheelPicker.Option');
  const distanceFromCenter = Math.abs(index - displayIndex);
  const itemTextClassName =
    distanceFromCenter === 0
      ? 'text-xl font-semibold text-foreground'
      : distanceFromCenter === 1
        ? 'text-base font-medium text-muted-foreground'
        : 'text-sm font-medium text-muted-foreground/50';
  const unitTextClassName =
    distanceFromCenter === 0
      ? 'text-xs font-semibold text-foreground'
      : distanceFromCenter === 1
        ? 'text-xs font-semibold text-muted-foreground'
        : 'text-xs font-semibold text-muted-foreground/50';
  const formattedValue = formatNumber(value, step);

  return (
    <HStack style={styles.item} className="items-center justify-center">
      <Box testID={`${testID}-option-${formattedValue}-value-column`} style={styles.valueColumn} className="items-end justify-center">
        <Text testID={`${testID}-option-${formattedValue}-value`} className={itemTextClassName}>
          {formattedValue}
        </Text>
      </Box>
      <Box testID={`${testID}-option-${formattedValue}-unit-column`} style={styles.unitColumn} className="items-start justify-center">
        {unitLabel ? (
          <Text testID={`${testID}-option-${formattedValue}-unit`} className={unitTextClassName}>
            {unitLabel}
          </Text>
        ) : null}
      </Box>
    </HStack>
  );
}
```

Update `StyleSheet.create` with the fixed columns:

```ts
  valueColumn: {
    flex: 1,
    paddingRight: 8,
  },
  unitColumn: {
    width: 44,
  },
```

- [ ] **Step 5: Update center trigger columns**

Inside `NumberWheelPickerCenterInputTrigger`, replace the non-editing `HStack` with:

```tsx
<HStack className="items-baseline justify-center">
  <Box testID={`${testID}-center-value-column`} style={styles.valueColumn} className="items-end justify-center">
    <Text testID={`${testID}-value`} className="text-2xl font-semibold text-foreground">
      {formatNumber(displayValue, step)}
    </Text>
  </Box>
  <Box testID={`${testID}-center-unit-column`} style={styles.unitColumn} className="items-start justify-center">
    {unitLabel ? (
      <Text testID={`${testID}-unit`} className="text-xs font-semibold text-primary">
        {unitLabel}
      </Text>
    ) : null}
  </Box>
</HStack>
```

Replace the editing `HStack` with:

```tsx
<HStack className="w-full items-center justify-center">
  <Box testID={`${testID}-center-value-column`} style={styles.valueColumn} className="items-end justify-center">
    <Input className="h-10 w-full rounded-none border-0 bg-transparent px-0 shadow-none">
      <InputField
        ref={inputRef}
        testID={`${testID}-input`}
        value={draftValue}
        onChangeText={changeDraft}
        onSubmitEditing={commitDraft}
        onBlur={commitDraft}
        keyboardType={valueType === 'float' ? 'decimal-pad' : 'number-pad'}
        returnKeyType="done"
        selectTextOnFocus
        autoFocus
        editable={!disabled}
        className="text-right text-2xl font-semibold text-foreground"
      />
    </Input>
  </Box>
  <Box testID={`${testID}-center-unit-column`} style={styles.unitColumn} className="items-start justify-center">
    {unitLabel ? (
      <Text testID={`${testID}-unit`} className="text-xs font-semibold text-primary">
        {unitLabel}
      </Text>
    ) : null}
  </Box>
</HStack>
```

Update the `Pressable` className so it does not fill the entire wheel width and block scroll gestures across the full selection band:

```tsx
className="self-center px-4 data-[active=true]:bg-primary/10"
```

Update `styles.selectionFrame` so it can be reused by the visual frame and the smaller center trigger:

```ts
  selectionFrame: {
    height: ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  centerInputTrigger: {
    height: ITEM_HEIGHT,
    left: 24,
    position: 'absolute',
    right: 24,
  },
```

Then use `styles.centerInputTrigger` on the `Pressable`:

```tsx
style={[styles.centerInputTrigger, { top: layout.centerPadding }]}
```

- [ ] **Step 6: Run virtualized row tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all picker tests pass. The test output should confirm `data`, `getItemLayout`, option value/unit test IDs, and center value/unit column test IDs are present.

- [ ] **Step 7: Commit virtualized wheel rows**

Run:

```bash
git add apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "feat: render number wheel rows with fixed unit columns"
```

Expected: commit contains only picker source and picker test changes from this task.

## Task 4: Direct Input Commit Pipeline And Disabled Behavior

**Files:**

- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`

- [ ] **Step 1: Add RED tests for large direct input, clamp, and disabled behavior**

Add these tests to `apps/mobile/__tests__/number-wheel-picker.test.tsx`:

```tsx
it('accepts a large direct integer entry and emits the snapped value', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumberWheelPicker value={0} min={0} max={200} step={1} unitLabel="m" onChange={onChange} testID="depth-picker" />,
    );
  });
  renderers.push(renderer!);

  const root = renderer!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
  });

  const input = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onChangeText === 'function');
  expect(input).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    input!.props.onChangeText('150');
  });

  const updatedInput = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function');
  await ReactTestRenderer.act(async () => {
    updatedInput!.props.onSubmitEditing();
  });

  expect(onChange).toHaveBeenCalledWith(150);
  expect(root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('150');
});

it('clamps direct entry to max and snaps to step before emitting', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumberWheelPicker value={0} min={0} max={40} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
    );
  });
  renderers.push(renderer!);

  const root = renderer!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
  });

  const input = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onChangeText === 'function');
  await ReactTestRenderer.act(async () => {
    input!.props.onChangeText('999');
  });

  const updatedInput = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function');
  await ReactTestRenderer.act(async () => {
    updatedInput!.props.onSubmitEditing();
  });

  expect(onChange).toHaveBeenCalledWith(40);
  expect(root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('40');
});

it('does not emit scroll or open input while disabled', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" disabled onChange={onChange} testID="depth-picker" />,
    );
  });
  renderers.push(renderer!);

  const root = renderer!.root;
  const list = root.findByProps({ testID: 'depth-picker-wheel-list' });

  await ReactTestRenderer.act(async () => {
    list.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
    root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
  });

  expect(onChange).not.toHaveBeenCalled();
  expect(root.findAllByProps({ testID: 'depth-picker-input' })).toHaveLength(0);
  expect(root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('10');
});
```

- [ ] **Step 2: Run RED tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: at least the large input and clamp tests fail if `commitDraft` emits without updating local display state.

- [ ] **Step 3: Make commit use one select-and-emit pipeline**

In `NumberWheelPickerRoot`, replace the current `selectIndex` with this version:

```ts
  const selectIndex = React.useCallback(
    (nextIndex: number, shouldEmit: boolean) => {
      const clampedIndex = clampIndex(nextIndex, options.length);
      const nextValue = options[clampedIndex];
      if (nextValue === undefined) {
        return;
      }

      displayIndexRef.current = clampedIndex;
      setDisplayIndex(clampedIndex);

      if (shouldEmit && !areNumbersEqual(nextValue, lastEmittedValueRef.current)) {
        lastEmittedValueRef.current = nextValue;
        onChange(nextValue);
      }
    },
    [onChange, options],
  );
```

Replace `commitDraft` with:

```ts
  const commitDraft = React.useCallback(() => {
    const parsedValue = parseDraftValue(draftValue);
    setIsEditing(false);
    Keyboard.dismiss();
    onBlur?.();

    if (parsedValue === undefined) {
      setDraftValue(formatNumber(displayValue, safeStep));
      return;
    }

    const nextValue = clamp(roundToStep(parsedValue, safeStep), min, max);
    const nextIndex = getClosestOptionIndex(options, nextValue);
    setDraftValue(formatNumber(nextValue, safeStep));
    selectIndex(nextIndex, true);
    listRef.current?.scrollToOffset({ offset: nextIndex * ITEM_HEIGHT, animated: false });
  }, [displayValue, draftValue, max, min, onBlur, options, safeStep, selectIndex]);
```

Keep `handle/openInput` disabled guarding in `openInput`:

```ts
  const openInput = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setDraftValue(formatNumber(displayValue, safeStep));
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus?.();
    }, 0);
  }, [disabled, displayValue, safeStep]);
```

- [ ] **Step 4: Keep scroll handlers disabled while editing**

Confirm `NumberWheelPickerWheel` has this exact `onScroll` guard:

```tsx
onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
  if (!disabled && !isEditing) {
    updateFromScrollOffset(event.nativeEvent.contentOffset.y);
  }
}}
```

Confirm `scrollEnabled` remains:

```tsx
scrollEnabled={!disabled && !isEditing}
```

- [ ] **Step 5: Run input and disabled tests**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all picker tests pass, including direct `150` entry, max clamp to `40`, and disabled no-op behavior.

- [ ] **Step 6: Commit input pipeline**

Run:

```bash
git add apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "fix: unify number wheel direct input commits"
```

Expected: commit contains only picker source and picker test changes from this task.

## Task 5: Form Wrapper Height Pass-Through And Final Verification

**Files:**

- Modify: `apps/mobile/src/screens/common/form/numeric-slider-field.tsx`
- Modify: `apps/mobile/__tests__/number-wheel-picker.test.tsx`
- Modify: `apps/mobile/src/components/ui/number-wheel-picker.tsx`

- [ ] **Step 1: Add RED test for NumericSliderField picker height pass-through**

In `apps/mobile/__tests__/number-wheel-picker.test.tsx`, add this import:

```ts
import { NumericSliderField } from '../src/screens/common/form/numeric-slider-field';
```

Then add this test:

```tsx
it('passes pickerHeight from NumericSliderField to NumberWheelPicker height', async () => {
  const onChange = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NumericSliderField
        label="Maximum depth"
        value={10}
        min={0}
        max={20}
        step={5}
        unitLabel="m"
        pickerHeight={132}
        onChange={onChange}
        testID="depth-picker"
      />,
    );
  });
  renderers.push(renderer!);

  const wheel = renderer!.root.findByProps({ testID: 'depth-picker-wheel' });
  const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

  expect(wheel.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ height: 132 })]));
  expect(list.props.contentContainerStyle).toEqual(expect.arrayContaining([expect.objectContaining({ paddingVertical: 48 })]));
});
```

- [ ] **Step 2: Run RED pass-through test**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: fail because `NumericSliderFieldProps` does not accept `pickerHeight` yet, or because the wrapper does not pass `pickerHeight` to `NumberWheelPicker`.

- [ ] **Step 3: Expose optional picker height through NumericSliderField**

In `apps/mobile/src/screens/common/form/numeric-slider-field.tsx`, add this prop to `NumericSliderFieldProps`:

```ts
  pickerHeight?: number;
```

Pass it to `NumberWheelPicker`:

```tsx
        height={props.pickerHeight}
```

The final `NumberWheelPicker` call should include:

```tsx
      <NumberWheelPicker
        value={selectedValue}
        min={props.min}
        max={props.max}
        step={props.step}
        unitLabel={props.unitLabel}
        valueType={valueType}
        disabled={props.disabled}
        height={props.pickerHeight}
        onChange={props.onChange}
        testID={props.testID}
      />
```

- [ ] **Step 4: Run targeted picker test**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: all picker tests pass.

- [ ] **Step 5: Run mobile typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: pass. If it fails because pre-existing unrelated worktree files are already broken, record exact file paths and rerun after isolating the failure to confirm `number-wheel-picker.tsx` and `numeric-slider-field.tsx` typecheck cleanly.

- [ ] **Step 6: Commit form wrapper pass-through**

Run:

```bash
git add apps/mobile/src/screens/common/form/numeric-slider-field.tsx apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx
git commit -m "feat: expose number wheel picker height"
```

Expected: commit contains the form wrapper pass-through and any final picker/test adjustments from this task.

## Final Verification

- [ ] **Step 1: Run the targeted test one last time**

Run:

```bash
yarn workspace @repo/mobile test -- number-wheel-picker.test.tsx --runInBand
```

Expected: pass.

- [ ] **Step 2: Run the required mobile typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: pass.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git status --short
git diff -- apps/mobile/src/components/ui/number-wheel-picker.tsx apps/mobile/__tests__/number-wheel-picker.test.tsx apps/mobile/src/screens/common/form/numeric-slider-field.tsx
```

Expected: only intentional picker, picker test, and numeric form wrapper changes remain in these three files. Do not revert unrelated existing worktree changes.

- [ ] **Step 4: Prepare handoff summary**

Include these points in the final handoff:

```text
- NumberWheelPicker now has a compound Root/Wheel/SelectionOverlay/CenterInputTrigger structure while preserving the existing preset API.
- Default height is 176; custom height drives compact/roomy visible candidates.
- Wheel rows and direct input use fixed value/unit columns to avoid overlap.
- Scroll updates selected value immediately; direct input clamps/snaps through the same value pipeline.
- Verification commands run and their pass/fail results.
```

## Self-Review Notes

- Spec coverage: Tasks 1-5 cover adjustable height, default B density, compound API, immediate scroll updates, non-overlapping units, direct entry, disabled state, form wrapper reuse, and required verification.
- Deferred-work scan: no deferred or incomplete steps are intentionally present.
- Type consistency: the plan consistently uses `height` on `NumberWheelPicker`, `pickerHeight` on `NumericSliderField`, `getWheelLayout`, `DEFAULT_WHEEL_HEIGHT`, `ITEM_HEIGHT`, `Root`, `Wheel`, `SelectionOverlay`, and `CenterInputTrigger`.
