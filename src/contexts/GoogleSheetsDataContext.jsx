import React, { createContext, useContext } from 'react';
import { useGoogleSheetsData } from '../hooks/useGoogleSheetsData';

// GoogleSheetsDataContextはprogressSheetも含め全データを一元管理
const GoogleSheetsDataContext = createContext();

export const GoogleSheetsDataProvider = ({ children }) => {
  const data = useGoogleSheetsData();
  return (
    <GoogleSheetsDataContext.Provider value={data}>
      {children}
    </GoogleSheetsDataContext.Provider>
  );
};

export const useGoogleSheetsDataContext = () => useContext(GoogleSheetsDataContext); 