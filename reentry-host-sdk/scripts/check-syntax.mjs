import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

for (const directory of ["src", "test"]) {
  for (const filename of readdirSync(new URL(`../${directory}/`, import.meta.url))) {
    if (!filename.endsWith(".mjs")) continue;
    execFileSync(process.execPath, ["--check", join(new URL(`../${directory}/`, import.meta.url).pathname, filename)], {
      stdio: "inherit",
    });
  }
}
