import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { diveTheme } from './components/ui/theme';

type ProvidersProps = {
  children?: React.ReactNode;
};

export default function Providers(props: ProvidersProps): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={diveTheme.colors.background} />
      {props.children}
    </SafeAreaProvider>
  );
}
