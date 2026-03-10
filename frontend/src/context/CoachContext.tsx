import { createContext, useContext, useState, type ReactNode } from "react";
import type { Coach } from "@/types";

interface CoachContextValue {
  activeCoach: Coach | null;
  setActiveCoach: (coach: Coach | null) => void;
}

const CoachContext = createContext<CoachContextValue | undefined>(undefined);

function readStoredCoach(): Coach | null {
  try {
    const raw = localStorage.getItem("activeCoach");
    return raw ? (JSON.parse(raw) as Coach) : null;
  } catch {
    return null;
  }
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const [activeCoach, setActiveCoachState] = useState<Coach | null>(
    readStoredCoach,
  );

  const setActiveCoach = (coach: Coach | null) => {
    if (coach) {
      localStorage.setItem("activeCoach", JSON.stringify(coach));
    } else {
      localStorage.removeItem("activeCoach");
    }
    setActiveCoachState(coach);
  };

  return (
    <CoachContext.Provider value={{ activeCoach, setActiveCoach }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoachContext() {
  const ctx = useContext(CoachContext);
  if (!ctx) {
    throw new Error("useCoachContext must be used within a CoachProvider");
  }
  return ctx;
}
