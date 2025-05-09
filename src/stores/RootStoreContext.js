import React, { createContext, useContext } from 'react';
import { rootStore } from '../models/RootStore';

const RootStoreContext = createContext(rootStore);

export const RootStoreProvider = ({ children }) => (
  <RootStoreContext.Provider value={rootStore}>
    {children}
  </RootStoreContext.Provider>
);

export const useRootStore = () => useContext(RootStoreContext);