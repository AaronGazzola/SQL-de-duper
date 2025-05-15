"use client";
import { ReactNode, useEffect } from "react";
import { useStore } from "./store";

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  const { updateParseResults } = useStore();

  // Initialize store with data from localStorage if available
  useEffect(() => {
    const storedResults = localStorage.getItem("parseResults");
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        updateParseResults(parsedResults);
      } catch (error) {
        console.error("Failed to parse stored results:", error);
      }
    }
  }, [updateParseResults]);

  return <>{children}</>;
}
