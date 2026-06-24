import React from 'react';
import { KeyboardAvoidingView, Platform, type ScrollViewProps } from 'react-native';
import { ScrollView } from './scroll-view';

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  className?: string;
  contentContainerClassName?: string;
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScrollView({
  children,
  keyboardDismissMode,
  keyboardShouldPersistTaps,
  keyboardVerticalOffset = 0,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps): React.JSX.Element {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={{ flex: 1 }}>
      <ScrollView
        {...scrollViewProps}
        keyboardDismissMode={keyboardDismissMode ?? (Platform.OS === 'ios' ? 'interactive' : 'on-drag')}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
