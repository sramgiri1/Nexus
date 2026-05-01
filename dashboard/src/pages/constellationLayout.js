export const STAGE_WIDTH = 1440;
export const STAGE_HEIGHT = 980;
export const SUN_CENTER = { x: 720, y: 490 };
export const SUN_RADIUS = 74;

export const TEAM_LAYOUT = {
  strategy: { x: 720, y: 220 },
  product: { x: 1018, y: 362 },
  platform: { x: 1018, y: 618 },
  verification: { x: 720, y: 760 },
  growth: { x: 422, y: 618 },
  observability: { x: 422, y: 362 },
};

export const TEAM_CARD = { width: 168, height: 126 };
export const AGENT_CARD = { width: 84, height: 46 };
export const POPUP_SIZE = { width: 320, height: 192 };

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function orbitNodeColor(status) {
  if (status === "blocked") return "var(--red)";
  if (status === "working") return "var(--amber)";
  if (status === "done") return "var(--green)";
  return "var(--blue)";
}

export function toStagePercent(x, y) {
  return {
    left: `${(x / STAGE_WIDTH) * 100}%`,
    top: `${(y / STAGE_HEIGHT) * 100}%`,
  };
}

export function getOutwardAngle(teamLayout) {
  return Math.atan2(teamLayout.y - SUN_CENTER.y, teamLayout.x - SUN_CENTER.x);
}

export function getAgentSpread(total) {
  if (total <= 1) return 0;
  if (total === 2) return 50;
  if (total === 3) return 82;
  if (total === 4) return 112;
  return 136;
}

export function getRingSize(total) {
  if (total >= 5) return { rx: 180, ry: 136 };
  if (total === 4) return { rx: 170, ry: 128 };
  if (total === 3) return { rx: 160, ry: 120 };
  return { rx: 150, ry: 112 };
}

export function getTeamRing(total) {
  const { rx, ry } = getRingSize(total);
  return {
    width: rx * 2,
    height: ry * 2,
  };
}

export function getAgentAbsolutePosition(teamLayout, total, index) {
  const { rx, ry } = getRingSize(total);
  const outward = getOutwardAngle(teamLayout);
  const spread = getAgentSpread(total);
  const start = -spread / 2;
  const step = total > 1 ? spread / (total - 1) : 0;
  const angle = outward + toRadians(start + step * index);

  return {
    x: teamLayout.x + Math.cos(angle) * rx,
    y: teamLayout.y + Math.sin(angle) * ry,
  };
}

export function getAgentPosition(teamLayout, total, index) {
  return getAgentAbsolutePosition(teamLayout, total, index);
}

export function getClusterOrigin(teamLayout) {
  const ring = getTeamRing(5);
  return {
    x: teamLayout.x - ring.width / 2,
    y: teamLayout.y - ring.height / 2,
  };
}

export function sunConnector(teamLayout) {
  const dx = teamLayout.x - SUN_CENTER.x;
  const dy = teamLayout.y - SUN_CENTER.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: SUN_CENTER.x + (dx / length) * (SUN_RADIUS + 8),
    y: SUN_CENTER.y + (dy / length) * (SUN_RADIUS + 8),
  };
}

export function teamConnector(teamLayout) {
  const dx = SUN_CENTER.x - teamLayout.x;
  const dy = SUN_CENTER.y - teamLayout.y;
  const length = Math.hypot(dx, dy) || 1;
  const halfWidth = TEAM_CARD.width / 2;
  const halfHeight = TEAM_CARD.height / 2;
  const scale = Math.min(
    halfWidth / Math.max(Math.abs(dx / length), 0.001),
    halfHeight / Math.max(Math.abs(dy / length), 0.001)
  );

  return {
    x: teamLayout.x + (dx / length) * scale,
    y: teamLayout.y + (dy / length) * scale,
  };
}

export function linePath(from, to) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(34, Math.max(14, length * 0.045));
  const curveX = midX + (-dy / length) * bend;
  const curveY = midY + (dx / length) * bend;
  return `M ${from.x} ${from.y} Q ${curveX} ${curveY} ${to.x} ${to.y}`;
}

export function getPopupPosition(anchor) {
  const margin = 24;
  let left = anchor.x + 52;
  let top = anchor.y - POPUP_SIZE.height / 2;

  if (anchor.x > STAGE_WIDTH * 0.62) {
    left = anchor.x - POPUP_SIZE.width - 52;
  }

  if (anchor.y < STAGE_HEIGHT * 0.26) {
    top = anchor.y + 44;
  } else if (anchor.y > STAGE_HEIGHT * 0.74) {
    top = anchor.y - POPUP_SIZE.height - 44;
  }

  left = clamp(left, margin, STAGE_WIDTH - POPUP_SIZE.width - margin);
  top = clamp(top, margin, STAGE_HEIGHT - POPUP_SIZE.height - margin);

  return { left, top };
}
