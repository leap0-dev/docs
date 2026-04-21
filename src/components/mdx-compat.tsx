import { Children, isValidElement, useMemo, type ReactNode } from 'react';
import { TabsContent, TabsList, TabsTrigger } from 'fumadocs-ui/components/tabs';
import { Tabs as UITabs } from 'fumadocs-ui/components/ui/tabs';
import { getTabPreferenceCookieName } from '@/lib/tab-preferences';
import { useTabPreferences } from './tab-preferences-provider';

type LegacyTabsProps = {
  syncKey?: string;
  children: ReactNode;
};

type LegacyTabItemProps = {
  label: string;
  children: ReactNode;
};

export function TabItem({ children }: LegacyTabItemProps) {
  return <>{children}</>;
}

export function Tabs({ syncKey, children }: LegacyTabsProps) {
  const items = Children.toArray(children).filter(isValidElement<LegacyTabItemProps>);
  const labels = useMemo(() => items.map((item) => item.props.label), [items]);
  const tabPreferences = useTabPreferences();

  if (syncKey && tabPreferences) {
    const value = tabPreferences.preferences[syncKey] && labels.includes(tabPreferences.preferences[syncKey])
      ? tabPreferences.preferences[syncKey]
      : labels[0];

    return (
      <UITabs
        value={value}
        onValueChange={(nextValue) => {
          tabPreferences.setPreference(syncKey, nextValue);
          document.cookie = `${getTabPreferenceCookieName(syncKey)}=${encodeURIComponent(nextValue)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        }}
        className="flex flex-col overflow-hidden rounded-xl border bg-fd-secondary my-4"
      >
        <TabsList>
          {labels.map((label) => (
            <TabsTrigger key={label} value={label}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item) => (
          <TabsContent key={item.props.label} value={item.props.label}>
            {item.props.children}
          </TabsContent>
        ))}
      </UITabs>
    );
  }

  return (
    <UITabs defaultValue={labels[0]} className="flex flex-col overflow-hidden rounded-xl border bg-fd-secondary my-4">
      <TabsList>
        {labels.map((label) => (
          <TabsTrigger key={label} value={label}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.props.label} value={item.props.label}>
          {item.props.children}
        </TabsContent>
      ))}
    </UITabs>
  );
}
