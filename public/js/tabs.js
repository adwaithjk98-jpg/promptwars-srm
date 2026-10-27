/**
 * Accessible tabs: click or use arrow keys / Home / End to move between panels.
 * Markup: buttons with role="tab" and aria-controls, panels with role="tabpanel".
 */
export function initializeTabs(tabListElement, { onChange } = {}) {
  const tabs = [...tabListElement.querySelectorAll('[role="tab"]')];

  function selectTab(selectedTab, { moveFocus = false } = {}) {
    for (const tab of tabs) {
      const isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !isSelected;
    }
    if (moveFocus) {
      selectedTab.focus();
    }
    onChange?.(selectedTab.dataset.tab);
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      const currentIndex = tabs.indexOf(tab);
      const keyToIndex = {
        ArrowRight: (currentIndex + 1) % tabs.length,
        ArrowLeft: (currentIndex - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (event.key in keyToIndex) {
        event.preventDefault();
        selectTab(tabs[keyToIndex[event.key]], { moveFocus: true });
      }
    });
  }

  selectTab(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0]);
  return {
    selectTabByName(name) {
      const tab = tabs.find((candidate) => candidate.dataset.tab === name);
      if (tab) {
        selectTab(tab);
      }
    },
  };
}
