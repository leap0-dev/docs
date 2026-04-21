export const TAB_PREFERENCE_COOKIE_PREFIX = 'leap0_tab_';

export function getTabPreferenceCookieName(syncKey: string) {
  return `${TAB_PREFERENCE_COOKIE_PREFIX}${encodeURIComponent(syncKey)}`;
}

export function parseTabPreferences(cookies: Record<string, string>) {
  const preferences: Record<string, string> = {};

  for (const [name, value] of Object.entries(cookies)) {
    if (!name.startsWith(TAB_PREFERENCE_COOKIE_PREFIX)) continue;

    const syncKey = decodeURIComponent(name.slice(TAB_PREFERENCE_COOKIE_PREFIX.length));
    preferences[syncKey] = decodeURIComponent(value);
  }

  return preferences;
}
