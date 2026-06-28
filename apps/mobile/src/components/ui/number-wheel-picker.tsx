import React from 'react';
import {
  Keyboard,
  StyleSheet,
  type FlatList as RNFlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Box } from './box';
import { FlatList } from './flat-list';
import { HStack } from './hstack';
import { Input, InputField } from './input';
import { Pressable } from './pressable';
import { Text } from './text';

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

export type NumberWheelPickerProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unitLabel?: string;
  disabled?: boolean;
  valueType?: 'int' | 'float';
  onBlur?: () => void;
  height?: number;
  testID?: string;
};

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
  listRef: React.RefObject<RNFlatList<number> | null>;
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

function NumberWheelPickerPreset(props: NumberWheelPickerProps): React.JSX.Element {
  return (
    <NumberWheelPickerRoot {...props}>
      <Box
        testID={`${props.testID ?? 'number-wheel-picker'}-wheel`}
        className={props.disabled ? 'overflow-hidden rounded-xl border border-border bg-muted' : 'overflow-hidden rounded-xl border border-border bg-card'}
        style={[styles.wheel, { height: getWheelLayout(props.height).wheelHeight }]}
      >
        <NumberWheelPickerWheel />
        <NumberWheelPickerSelectionOverlay />
        <NumberWheelPickerCenterInputTrigger />
      </Box>
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
  height = DEFAULT_WHEEL_HEIGHT,
  testID = 'number-wheel-picker',
  children,
}: NumberWheelPickerRootProps): React.JSX.Element {
  const listRef = React.useRef<RNFlatList<number>>(null);
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
    if (disabled) {
      return;
    }

    isWheelInteractingRef.current = true;
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
      (inputRef.current as unknown as { focus?: () => void } | null)?.focus?.();
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

    const clampedDraftValue = clamp(parsedValue, min, max);
    const nextValue = clamp(roundToStep(clampedDraftValue, safeStep), min, max);
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
    <NumberWheelPickerContext.Provider value={contextValue}>
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
    </NumberWheelPickerContext.Provider>
  );
}

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
      style={[styles.centerInputTrigger, { top: layout.centerPadding }]}
      className="self-center px-4 data-[active=true]:bg-primary/10"
    >
      {isEditing ? (
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
      ) : (
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

const styles = StyleSheet.create({
  bottomShade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  contentContainer: {},
  item: {
    height: ITEM_HEIGHT,
  },
  scroller: {},
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
  selectionRail: {
    borderRadius: 2,
    height: 28,
    left: 12,
    position: 'absolute',
    width: 4,
  },
  topShade: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  unitColumn: {
    width: 44,
  },
  valueColumn: {
    flex: 1,
    paddingRight: 8,
  },
  wheel: {},
});

function makeNumberOptions(min: number, max: number, step: number): number[] {
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

function keyExtractor(value: number): string {
  return `${value}`;
}

function getClosestOptionIndex(options: readonly number[], value: number): number {
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

function normalizeDraftValue(value: string, valueType: 'int' | 'float'): string {
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

function parseDraftValue(value: string): number | undefined {
  if (value.trim().length === 0 || value === '.') {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampIndex(value: number, length: number): number {
  return Math.max(0, Math.min(length - 1, value));
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }

  const precision = getStepPrecision(step);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

function formatNumber(value: number, step: number): string {
  const precision = getStepPrecision(step);
  return value.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function getStepPrecision(step: number): number {
  const decimalPart = `${step}`.split('.')[1];
  return decimalPart?.length ?? 0;
}

function areNumbersEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}
