import { createInterface } from "node:readline/promises";
import process from "node:process";

/**
 * Pause an interactive CLI until the user is ready for the browser to open.
 * Non-interactive callers should skip this function and open the URL directly.
 */
export async function waitForEnterToOpenBrowser(options = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const prompt = options.prompt ?? "\n  Press Enter to open Re-entry  → ";
  const readline = createInterface({ input, output });
  try {
    await readline.question(prompt);
  } finally {
    readline.close();
  }
}
