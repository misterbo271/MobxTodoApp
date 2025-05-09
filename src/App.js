import React from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { RootStoreProvider } from './stores/RootStoreContext';

const App = () => {
  return (
    <RootStoreProvider>
      <HomeScreen />
    </RootStoreProvider>
  );
};

export default App;