function resolveProjectLabel({ activeScope, mode, activeProject }) {
  if (activeScope === "os") return "NEXUS OS";
  if (mode === "demo") return activeProject || "DemoApp";
  return activeProject && activeProject !== "DemoApp" ? activeProject : "Private Project";
}

export function ProjectSwitcher({
  activeScope = "project",
  mode = "local-private",
  activeProject = "Private Project",
}) {
  const projectLabel = resolveProjectLabel({ activeScope, mode, activeProject });
  const scopeLabel = activeScope === "os"
    ? "NEXUS OS"
    : activeScope.charAt(0).toUpperCase() + activeScope.slice(1);

  return (
    <section className="ccv2-project-switcher" aria-label="Project context">
      <div>
        <div className="ccv2-project-switcher__label">Active Project</div>
        <div className="ccv2-project-switcher__value">{projectLabel}</div>
      </div>
      <div className="ccv2-project-switcher__chips">
        <span className="ccv2-pill ccv2-pill--pass">Scope: {scopeLabel}</span>
        <span className="ccv2-pill ccv2-pill--disabled">Mode: {mode}</span>
        {activeScope === "portfolio" && (
          <span className="ccv2-pill ccv2-pill--pending">Project Registry planned</span>
        )}
      </div>
    </section>
  );
}
