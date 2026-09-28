export type RoleAccessLevel = "standard" | "privileged";

export function normalizeRoleName(value: string): string {
  return value.trim().toLowerCase();
}

export function getRoleAccessLevel(name: string): RoleAccessLevel {
  return normalizeRoleName(name) === "admin" ? "privileged" : "standard";
}
