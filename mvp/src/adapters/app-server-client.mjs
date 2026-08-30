import { spawn } from "node:child_process";
import readline from "node:readline";

export class AppServerClient {
  constructor({ command = "codex", args = ["app-server"], requestTimeoutMs = 90_000 } = {}) {
    this.command = command;
    this.args = args;
    this.requestTimeoutMs = requestTimeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.notifications = [];
    this.waiters = new Set();
    this.stderr = [];
  }

  async connect() {
    this.child = spawn(this.command, this.args, { stdio: ["pipe", "pipe", "pipe"] });
    this.lines = readline.createInterface({ input: this.child.stdout });
    this.lines.on("line", (line) => this.handleLine(line));
    this.child.stderr.on("data", (chunk) => {
      this.stderr.push(chunk.toString("utf8"));
      if (this.stderr.length > 30) this.stderr.shift();
    });
    this.child.once("error", (error) => this.rejectAll(error));
    this.child.once("exit", (code, signal) => {
      this.rejectAll(new Error(`App Server exited before request completion: code=${code} signal=${signal}`));
    });

    await this.request("initialize", {
      clientInfo: {
        name: "webmcp_reentry_p0",
        title: "WebMCP Re-entry P0 Probe",
        version: "0.1.0",
      },
    });
    this.notify("initialized", {});
    return this;
  }

  request(method, params = {}) {
    if (!this.child?.stdin?.writable) throw new Error("App Server connection is not writable");
    const id = this.nextId++;
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`App Server request timed out: ${method}`));
      }, this.requestTimeoutMs);
      timeout.unref();
      this.pending.set(id, { resolve, reject, timeout, method });
    });
    this.write({ method, id, params });
    return promise;
  }

  notify(method, params = {}) {
    this.write({ method, params });
  }

  waitForNotification(method, predicate = () => true, timeoutMs = this.requestTimeoutMs) {
    const existingIndex = this.notifications.findIndex(
      (message) => message.method === method && predicate(message.params),
    );
    if (existingIndex >= 0) {
      const [message] = this.notifications.splice(existingIndex, 1);
      return Promise.resolve(message.params);
    }

    return new Promise((resolve, reject) => {
      const waiter = { method, predicate, resolve, reject, timeout: null };
      waiter.timeout = setTimeout(() => {
        this.waiters.delete(waiter);
        reject(new Error(`App Server notification timed out: ${method}`));
      }, timeoutMs);
      waiter.timeout.unref();
      this.waiters.add(waiter);
    });
  }

  async close() {
    if (!this.child) return;
    const child = this.child;
    this.child = null;
    this.lines?.close();
    child.stdin.end();
    if (child.exitCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    const timeout = new Promise((resolve) => setTimeout(resolve, 1_500, "timeout"));
    if (await Promise.race([exited, timeout]) === "timeout" && child.exitCode === null) {
      child.kill("SIGTERM");
      await exited;
    }
  }

  handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id !== undefined && !message.method) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if (message.error) {
        pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      } else {
        pending.resolve(message.result);
      }
      return;
    }
    if (message.method && message.id === undefined) {
      for (const waiter of this.waiters) {
        if (waiter.method === message.method && waiter.predicate(message.params)) {
          this.waiters.delete(waiter);
          clearTimeout(waiter.timeout);
          waiter.resolve(message.params);
          return;
        }
      }
      this.notifications.push(message);
      if (this.notifications.length > 500) this.notifications.shift();
      return;
    }
    if (message.method && message.id !== undefined) {
      this.write({
        id: message.id,
        error: { code: -32601, message: `Client request is unsupported in this probe: ${message.method}` },
      });
    }
  }

  write(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  rejectAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    }
    this.waiters.clear();
  }
}
