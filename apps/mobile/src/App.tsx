import React from 'react';
import './i18n';
import Providers from './providers';
import RootNavigation from './components/navigation';

export default function App(): React.JSX.Element {
  return (
    <Providers>
      <RootNavigation />
    </Providers>
  );
}
