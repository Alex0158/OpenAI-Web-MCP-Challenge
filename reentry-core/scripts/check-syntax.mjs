import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const sourceDirectories = ["src", "test", "conformance", "bench", "scripts"];

async function collectModules(directory) {
  const modules = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      modules.push(...(await collectModules(path)));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      modules.push(path);
    }
  }
  return modules;
}

const modules = [];
for (const directory of sourceDirectories) {
  modules.push(...(await collectModules(resolve(root, directory))));
}
modules.sort();

for (const modulePath of modules) {
  const result = spawnSync(process.execPath, ["--check", modulePath], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

console.log(
  JSON.stringify({
    check: "reentry-core-syntax",
    status: "passed",
    modules: modules.length,
    root: relative(process.cwd(), root) || ".",
  }),
);
