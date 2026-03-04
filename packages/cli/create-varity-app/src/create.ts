import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import { type PackageManager, getInstallCommand } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VARITY_PACKAGE_VERSION = "^2.0.0-alpha.1";

const WORKSPACE_DEPS: Record<string, string> = {
  "@varity-labs/sdk": VARITY_PACKAGE_VERSION,
  "@varity-labs/types": VARITY_PACKAGE_VERSION,
  "@varity-labs/ui-kit": VARITY_PACKAGE_VERSION,
};

const EXCLUDED_FILES = new Set([
  ".env.local",
  ".env.development.local",
  ".env.production.local",
]);

function getTemplateDir(): string {
  return path.resolve(__dirname, "..", "template");
}

function rewritePackageJson(
  content: Record<string, unknown>,
  projectName: string
): Record<string, unknown> {
  const pkg = { ...content };
  pkg.name = projectName;
  pkg.version = "0.1.0";

  // Convert workspace:^ deps to real versions
  for (const depKey of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[depKey] as Record<string, string> | undefined;
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (
        typeof version === "string" &&
        version.startsWith("workspace:")
      ) {
        deps[name] = WORKSPACE_DEPS[name] || VARITY_PACKAGE_VERSION;
      }
    }
  }

  // Remove monorepo-specific scripts
  const scripts = pkg.scripts as Record<string, string> | undefined;
  if (scripts) {
    delete scripts.prepare; // husky install — not needed outside monorepo
  }

  return pkg;
}

export async function createApp(
  projectName: string,
  packageManager: PackageManager
): Promise<void> {
  const targetDir = path.resolve(process.cwd(), projectName);
  const templateDir = getTemplateDir();

  // Check template exists
  if (!fs.existsSync(templateDir)) {
    console.error(
      chalk.red(
        "Error: Template not found. This is a bug — please report it at https://github.com/varity-labs/varity-sdk/issues"
      )
    );
    process.exit(1);
  }

  // Check target doesn't already exist
  if (fs.existsSync(targetDir)) {
    console.error(
      chalk.red(`Error: Directory ${chalk.bold(projectName)} already exists.`)
    );
    process.exit(1);
  }

  console.log();
  console.log(`  Creating ${chalk.bold(projectName)}...`);
  console.log();

  // Copy template
  const copySpinner = ora("  Copying template").start();
  try {
    await fs.copy(templateDir, targetDir, {
      filter: (src: string) => {
        const basename = path.basename(src);
        if (EXCLUDED_FILES.has(basename)) return false;
        if (basename === "node_modules") return false;
        if (basename === ".next") return false;
        return true;
      },
    });

    // Rename gitignore → .gitignore (npm strips .gitignore from tarballs)
    const gitignoreSrc = path.join(targetDir, "gitignore");
    const gitignoreDst = path.join(targetDir, ".gitignore");
    if (fs.existsSync(gitignoreSrc) && !fs.existsSync(gitignoreDst)) {
      await fs.rename(gitignoreSrc, gitignoreDst);
    }

    // Rewrite package.json
    const pkgPath = path.join(targetDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkgContent = await fs.readJson(pkgPath);
      const rewritten = rewritePackageJson(pkgContent, projectName);
      await fs.writeJson(pkgPath, rewritten, { spaces: 2 });
    }

    copySpinner.succeed("  Template copied");
  } catch (err) {
    copySpinner.fail("  Failed to copy template");
    throw err;
  }

  // Install dependencies
  const installCmd = getInstallCommand(packageManager);
  const installSpinner = ora(`  Installing dependencies (${packageManager})`).start();
  try {
    execSync(installCmd, {
      cwd: targetDir,
      stdio: "pipe",
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" },
    });
    installSpinner.succeed("  Dependencies installed");
  } catch {
    installSpinner.warn(
      `  Could not install dependencies. Run ${chalk.cyan(`cd ${projectName} && ${installCmd}`)} manually.`
    );
  }

  // Init git
  try {
    execSync("git init", { cwd: targetDir, stdio: "pipe" });
    execSync("git add -A", { cwd: targetDir, stdio: "pipe" });
    execSync('git commit -m "Initial commit from create-varity-app"', {
      cwd: targetDir,
      stdio: "pipe",
    });
  } catch {
    // git not available or init failed — not critical
  }

  // Success output
  console.log();
  console.log(
    chalk.green("  Success!") + ` Created ${chalk.bold(projectName)}`
  );
  console.log();
  console.log("  Next steps:");
  console.log();
  console.log(chalk.cyan(`    cd ${projectName}`));
  console.log(
    chalk.cyan(
      `    ${packageManager === "npm" ? "npm run" : packageManager} dev`
    ) + "        Start development server"
  );
  console.log(
    chalk.cyan(
      `    ${packageManager === "npm" ? "npm run" : packageManager} build`
    ) + "      Build for production"
  );
  console.log();
  console.log("  Deploy when ready:");
  console.log();
  console.log(chalk.cyan("    pip install varitykit"));
  console.log(chalk.cyan("    varitykit app deploy"));
  console.log();
  console.log(`  Docs:  ${chalk.underline("https://docs.varity.so")}`);
  console.log(`  Help:  ${chalk.underline("https://discord.gg/varity")}`);
  console.log();
}
