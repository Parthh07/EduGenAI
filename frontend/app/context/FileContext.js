"use client";
import { createContext, useContext, useState } from 'react';

const FileContext = createContext();

export function FileProvider({ children }) {
  const [globalFiles, setGlobalFiles] = useState([]);

  return (
    <FileContext.Provider value={{ globalFiles, setGlobalFiles }}>
      {children}
    </FileContext.Provider>
  );
}

export function useGlobalFile() {
  return useContext(FileContext);
}
