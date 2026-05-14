const SCOPE_OPTIONS = [
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Portfolio view is planned with Project Registry in P42.",
    disabled: false,
  },
  {
    id: "project",
    label: "Project",
    description: "Active private project command context.",
    disabled: false,
  },
  {
    id: "os",
    label: "NEXUS OS",
    description: "Platform roadmap and operating-system scope.",
    disabled: false,
  },
];

export function ScopeSwitcher({ activeScope = "project", mode = "local-private", onScopeChange }) {
  return (
    <section className="ccv2-scope-switcher" aria-label="Command Center scope">
      <div className="ccv2-scope-switcher__meta">
        <span className="ccv2-scope-switcher__label">Scope</span>
        <span className="ccv2-scope-switcher__mode">{mode}</span>
      </div>
      <div className="ccv2-scope-switcher__options" role="group" aria-label="Scope selector">
        {SCOPE_OPTIONS.map((scope) => {
          const selected = scope.id === activeScope;
          return (
            <button
              key={scope.id}
              type="button"
              className={`ccv2-scope-switcher__button${selected ? " ccv2-scope-switcher__button--active" : ""}`}
              aria-pressed={selected}
              title={scope.description}
              onClick={() => onScopeChange?.(scope.id)}
            >
              {scope.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { SCOPE_OPTIONS };
