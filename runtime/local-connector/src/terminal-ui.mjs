import process from "node:process";

const RESET = "\u001b[0m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[2m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const RED = "\u001b[31m";
const CYAN = "\u001b[36m";
const SPINNER_FRAMES = ["·", "✦", "✧", "✦"];

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
  const write = (value) => output.write(`${value}\n`);
  const clearSpinnerLine = () => {
    if (spinnerTimer === null) return;
    output.write("\r\u001b[2K");
    clearInterval(spinnerTimer);
    spinnerTimer = null;
  };
  const renderSpinner = () => {
    output.write(`\r\u001b[2K  ${style(SPINNER_FRAMES[spinnerFrame], CYAN)} ${spinnerMessage}`);
    spinnerFrame = (spinnerFrame + 1) % SPINNER_FRAMES.length;
  };

  return Object.freeze({
    interactive,

    begin(title, subtitle) {
      if (!interactive) return;
      write("");
      write(`  ${style("RE-ENTRY", BOLD)} ${style("LOCAL CONNECTOR", DIM)}`);
      write(`  ${style(title, BOLD)}`);
      if (subtitle) write(`  ${style(subtitle, DIM)}`);
      write("");
    },

    step(label, detail) {
      if (!interactive) return;
      write(`  ${style("→", CYAN)} ${style(label, BOLD)}${detail ? `  ${detail}` : ""}`);
    },

    success(label, detail) {
      if (!interactive) return;
      write(`  ${style("✓", GREEN)} ${style(label, BOLD)}${detail ? `  ${detail}` : ""}`);
    },

    info(label, detail) {
      if (!interactive) return;
      write(`  ${style("·", CYAN)} ${style(label, BOLD)}${detail ? `  ${detail}` : ""}`);
    },

    warning(label, detail) {
      if (!interactive) return;
      write(`  ${style("!", YELLOW)} ${style(label, BOLD)}${detail ? `  ${detail}` : ""}`);
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
      if (outcome === "warning") this.warning(label, detail);
      else if (outcome === "info") this.info(label, detail);
      else this.success(label, detail);
    },

    error(label, detail, hint) {
      if (!interactive) return;
      clearSpinnerLine();
      errorOutput.write(`  ${style("✕", RED)} ${style(label, BOLD)}${detail ? `  ${detail}` : ""}\n`);
      if (hint) errorOutput.write(`  ${style("Next:", DIM)} ${hint}\n`);
    },

    close() {
      clearSpinnerLine();
    },
  });
}
