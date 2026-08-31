import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runNpm(arguments_) {
  return spawnSync(npmCommand, arguments_, {
    cwd: root,
    encoding: "utf8",
  });
}

const dependencyResult = runNpm(["ls", "--omit=dev", "--all", "--json"]);
if (dependencyResult.status !== 0) {
  process.stderr.write(dependencyResult.stdout);
  process.stderr.write(dependencyResult.stderr);
  process.exit(dependencyResult.status ?? 1);
}

let dependencyTree;
try {
  dependencyTree = JSON.parse(dependencyResult.stdout);
} catch (error) {
  console.error(`Dependency output was not valid JSON: ${error.message}`);
  process.exit(1);
}

const runtimeDependencies = Object.keys(dependencyTree.dependencies ?? {});
const dependencyProblems = dependencyTree.problems ?? [];

const result = runNpm(["pack", "--dry-run", "--json"]);

if (result.status !== 0) {
  process.stderr.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

let packResult;
try {
  [packResult] = JSON.parse(result.stdout);
} catch (error) {
  console.error(`Package dry-run output was not valid JSON: ${error.message}`);
  process.exit(1);
}

const files = new Set(packResult.files.map((file) => file.path));
const requiredFiles = new Set(["README.md", "package.json", "protocol/test-vectors/v0.1.json"]);
for (const target of Object.values(packageJson.exports)) {
  requiredFiles.add(target.replace(/^\.\//, ""));
}

const missing = [...requiredFiles].filter((path) => !files.has(path));
const forbidden = [...files].filter((path) =>
  ["bench/", "conformance/", "scripts/", "test/"].some((prefix) => path.startsWith(prefix)),
);

if (
  runtimeDependencies.length > 0 ||
  dependencyProblems.length > 0 ||
  missing.length > 0 ||
  forbidden.length > 0
) {
  console.error(
    JSON.stringify({
      check: "reentry-core-package-surface",
      status: "failed",
      runtime_dependencies: runtimeDependencies,
      dependency_problems: dependencyProblems,
      missing,
      forbidden,
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    check: "reentry-core-package-surface",
    status: "passed",
    runtime_dependencies: runtimeDependencies.length,
    files: files.size,
    packed_bytes: packResult.size,
    unpacked_bytes: packResult.unpackedSize,
  }),
);
