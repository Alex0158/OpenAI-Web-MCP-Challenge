import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const roots = ["src", "test"];
const files = [];
for (const root of roots) {
  for (const entry of await readdir(new URL(`../${root}/`, import.meta.url))) {
    if (entry.endsWith(".mjs")) files.push(resolve(import.meta.dirname, "..", root, entry));
  }
}

for (const filename of files.sort()) {
  await new Promise((resolveCheck, rejectCheck) => {
    const child = spawn(process.execPath, ["--check", filename], { stdio: "inherit" });
    child.once("error", rejectCheck);
    child.once("exit", (code, signal) => {
      if (code === 0 && signal === null) resolveCheck();
      else rejectCheck(new Error(`Syntax check failed for ${filename}`));
    });
  });
}

process.stdout.write(`Syntax checked ${files.length} reference-system modules.\n`);
