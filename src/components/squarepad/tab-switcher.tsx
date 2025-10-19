import { Button } from '@/components/ui/button';
import type { TabId } from '@/types/squarepad';

type TabDefinition = {
  id: TabId;
  label: string;
  description: string;
};

type TabSwitcherProps = {
  tabs: TabDefinition[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function SquarePadTabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
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
            {tab.label}
          </Button>
        ))}
      </div>
      {active?.description ? <p className="text-sm text-muted-foreground">{active.description}</p> : null}
    </div>
  );
}
