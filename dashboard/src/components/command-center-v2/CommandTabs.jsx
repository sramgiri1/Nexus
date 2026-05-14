import { useEffect } from "react";

function getFirstEnabledTab(tabs) {
  return tabs.find((tab) => !tab.disabled) || tabs[0] || null;
}

export function CommandTabList({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = "Command Center sections",
}) {
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));

  function focusTabAt(index) {
    const nextTab = tabs[index];
    if (!nextTab) return;
    const tabButton = document.querySelector(`[data-command-tab-id="${nextTab.id}"]`);
    tabButton?.focus();
  }

  function handleKeyDown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    if (event.key === "Home") {
      focusTabAt(0);
      return;
    }
    if (event.key === "End") {
      focusTabAt(tabs.length - 1);
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + direction + tabs.length) % tabs.length;
    focusTabAt(nextIndex);
  }

  return (
    <div className="ccv2-command-tabs__list" role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            id={`ccv2-tab-${tab.id}`}
            role="tab"
            aria-selected={selected}
            aria-controls={`ccv2-tab-panel-${tab.id}`}
            aria-disabled={tab.disabled || undefined}
            data-command-tab-id={tab.id}
            className={`ccv2-command-tabs__button${selected ? " ccv2-command-tabs__button--active" : ""}${tab.disabled ? " ccv2-command-tabs__button--disabled" : ""}`}
            title={tab.disabled ? tab.disabledReason : tab.description}
            onClick={() => {
              if (!tab.disabled) onTabChange(tab.id);
            }}
          >
            <span className="ccv2-command-tabs__label">{tab.label}</span>
            {tab.badge && <span className="ccv2-command-tabs__badge">{tab.badge}</span>}
            {tab.disabled && <span className="ccv2-command-tabs__reason">{tab.disabledReason}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function CommandTabPanel({ tabId, activeTab, children }) {
  const selected = tabId === activeTab;

  return (
    <section
      id={`ccv2-tab-panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`ccv2-tab-${tabId}`}
      hidden={!selected}
      className="ccv2-command-tabs__panel"
    >
      {selected ? children : null}
    </section>
  );
}

export function CommandTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = "Command Center sections",
  children,
}) {
  const firstEnabled = getFirstEnabledTab(tabs);
  const resolvedActive = tabs.some((tab) => tab.id === activeTab && !tab.disabled)
    ? activeTab
    : firstEnabled?.id;

  useEffect(() => {
    if (resolvedActive && resolvedActive !== activeTab) {
      onTabChange(resolvedActive);
    }
  }, [activeTab, onTabChange, resolvedActive]);

  return (
    <div className="ccv2-command-tabs" data-command-tabs="true">
      <CommandTabList
        tabs={tabs}
        activeTab={resolvedActive}
        onTabChange={onTabChange}
        ariaLabel={ariaLabel}
      />
      <div className="ccv2-command-tabs__panels">{children}</div>
    </div>
  );
}
