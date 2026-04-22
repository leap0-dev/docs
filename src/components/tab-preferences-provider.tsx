import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type TabPreferencesContextValue = {
  preferences: Record<string, string>;
  setPreference: (syncKey: string, value: string) => void;
};

const TabPreferencesContext = createContext<TabPreferencesContextValue | null>(null);

export function TabPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: Record<string, string>;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const setPreference = useCallback((syncKey: string, nextValue: string) => {
    setPreferences((current) => ({
      ...current,
      [syncKey]: nextValue,
    }));
  }, []);

  const value = useMemo<TabPreferencesContextValue>(
    () => ({
      preferences,
      setPreference,
    }),
    [preferences, setPreference],
  );

  return <TabPreferencesContext.Provider value={value}>{children}</TabPreferencesContext.Provider>;
}

export function useTabPreferences() {
  const context = useContext(TabPreferencesContext);
  if (!context) {
    throw new Error("useTabPreferences must be used within a TabPreferencesProvider");
  }

  return context;
}
