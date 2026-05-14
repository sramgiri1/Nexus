import { getCommandCenterHelpLink } from "../../data/commandCenterHelpLinks.js";

export function HelpLink({ routeKey, label, docPath, description }) {
  const help = routeKey ? getCommandCenterHelpLink(routeKey) : {};
  const resolvedLabel = label || help.label || "Command Center Guide";
  const resolvedDocPath = docPath || help.docPath || "docs/usage/COMMAND_CENTER_GUIDE.md";
  const resolvedDescription = description || help.description || "Read local operator guidance for this page.";

  return (
    <div className="ccv2-help-link" title={`${resolvedLabel}: ${resolvedDocPath}`}>
      <span className="ccv2-help-link__eyebrow">Guide</span>
      <span className="ccv2-help-link__label">{resolvedLabel}</span>
      <span className="ccv2-help-link__path">{resolvedDocPath}</span>
      <span className="ccv2-help-link__description">{resolvedDescription}</span>
    </div>
  );
}
