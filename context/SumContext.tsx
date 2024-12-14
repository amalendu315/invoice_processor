"use client";

import { createContext, useState } from "react";

// Create a context for authentication
const SumContext = createContext({
  totalSum: 0,
  setTotalSum: (value: number) => {},
});

// Create a provider component
export const SumProvider = ({ children }: { children: React.ReactNode }) => {
  const [totalSum, setTotalSum] = useState(0);

  return (
    <SumContext.Provider value={{ totalSum, setTotalSum }}>
      {children}
    </SumContext.Provider>
  );
};

export default SumContext;
