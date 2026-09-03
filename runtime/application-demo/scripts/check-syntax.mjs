import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const files = [];
await collect(new URL("../src/", import.meta.url));
await collect(new URL("../test/", import.meta.url));

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

process.stdout.write(`Syntax checked ${files.length} application-demo modules.\n`);

async function collect(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  for (const entry of entries) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directoryUrl);
    if (entry.isDirectory()) await collect(entryUrl);
    else if (entry.name.endsWith(".mjs")) files.push(resolve(entryUrl.pathname));
  }
}
