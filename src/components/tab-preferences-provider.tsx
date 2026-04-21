import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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

  const value = useMemo<TabPreferencesContextValue>(
    () => ({
      preferences,
      setPreference: (syncKey, nextValue) => {
        setPreferences((current) => ({
          ...current,
          [syncKey]: nextValue,
        }));
      },
    }),
    [preferences],
  );

  return <TabPreferencesContext.Provider value={value}>{children}</TabPreferencesContext.Provider>;
}

export function useTabPreferences() {
  return useContext(TabPreferencesContext);
}
