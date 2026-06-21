import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider';

type ProvidersProps = {
  children?: React.ReactNode;
};

export default function Providers(props: ProvidersProps): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <StatusBar barStyle="dark-content" />
        {props.children}
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
