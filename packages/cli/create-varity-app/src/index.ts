#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import { createApp } from "./create.js";
import { validateProjectName, detectPackageManager } from "./utils.js";
import fs from "fs";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8")
);

const program = new Command();

program
  .name("create-varity-app")
  .description("Create a production-ready app with auth, database, and payments built in")
  .version(packageJson.version)
  .argument("[app-name]", "Name of the app to create")
  .action(async (appName?: string) => {
    console.log();
    console.log(chalk.bold("  create-varity-app"));
    console.log();

    let projectName = appName;

    // Prompt for name if not provided
    if (!projectName) {
      const response = await prompts(
        {
          type: "text",
          name: "name",
          message: "What is your app named?",
          initial: "my-app",
          validate: (value: string) => {
            const result = validateProjectName(value);
            return result.valid ? true : result.error || "Invalid name";
          },
        },
        { onCancel: () => process.exit(0) }
      );

      projectName = response.name;
      if (!projectName) process.exit(0);
    }

    // Validate the name
    const validation = validateProjectName(projectName);
    if (!validation.valid) {
      console.error(chalk.red(`  Invalid project name: ${validation.error}`));
      process.exit(1);
    }

    const packageManager = detectPackageManager();
    await createApp(projectName, packageManager);
  });

program.parse();
