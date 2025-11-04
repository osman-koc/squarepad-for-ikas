'use client';

import { Button } from '@/components/ui/button';
import type { TabId } from '@/types/squarepad';
import { useTranslations } from 'next-intl';

type TabDefinition = {
  id: TabId;
};

type TabSwitcherProps = {
  tabs: TabDefinition[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function SquarePadTabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  const t = useTranslations('squarepad.tabs');
  
  const active = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {t(`${tab.id}.label`)}
          </Button>
        ))}
      </div>
      {active ? <p className="text-sm text-muted-foreground">{t(`${active.id}.description`)}</p> : null}
    </div>
  );
}
