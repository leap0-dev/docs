import { useLocation } from '@tanstack/react-router';
import { SidebarTabsDropdown } from 'fumadocs-ui/components/sidebar/tabs/dropdown';
import { referenceTabs } from '@/lib/layout.shared';

function matchesPrefix(url: string, prefix: string) {
  return url === prefix || url.startsWith(`${prefix}/`);
}

export function SidebarReferenceDropdown() {
  const { pathname } = useLocation();

  const options = referenceTabs.map((tab) => {
    if (tab.title === 'API') {
      return matchesPrefix(pathname, '/api') ||
        matchesPrefix(pathname, '/code-interpreter/api') ||
        matchesPrefix(pathname, '/desktop/api') ||
        matchesPrefix(pathname, '/metadata-service/api')
        ? { ...tab, urls: new Set([pathname]) }
        : tab;
    }

    if (tab.title === 'Core') {
      return !matchesPrefix(pathname, '/reference') &&
        !matchesPrefix(pathname, '/api') &&
        !matchesPrefix(pathname, '/code-interpreter/api') &&
        !matchesPrefix(pathname, '/desktop/api') &&
        !matchesPrefix(pathname, '/metadata-service/api')
        ? { ...tab, urls: new Set([pathname]) }
        : tab;
    }

    return tab;
  });

  return <SidebarTabsDropdown options={options} className="w-full" />;
}
