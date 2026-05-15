import registry from "./registry.json" with { type: "json" };
import { summarizeSkillRegistry, validateSkillRegistry } from "./skillSchema.js";

export function getSkillRegistry() {
  return registry.skills.map((skill) => ({ ...skill }));
}

export function getSkillById(skillId) {
  return getSkillRegistry().find((skill) => skill.skillId === skillId) || null;
}

export function listSkillCategories() {
  return [...new Set(getSkillRegistry().map((skill) => skill.category))].sort();
}

export function validateRegisteredSkills(skills = getSkillRegistry()) {
  return validateSkillRegistry(skills);
}

export function summarizeRegisteredSkills(skills = getSkillRegistry()) {
  return summarizeSkillRegistry(skills);
}
