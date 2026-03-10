import validatePkgName from "validate-npm-package-name";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProjectName(name: string): ValidationResult {
  const validation = validatePkgName(name);

  if (!validation.validForNewPackages) {
    const errors = [
      ...(validation.errors || []),
      ...(validation.warnings || []),
    ];
    return { valid: false, error: errors.join(", ") };
  }

  if (name.length === 0) {
    return { valid: false, error: "Project name cannot be empty" };
  }

  if (name.startsWith(".") || name.startsWith("_")) {
    return { valid: false, error: "Project name cannot start with . or _" };
  }

  return { valid: true };
}

export type PackageManager = "npm" | "pnpm" | "yarn";

export function detectPackageManager(): PackageManager {
  const agent = process.env.npm_config_user_agent || "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  return "npm";
}

export function getInstallCommand(pm: PackageManager): string {
  return pm === "yarn" ? "yarn" : `${pm} install`;
}
