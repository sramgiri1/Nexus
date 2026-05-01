import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  AGENT_CARD,
  POPUP_SIZE,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  SUN_CENTER,
  SUN_RADIUS,
  TEAM_CARD,
  TEAM_LAYOUT,
  getAgentAbsolutePosition,
  getOutwardAngle,
  getPopupPosition,
} from "./constellationLayout.js";

const TEAM_COUNTS = {
  strategy: 4,
  product: 5,
  platform: 3,
  verification: 3,
  growth: 3,
  observability: 1,
};

function intersects(a, b) {
  return !(
    a.right <= b.left ||
    b.right <= a.left ||
    a.bottom <= b.top ||
    b.bottom <= a.top
  );
}

function toRect(center) {
  return {
    left: center.x - AGENT_CARD.width / 2,
    right: center.x + AGENT_CARD.width / 2,
    top: center.y - AGENT_CARD.height / 2,
    bottom: center.y + AGENT_CARD.height / 2,
  };
}

function toTeamRect(center) {
  return {
    left: center.x - TEAM_CARD.width / 2,
    right: center.x + TEAM_CARD.width / 2,
    top: center.y - TEAM_CARD.height / 2,
    bottom: center.y + TEAM_CARD.height / 2,
  };
}

function toSunRect() {
  return {
    left: SUN_CENTER.x - SUN_RADIUS,
    right: SUN_CENTER.x + SUN_RADIUS,
    top: SUN_CENTER.y - SUN_RADIUS,
    bottom: SUN_CENTER.y + SUN_RADIUS,
  };
}

test("agents do not overlap within any team cluster", () => {
  for (const [teamId, count] of Object.entries(TEAM_COUNTS)) {
    const centers = Array.from({ length: count }, (_, index) =>
      getAgentAbsolutePosition(TEAM_LAYOUT[teamId], count, index)
    );

    for (let i = 0; i < centers.length; i += 1) {
      for (let j = i + 1; j < centers.length; j += 1) {
        assert.equal(
          intersects(toRect(centers[i]), toRect(centers[j])),
          false,
          `${teamId} agents ${i} and ${j} overlap`
        );
      }
    }
  }
});

test("agents do not overlap their team card", () => {
  for (const [teamId, count] of Object.entries(TEAM_COUNTS)) {
    const teamRect = toTeamRect(TEAM_LAYOUT[teamId]);
    const centers = Array.from({ length: count }, (_, index) =>
      getAgentAbsolutePosition(TEAM_LAYOUT[teamId], count, index)
    );

    for (const center of centers) {
      assert.equal(
        intersects(teamRect, toRect(center)),
        false,
        `${teamId} agent overlaps the team card`
      );
    }
  }
});

test("team cards do not overlap the nexus sun", () => {
  const sunRect = toSunRect();

  for (const [teamId, center] of Object.entries(TEAM_LAYOUT)) {
    assert.equal(
      intersects(sunRect, toTeamRect(center)),
      false,
      `${teamId} overlaps the sun`
    );
  }
});

test("agents stay on the outward side of their team", () => {
  for (const [teamId, count] of Object.entries(TEAM_COUNTS)) {
    const team = TEAM_LAYOUT[teamId];
    const outward = getOutwardAngle(team);
    const outwardVector = { x: Math.cos(outward), y: Math.sin(outward) };

    const centers = Array.from({ length: count }, (_, index) =>
      getAgentAbsolutePosition(team, count, index)
    );

    for (const center of centers) {
      const delta = { x: center.x - team.x, y: center.y - team.y };
      const dot = delta.x * outwardVector.x + delta.y * outwardVector.y;
      assert.ok(dot > 0, `${teamId} agent is not placed on the outer arc`);
    }
  }
});

test("agent positions remain inside the stage bounds", () => {
  for (const [teamId, count] of Object.entries(TEAM_COUNTS)) {
    const centers = Array.from({ length: count }, (_, index) =>
      getAgentAbsolutePosition(TEAM_LAYOUT[teamId], count, index)
    );

    for (const center of centers) {
      assert.ok(center.x > AGENT_CARD.width / 2, `${teamId} agent x clipped left`);
      assert.ok(center.x < STAGE_WIDTH - AGENT_CARD.width / 2, `${teamId} agent x clipped right`);
      assert.ok(center.y > AGENT_CARD.height / 2, `${teamId} agent y clipped top`);
      assert.ok(center.y < STAGE_HEIGHT - AGENT_CARD.height / 2, `${teamId} agent y clipped bottom`);
    }
  }
});

test("popup placement stays inside the stage and prefers the clicked side", () => {
  const leftAnchor = getAgentAbsolutePosition(TEAM_LAYOUT.observability, TEAM_COUNTS.observability, 0);
  const rightAnchor = getAgentAbsolutePosition(TEAM_LAYOUT.product, TEAM_COUNTS.product, 4);
  const topAnchor = TEAM_LAYOUT.strategy;
  const bottomAnchor = TEAM_LAYOUT.verification;

  const leftPopup = getPopupPosition(leftAnchor);
  const rightPopup = getPopupPosition(rightAnchor);
  const topPopup = getPopupPosition(topAnchor);
  const bottomPopup = getPopupPosition(bottomAnchor);

  for (const popup of [leftPopup, rightPopup, topPopup, bottomPopup]) {
    assert.ok(popup.left >= 20, "popup clipped left");
    assert.ok(popup.top >= 20, "popup clipped top");
    assert.ok(popup.left <= STAGE_WIDTH - POPUP_SIZE.width - 20, "popup clipped right");
    assert.ok(popup.top <= STAGE_HEIGHT - POPUP_SIZE.height - 20, "popup clipped bottom");
  }

  assert.ok(leftPopup.left > leftAnchor.x, "left-side popup should render to the right of its node");
  assert.ok(rightPopup.left + POPUP_SIZE.width < rightAnchor.x, "right-side popup should render to the left of its node");
  assert.ok(topPopup.top > topAnchor.y, "top popup should render below its node");
  assert.ok(bottomPopup.top + POPUP_SIZE.height < bottomAnchor.y, "bottom popup should render above its node");
});

test("verse route keeps overflow scrolling enabled for smaller viewports", () => {
  const cssPath = path.resolve(process.cwd(), "src/styles.css");
  const css = fs.readFileSync(cssPath, "utf8");
  assert.match(
    css,
    /\.shell-content--verse\s*\{[\s\S]*overflow:\s*auto;/,
    "shell-content--verse should allow scrolling when the stage exceeds the viewport"
  );
  assert.match(
    css,
    /\.orbit-stage--center\s*\{/,
    "orbit stage center styles should exist"
  );
});
