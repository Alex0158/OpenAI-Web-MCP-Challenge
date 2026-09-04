import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { emitKeypressEvents } from "node:readline";
import process from "node:process";

import { REENTRY_WORDMARK } from "./terminal-ui.mjs";

const MAX_VISIBLE_DIRECTORIES = 12;

/**
 * Let an interactive user choose the directory passed to Codex as its workspace.
 * The picker only selects existing directories; it never creates or deletes files.
 */
export async function chooseWorkspaceDirectory(options = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  if (input.isTTY !== true || output.isTTY !== true || typeof input.setRawMode !== "function") {
    return null;
  }

  const homeDirectory = resolve(options.homeDirectory ?? homedir());
  const preferredDirectory = resolve(options.startDirectory ?? process.cwd());
  let selected = 0;
  const wasRaw = Boolean(input.isRaw);
  emitKeypressEvents(input);
  input.setRawMode(true);

  try {
    const quickChoices = await createQuickChoices({ homeDirectory, preferredDirectory });
    while (true) {
      renderPicker(output, {
        title: "Choose where Codex should open for approved work.",
        choices: quickChoices,
        selected,
      });
      const key = await readKey(input);
      if (key.name === "up") {
        selected = (selected - 1 + quickChoices.length) % quickChoices.length;
      } else if (key.name === "down") {
        selected = (selected + 1) % quickChoices.length;
      } else if (key.name === "return" || key.name === "enter") {
        const choice = quickChoices[selected];
        if (choice.action === "use") return choice.path;
        if (choice.action === "cancel") throw cancelledFailure();
        break;
      } else if (key.name === "escape" || key.sequence === "\u0003") {
        throw cancelledFailure();
      }
    }

    let current = homeDirectory;
    selected = 0;
    while (true) {
      const directories = await readableDirectories(current);
      const choices = createBrowserChoices({ current, directories });
      selected = Math.min(selected, choices.length - 1);
      renderPicker(output, {
        title: "Choose another folder.",
        current,
        choices,
        selected,
        truncated: directories.truncated,
      });
      const key = await readKey(input);
      if (key.name === "up") {
        selected = (selected - 1 + choices.length) % choices.length;
      } else if (key.name === "down") {
        selected = (selected + 1) % choices.length;
      } else if (key.name === "return" || key.name === "enter") {
        const choice = choices[selected];
        if (choice.action === "use") return choice.path;
        if (choice.action === "cancel") throw cancelledFailure();
        current = choice.path;
        selected = 0;
      } else if (key.name === "escape" || key.sequence === "\u0003") {
        throw cancelledFailure();
      }
    }
  } finally {
    input.setRawMode(wasRaw);
    output.write("\u001b[2J\u001b[H");
  }
}

async function createQuickChoices({ homeDirectory, preferredDirectory }) {
  const choices = [];
  const desktop = join(homeDirectory, "Desktop");
  if (await isDirectory(desktop)) {
    choices.push({
      label: "Use Desktop (recommended)",
      detail: desktop,
      action: "use",
      path: desktop,
    });
  }
  if (preferredDirectory !== desktop && await isDirectory(preferredDirectory)) {
    choices.push({
      label: "Use current folder",
      detail: preferredDirectory,
      action: "use",
      path: preferredDirectory,
    });
  }
  if (choices.length === 0) {
    choices.push({
      label: "Use Home",
      detail: homeDirectory,
      action: "use",
      path: homeDirectory,
    });
  }
  choices.push({ label: "Choose another folder…", action: "browse", path: homeDirectory });
  choices.push({ label: "Cancel", action: "cancel", path: null });
  return choices;
}

function createBrowserChoices({ current, directories }) {
  const choices = [
    { label: "Use this folder", detail: current, action: "use", path: current },
  ];
  const parent = dirname(current);
  if (parent !== current) {
    choices.push({ label: "Go up", detail: parent, action: "open", path: parent });
  }
  for (const directory of directories.items) {
    choices.push({ label: directory.name, action: "open", path: directory.path });
  }
  choices.push({ label: "Cancel", action: "cancel", path: null });
  return choices;
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function readableDirectories(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    const failure = pickerFailure("workspace_directory_unavailable", `Cannot open ${directory}`);
    failure.cause = error;
    throw failure;
  }
  const directories = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((left, right) => left.name.localeCompare(right.name));
  return {
    items: directories
      .slice(0, MAX_VISIBLE_DIRECTORIES)
      .map((entry) => ({ name: entry.name, path: join(directory, entry.name) })),
    truncated: directories.length > MAX_VISIBLE_DIRECTORIES,
  };
}

function renderPicker(output, { title, current, choices, selected, truncated = false }) {
  output.write("\u001b[2J\u001b[H");
  for (const line of REENTRY_WORDMARK) output.write(`${line}\n`);
  output.write("  LOCAL CONNECTOR\n\n");
  output.write("  1 OF 3  WORKSPACE\n");
  output.write(`  ${title}\n`);
  if (current) output.write(`  Current: ${current}\n`);
  output.write("  ─────────────────────────────────────────────\n");
  output.write("\n");
  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];
    output.write(`  ${index === selected ? "❯" : " "}  ${choice.label}\n`);
    if (choice.detail) output.write(`       ${choice.detail}\n`);
  }
  if (truncated) {
    output.write(`\n  Showing the first ${MAX_VISIBLE_DIRECTORIES} folders.\n`);
  }
  output.write("\n  ↑↓ Move   Enter Select   Esc Cancel");
}

function readKey(input) {
  return new Promise((resolveKey) => {
    function onKeypress(_sequence, key = {}) {
      input.removeListener("keypress", onKeypress);
      resolveKey(key);
    }
    input.on("keypress", onKeypress);
  });
}

function cancelledFailure() {
  return pickerFailure("workspace_selection_cancelled", "Workspace selection was cancelled");
}

function pickerFailure(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
