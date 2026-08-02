import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "evidnx.currentProjectId";

interface CurrentProjectContextValue {
  currentProjectId: number | null;
  setCurrentProjectId: (id: number) => void;
}

const CurrentProjectContext = createContext<CurrentProjectContextValue | null>(null);

export function CurrentProjectProvider({ children }: { children: ReactNode }) {
  const [currentProjectId, setCurrentProjectIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (currentProjectId !== null) localStorage.setItem(STORAGE_KEY, String(currentProjectId));
  }, [currentProjectId]);

  return (
    <CurrentProjectContext.Provider value={{ currentProjectId, setCurrentProjectId: setCurrentProjectIdState }}>
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject() {
  const ctx = useContext(CurrentProjectContext);
  if (!ctx) throw new Error("useCurrentProject must be used within CurrentProjectProvider");
  return ctx;
}
