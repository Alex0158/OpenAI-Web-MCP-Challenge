import process from "node:process";

const RESET = "\u001b[0m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[2m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const RED = "\u001b[31m";
const CYAN = "\u001b[36m";
const SPINNER_FRAMES = ["·", "✦", "✧", "✦"];
const RULE = "  ─────────────────────────────────────────────";

export const REENTRY_WORDMARK = Object.freeze([
  "   ____  _____      _____ _   _ _____ ______   __",
  "  |  _ \\| ____|    | ____| \\ | |_   _|  _ \\ \\ / /",
  "  | |_) |  _| _____|  _| |  \\| | | | | |_) | \\ V /",
  "  |  _ <| |__|_____| |___| |\\  | | | |  _ <   | |",
  "  |_| \\_\\_____|    |_____|_| \\_| |_| |_| \\_\\  |_|",
]);

/**
 * Small dependency-free terminal presentation for the Local Connector CLI.
 * It never prints credentials and automatically stays silent when stdout is piped.
 */
export function createTerminalUi(options = {}) {
  const output = options.output ?? process.stdout;
  const errorOutput = options.errorOutput ?? process.stderr;
  const interactive = options.interactive ?? Boolean(output.isTTY);
  const color = interactive && options.color !== false && !process.env.NO_COLOR && process.env.TERM !== "dumb";
  let spinnerTimer = null;
  let spinnerMessage = "";
  let spinnerFrame = 0;

  const style = (value, code) => color ? `${code}${value}${RESET}` : value;
  const write = (value = "") => output.write(`${value}\n`);
  const clearSpinnerLine = () => {
    if (spinnerTimer === null) return;
    output.write("\r\u001b[2K");
    clearInterval(spinnerTimer);
    spinnerTimer = null;
  };
  const renderSpinner = () => {
    output.write(`\r\u001b[2K  ${style(SPINNER_FRAMES[spinnerFrame], CYAN)}  ${spinnerMessage}`);
    spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
  };
  const renderState = (symbol, symbolColor, label, detail) => {
    clearSpinnerLine();
    write(`  ${style(symbol, symbolColor)}  ${style(label, BOLD)}${detail ? `  ${style(detail, DIM)}` : ""}`);
  };

  return Object.freeze({
    interactive,

    begin(title, subtitle) {
      if (!interactive) return;
      clearSpinnerLine();
      write();
      for (const line of REENTRY_WORDMARK) write(style(line, `${BOLD}${CYAN}`));
      write(`  ${style("LOCAL CONNECTOR", DIM)}`);
      write();
      write(`  ${style(title, BOLD)}`);
      if (subtitle) write(`  ${style(subtitle, DIM)}`);
      write(RULE);
    },

    section(step, title, detail) {
      if (!interactive) return;
      clearSpinnerLine();
      write();
      write(`  ${style(step, CYAN)}  ${style(title, BOLD)}`);
      if (detail) write(`     ${style(detail, DIM)}`);
      write();
    },

    step(label, detail) {
      if (!interactive) return;
      renderState("→", CYAN, label, detail);
    },

    success(label, detail) {
      if (!interactive) return;
      renderState("✓", GREEN, label, detail);
    },

    info(label, detail) {
      if (!interactive) return;
      renderState("·", CYAN, label, detail);
    },

    warning(label, detail) {
      if (!interactive) return;
      renderState("!", YELLOW, label, detail);
    },

    wait(message) {
      if (!interactive) return;
      clearSpinnerLine();
      spinnerMessage = message;
      spinnerFrame = 0;
      renderSpinner();
      spinnerTimer = setInterval(renderSpinner, 450);
      spinnerTimer.unref?.();
    },

    stopWait(label, detail, outcome = "success") {
      if (!interactive) return;
      clearSpinnerLine();
      if (outcome === "warning") renderState("!", YELLOW, label, detail);
      else if (outcome === "info") renderState("·", CYAN, label, detail);
      else renderState("✓", GREEN, label, detail);
    },

    complete(title, detail) {
      if (!interactive) return;
      clearSpinnerLine();
      write();
      write(`  ${style("✓", GREEN)}  ${style(title, BOLD)}`);
      if (detail) write(`     ${style(detail, DIM)}`);
    },

    next(command, detail) {
      if (!interactive) return;
      clearSpinnerLine();
      write();
      write(`  ${style("NEXT", CYAN)}`);
      write(`  ${style("$", CYAN)} ${style(command, BOLD)}`);
      if (detail) write(`    ${style(detail, DIM)}`);
      write();
    },

    commands(title, entries) {
      if (!interactive) return;
      clearSpinnerLine();
      const validEntries = Array.isArray(entries)
        ? entries.filter((entry) => (
          entry &&
          typeof entry.label === "string" && entry.label.length > 0 &&
          typeof entry.command === "string" && entry.command.length > 0
        ))
        : [];
      if (validEntries.length === 0) return;
      const labelWidth = Math.max(...validEntries.map((entry) => entry.label.length));
      write();
      if (title) write(`  ${style(title, CYAN)}`);
      for (const entry of validEntries) {
        const label = entry.label.padEnd(labelWidth);
        write(`  ${style(label, BOLD)}  ${style("$", CYAN)} ${style(entry.command, BOLD)}`);
        if (entry.detail) write(`     ${style(entry.detail, DIM)}`);
      }
      write();
    },

    error(label, detail, hint) {
      if (!interactive) return;
      clearSpinnerLine();
      errorOutput.write(`\n  ${style("✕", RED)}  ${style(label, BOLD)}\n`);
      if (detail) errorOutput.write(`     ${style(detail, DIM)}\n`);
      if (hint) {
        errorOutput.write(`\n  ${style("NEXT", CYAN)}\n`);
        errorOutput.write(`  ${style("→", CYAN)}  ${hint}\n\n`);
      }
    },

    close() {
      clearSpinnerLine();
    },
  });
}
