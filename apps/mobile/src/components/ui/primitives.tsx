import React, { forwardRef } from 'react';
import { Text as RNText, TextProps as RNTextProps, View, ViewProps } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

const stackSpaceClass = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
} as const;

type ClassNameProp = {
  className?: string;
};

type StackProps = ViewProps &
  ClassNameProp & {
    gap?: number;
    space?: keyof typeof stackSpaceClass;
  };

const stackSpaceByGap = new Map<number, keyof typeof stackSpaceClass>([
  [0, 'none'],
  [3, 'xs'],
  [4, 'xs'],
  [5, 'xs'],
  [6, 'sm'],
  [7, 'sm'],
  [8, 'sm'],
  [10, 'md'],
  [12, 'md'],
  [14, 'lg'],
  [16, 'lg'],
]);

const stackStyles = tva({
  base: 'flex',
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    space: stackSpaceClass,
  },
});

const getStackSpace = (space?: keyof typeof stackSpaceClass, gap?: number) => {
  if (space) {
    return space;
  }

  return typeof gap === 'number' ? stackSpaceByGap.get(gap) : undefined;
};

export const Box = forwardRef<React.ElementRef<typeof View>, ViewProps & ClassNameProp>((props, ref) => {
  const { className, ...viewProps } = props;

  return <View {...viewProps} ref={ref} className={className} />;
});

Box.displayName = 'Box';

export const HStack = forwardRef<React.ElementRef<typeof View>, StackProps>(
  ({ className, gap, space, style, ...props }, ref) => {
    return (
      <View
        {...props}
        ref={ref}
        className={stackStyles({ direction: 'row', space: getStackSpace(space, gap), class: className })}
        style={style}
      />
    );
  },
);

HStack.displayName = 'HStack';

export const VStack = forwardRef<React.ElementRef<typeof View>, StackProps>(
  ({ className, gap, space, style, ...props }, ref) => {
    return (
      <View
        {...props}
        ref={ref}
        className={stackStyles({ direction: 'column', space: getStackSpace(space, gap), class: className })}
        style={style}
      />
    );
  },
);

VStack.displayName = 'VStack';

export const Text = forwardRef<React.ElementRef<typeof RNText>, RNTextProps & ClassNameProp>((props, ref) => {
  const { className, ...textProps } = props;

  return <RNText {...textProps} ref={ref} className={className} />;
});

Text.displayName = 'Text';
