import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { AgentContinuationAdapter, digestContextBinding } from "../infrastructure/agent-adapter.mjs";

const BUNDLED_CODEX = "/Applications/ChatGPT.app/Contents/Resources/codex";

export class CodexDesktopDemoAdapter extends AgentContinuationAdapter {
  constructor({
    threadId,
    codexBinary = existsSync(BUNDLED_CODEX) ? BUNDLED_CODEX : "codex",
    cwd = process.cwd(),
    runCommand = runProcess,
  } = {}) {
    super({
      id: "codex-desktop-demo",
      proofClassification: "private-current-build-local",
    });
    this.threadId = threadId ?? "";
    this.codexBinary = codexBinary;
    this.cwd = cwd;
    this.runCommand = runCommand;
  }

  async deliver({ instruction }) {
    if (!this.threadId) {
      throw new Error("A Codex task binding is required by the Desktop demo adapter");
    }
    await this.runCommand(
      this.codexBinary,
      ["queue", "--thread", this.threadId, "--message", instruction],
      { cwd: this.cwd },
    );
    return {
      status: "queued",
      adapter: this.id,
      proofClassification: this.proofClassification,
      contextBindingHash: digestContextBinding(this.threadId),
      transportAcknowledged: true,
    };
  }

  describe() {
    return {
      ...super.describe(),
      configured: Boolean(this.threadId),
      contextBindingHash: digestContextBinding(this.threadId),
    };
  }
}

function runProcess(command, args, { cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(new Error(`Codex Desktop adapter command failed with exit code ${code}`));
      }
    });
  });
}
