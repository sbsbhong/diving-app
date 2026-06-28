import React from 'react';
import {
  Keyboard,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Box } from './box';
import { HStack } from './hstack';
import { Input, InputField } from './input';
import { Pressable } from './pressable';
import { ScrollView } from './scroll-view';
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

export function NumberWheelPicker({
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
}: NumberWheelPickerProps): React.JSX.Element {
  const scrollViewRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const inputRef = React.useRef<React.ComponentRef<typeof InputField>>(null);
  const options = React.useMemo(() => makeNumberOptions(min, max, step), [max, min, step]);
  const selectedIndex = React.useMemo(() => getClosestOptionIndex(options, value), [options, value]);
  const selectedValue = options[selectedIndex] ?? clamp(roundToStep(value, step), min, max);
  const inputValueType = valueType ?? (getStepPrecision(step) > 0 ? 'float' : 'int');
  const layout = React.useMemo(() => getWheelLayout(height), [height]);
  const [displayIndex, setDisplayIndex] = React.useState(selectedIndex);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(() => formatNumber(selectedValue, step));
  const displayIndexRef = React.useRef(selectedIndex);
  const isWheelInteractingRef = React.useRef(false);
  const lastEmittedValueRef = React.useRef(selectedValue);
  const displayValue = options[displayIndex] ?? selectedValue;
  const initialContentOffset = React.useMemo(() => ({ x: 0, y: selectedIndex * ITEM_HEIGHT }), [selectedIndex]);

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(formatNumber(displayValue, step));
    }
  }, [displayValue, isEditing, step]);

  React.useEffect(() => {
    const nextIndex = clampIndex(selectedIndex, options.length);
    displayIndexRef.current = nextIndex;
    lastEmittedValueRef.current = selectedValue;
    setDisplayIndex(nextIndex);

    if (!isWheelInteractingRef.current) {
      scrollViewRef.current?.scrollTo({ y: nextIndex * ITEM_HEIGHT, animated: false });
    }
  }, [options.length, selectedIndex, selectedValue]);

  const updateFromScrollOffset = React.useCallback(
    (offsetY: number) => {
      if (options.length === 0) {
        return;
      }

      const nextIndex = clampIndex(Math.round(offsetY / ITEM_HEIGHT), options.length);
      const nextValue = options[nextIndex];
      if (nextValue === undefined) {
        return;
      }

      if (nextIndex !== displayIndexRef.current) {
        displayIndexRef.current = nextIndex;
        setDisplayIndex(nextIndex);
      }

      if (!areNumbersEqual(nextValue, lastEmittedValueRef.current)) {
        lastEmittedValueRef.current = nextValue;
        onChange(nextValue);
      }
    },
    [onChange, options],
  );

  const commitDraft = React.useCallback(() => {
    const parsedValue = parseDraftValue(draftValue);
    setIsEditing(false);
    Keyboard.dismiss();
    onBlur?.();

    if (parsedValue === undefined) {
      setDraftValue(formatNumber(displayValue, step));
      return;
    }

    const nextValue = clamp(roundToStep(parsedValue, step), min, max);
    setDraftValue(formatNumber(nextValue, step));
    if (!areNumbersEqual(nextValue, value)) {
      lastEmittedValueRef.current = nextValue;
      onChange(nextValue);
    }
  }, [displayValue, draftValue, max, min, onBlur, onChange, step, value]);

  const handleDraftChange = React.useCallback(
    (nextDraftValue: string) => {
      setDraftValue(normalizeDraftValue(nextDraftValue, inputValueType));
    },
    [inputValueType],
  );

  const handleInputPress = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setDraftValue(formatNumber(displayValue, step));
    setIsEditing(true);
    setTimeout(() => {
      (inputRef.current as unknown as { focus?: () => void } | null)?.focus?.();
    }, 0);
  }, [disabled, displayValue, step]);

  const handleWheelScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (disabled || isEditing) {
        return;
      }

      updateFromScrollOffset(event.nativeEvent.contentOffset.y);
    },
    [disabled, isEditing, updateFromScrollOffset],
  );

  const handleScrollBeginDrag = React.useCallback(() => {
    if (!disabled) {
      isWheelInteractingRef.current = true;
    }
  }, [disabled]);

  const finishWheelScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (disabled || isEditing) {
        return;
      }

      updateFromScrollOffset(event.nativeEvent.contentOffset.y);
      isWheelInteractingRef.current = false;
    },
    [disabled, isEditing, updateFromScrollOffset],
  );

  const handleScrollEndDrag = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (disabled || isEditing) {
        return;
      }

      updateFromScrollOffset(event.nativeEvent.contentOffset.y);
      const velocityY = event.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocityY) < 0.05) {
        isWheelInteractingRef.current = false;
      }
    },
    [disabled, isEditing, updateFromScrollOffset],
  );

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

  const wheelClassName = disabled
    ? 'overflow-hidden rounded-xl border border-border bg-muted'
    : 'overflow-hidden rounded-xl border border-border bg-card';
  const shadeClassName = disabled ? 'bg-muted/80' : 'bg-card/80';

  return (
    <Box
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={unitLabel ? `Number picker, ${unitLabel}` : 'Number picker'}
      accessibilityState={{ disabled }}
      accessibilityValue={{
        min,
        max,
        now: displayValue,
        text: unitLabel ? `${formatNumber(displayValue, step)} ${unitLabel}` : formatNumber(displayValue, step),
      }}
    >
      <Box testID={`${testID}-wheel`} className={wheelClassName} style={[styles.wheel, { height: layout.wheelHeight }]}>
        <ScrollView
          ref={scrollViewRef}
          testID={`${testID}-wheel-list`}
          contentOffset={initialContentOffset}
          onScroll={handleWheelScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollBegin={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={finishWheelScroll}
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
        <Box pointerEvents="none" style={[styles.topShade, { height: layout.centerPadding }]} className={shadeClassName} />
        <Box pointerEvents="none" style={[styles.bottomShade, { height: layout.centerPadding }]} className={shadeClassName} />
        <Box pointerEvents="none" style={[styles.selectionFrame, { top: layout.centerPadding }]} className="border-y border-primary/30 bg-primary/10" />
        <Box pointerEvents="none" style={[styles.selectionRail, { top: layout.centerPadding + 8 }]} className="bg-primary" />
        <Pressable
          testID={`${testID}-input-trigger`}
          accessibilityRole="button"
          accessibilityLabel="Enter number"
          disabled={disabled}
          onPress={handleInputPress}
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
                  onChangeText={handleDraftChange}
                  onSubmitEditing={commitDraft}
                  onBlur={commitDraft}
                  keyboardType={inputValueType === 'float' ? 'decimal-pad' : 'number-pad'}
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
      </Box>
    </Box>
  );
}

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
