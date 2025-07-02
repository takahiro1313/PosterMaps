import React, { createContext, useContext, useEffect, useState } from 'react';

const ProgressSheetContext = createContext();

export const ProgressSheetProvider = ({ children }) => {
  const [progressSheet, setProgressSheet] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sheets-api?sheet=progress')
      .then(res => res.json())
      .then(data => {
        setProgressSheet(data);
        setLoading(false);
      });
  }, []);

  return (
    <ProgressSheetContext.Provider value={{ progressSheet, loading }}>
      {children}
    </ProgressSheetContext.Provider>
  );
};

export const useProgressSheet = () => useContext(ProgressSheetContext); 