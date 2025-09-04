#!/usr/bin/env node
import { Command } from "commander";
import { promises as fs } from "fs";
import * as path from "path";

const program = new Command();

program
  .name("update-version")
  .description("Update version in package.json and default.nix")
  .argument("<version>", "New version to set")
  .action(async (version) => {
    const rootDir = process.cwd();

    const files = [
      {
        file: path.join(rootDir, "package.json"),
        update: (content) => {
          const pkg = JSON.parse(content);
          pkg.version = version;
          return JSON.stringify(pkg, null, 2) + "\n";
        },
      },
      {
        file: path.join(rootDir, "default.nix"),
        update: (content) =>
          content.replace(/version\s*=\s*".*?"/, `version = "${version}"`),
      },
    ];

    for (const f of files) {
      try {
        const content = await fs.readFile(f.file, "utf8");
        const newContent = f.update(content);
        await fs.writeFile(f.file, newContent, "utf8");
        console.log(`Updated version in ${f.file}`);
      } catch (err) {
        console.error(`Failed to update ${f.file}:`, err);
      }
    }
  });

program.parse(process.argv);
