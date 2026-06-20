import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  View,
  ViewProps,
  StyleSheet,
} from 'react-native';

type StackProps = ViewProps & {
  gap?: number;
};

const createStackStyle = (direction: 'row' | 'column', gap?: number) =>
  StyleSheet.flatten([
    {
      flexDirection: direction,
      gap,
    },
  ]);

export const Box = forwardRef<React.ElementRef<typeof View>, ViewProps>((props, ref) => {
  return <View {...props} ref={ref} />;
});

Box.displayName = 'Box';

export const HStack = forwardRef<React.ElementRef<typeof View>, StackProps>(({ gap, style, ...props }, ref) => {
  return <View {...props} ref={ref} style={[createStackStyle('row', gap), style]} />;
});

HStack.displayName = 'HStack';

export const VStack = forwardRef<React.ElementRef<typeof View>, StackProps>(({ gap, style, ...props }, ref) => {
  return <View {...props} ref={ref} style={[createStackStyle('column', gap), style]} />;
});

VStack.displayName = 'VStack';

export const Text = forwardRef<React.ElementRef<typeof RNText>, RNTextProps>((props, ref) => {
  return <RNText {...props} ref={ref} />;
});

Text.displayName = 'Text';
