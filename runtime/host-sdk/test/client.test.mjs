import assert from "node:assert/strict";
import test from "node:test";

import {
  createContinuationPrompt,
  createReentryConsentAction,
  createReentryConsentPrompt,
  ReentryConsentActionError,
  registerReentryWebMcpTool,
} from "../src/client.mjs";

test("browser prompt renders in the top-layer dialog and returns the user's decision", async () => {
  const documentRef = new FakeDocument();
  const prompt = createContinuationPrompt({ documentRef });
  const pending = prompt.show({
    title: "Continue this workflow?",
    reason: "A later step is ready for review.",
  });

  const dialog = documentRef.body.children[0];
  assert.equal(dialog.tagName, "DIALOG");
  assert.equal(dialog.open, true);
  assert.equal(dialog.className, "webmcp-continuation__dialog");
  assert.ok(findByText(dialog, "WebMCP Continuation SDK"));
  assert.ok(findByText(dialog, "Codex is ready to continue"));
  assert.ok(findByText(dialog, "Codex waits for your approval"));
  assert.equal(findByText(dialog, "Continue this workflow?").tagName, "H2");

  const approve = findByText(dialog, "Approve & continue");
  assert.ok(approve);
  approve.click();
  assert.deepEqual(await pending, { action: "approve" });
  assert.equal(documentRef.body.children.length, 0);
});

test("closing the browser prompt is a decline", async () => {
  const documentRef = new FakeDocument();
  const prompt = createContinuationPrompt({ documentRef });
  const pending = prompt.show({ title: "Continue?", reason: "Review is required." });

  prompt.close();
  assert.deepEqual(await pending, { action: "decline" });
  assert.equal(documentRef.body.children.length, 0);
});

test("account-backed prompt opens the exact Re-entry URL and trusts only its completion message", async () => {
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow();
  const prompt = createReentryConsentPrompt({ documentRef, windowRef });
  const consentUrl = `https://receiver.example/consent?token=${Buffer.alloc(32, 4).toString("base64url")}`;
  const pending = prompt.show({
    title: "Continue with Codex?",
    reason: "Review the exact scope in Re-entry.",
    consentUrl,
    consentSessionId: "consent_session_001",
  });

  const dialog = documentRef.body.children[0];
  assert.ok(findByText(dialog, "Re-entry"));
  assert.ok(findByText(dialog, "Your approval lives in Re-entry"));
  findByText(dialog, "Review in Re-entry").click();
  assert.equal(windowRef.openedUrl, consentUrl);

  windowRef.dispatchMessage({
    origin: "https://attacker.example",
    source: windowRef.popup,
    data: {
      type: "reentry.consent.complete",
      consent_session_id: "consent_session_001",
      status: "approved",
    },
  });
  assert.equal(dialog.open, true);

  windowRef.dispatchMessage({
    origin: "https://receiver.example",
    source: windowRef.popup,
    data: {
      type: "reentry.consent.complete",
      consent_session_id: "consent_session_001",
      status: "approved",
    },
  });
  assert.deepEqual(await pending, { action: "approve", status: "approved" });
  assert.equal(documentRef.body.children.length, 0);
  assert.equal(windowRef.popup.closed, true);
});

test("one JavaScript action serves both ordinary UI and the registered WebMCP Site Tool", async () => {
  const calls = [];
  const promptInputs = [];
  let confirmationSequence = 0;
  const requestReentry = createReentryConsentAction({
    prompt: {
      async show(input) {
        promptInputs.push(input);
        return { action: "approve", status: "approved" };
      },
    },
    async createConsentSession(input) {
      calls.push({ step: "create", input });
      return {
        title: "Let Codex return later?",
        reason: "Approve one future continuation in Re-entry.",
        consentUrl: `https://receiver.example/consent?token=${Buffer.alloc(32, 5).toString("base64url")}`,
        consentSessionId: `consent_session_00${calls.length}`,
      };
    },
    async confirmConsentSession(input) {
      calls.push({ step: "confirm", input });
      confirmationSequence += 1;
      return {
        status: "approved",
        continuationId: `continuation_00${confirmationSequence}`,
      };
    },
  });
  const documentRef = new FakeDocument();
  let definition;
  documentRef.modelContext = {
    async registerTool(value) {
      definition = value;
    },
  };

  const registration = await registerReentryWebMcpTool({
    documentRef,
    name: "request_codex_reentry",
    description: "Ask the signed-in user to approve one future Codex continuation.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: requestReentry,
  });

  assert.deepEqual(registration, { registered: true, name: "request_codex_reentry" });
  assert.equal(definition.execute, requestReentry);
  assert.deepEqual(await requestReentry({ source: "button" }), {
    status: "approved",
    continuationId: "continuation_001",
  });
  assert.deepEqual(await definition.execute({ source: "agent" }), {
    status: "approved",
    continuationId: "continuation_002",
  });
  assert.deepEqual(calls, [
    { step: "create", input: { source: "button" } },
    { step: "confirm", input: { consentSessionId: "consent_session_001" } },
    { step: "create", input: { source: "agent" } },
    { step: "confirm", input: { consentSessionId: "consent_session_003" } },
  ]);
  assert.equal(promptInputs.length, 2);
});

test("a declined Re-entry prompt never asks the Host server to confirm a continuation", async () => {
  let confirmations = 0;
  const requestReentry = createReentryConsentAction({
    prompt: { show: async () => ({ action: "decline", status: "declined" }) },
    createConsentSession: async () => ({
      title: "Continue?",
      reason: "Review one future continuation.",
      consentUrl: `https://receiver.example/consent?token=${Buffer.alloc(32, 6).toString("base64url")}`,
      consentSessionId: "consent_session_declined",
    }),
    confirmConsentSession: async () => {
      confirmations += 1;
      return { status: "approved", continuationId: "continuation_unexpected" };
    },
  });

  assert.deepEqual(await requestReentry({}), { status: "declined" });
  assert.equal(confirmations, 0);
});

test("popup approval is insufficient until the Host server confirms Receiver status", async () => {
  const requestReentry = createReentryConsentAction({
    prompt: { show: async () => ({ action: "approve", status: "approved" }) },
    createConsentSession: async () => ({
      title: "Continue?",
      reason: "Review one future continuation.",
      consentUrl: `https://receiver.example/consent?token=${Buffer.alloc(32, 7).toString("base64url")}`,
      consentSessionId: "consent_session_pending",
    }),
    confirmConsentSession: async () => ({
      status: "pending",
      continuationId: "continuation_pending",
    }),
  });

  await assert.rejects(
    () => requestReentry({}),
    (error) => {
      assert.ok(error instanceof ReentryConsentActionError);
      assert.equal(error.code, "reentry_consent_not_confirmed");
      return true;
    },
  );
});

test("the browser action rejects a confirmation that includes the private binding", async () => {
  const requestReentry = createReentryConsentAction({
    prompt: { show: async () => ({ action: "approve", status: "approved" }) },
    createConsentSession: async () => ({
      title: "Continue?",
      reason: "Review one future continuation.",
      consentUrl: `https://receiver.example/consent?token=${Buffer.alloc(32, 8).toString("base64url")}`,
      consentSessionId: "consent_session_private_binding",
    }),
    confirmConsentSession: async () => ({
      status: "approved",
      continuationId: "continuation_private_binding",
      binding: { binding_id: "must_stay_on_server" },
    }),
  });

  await assert.rejects(
    () => requestReentry({}),
    /Re-entry consent confirmation contains an unsupported field/,
  );
});

test("the shared action refuses overlapping consent sessions", async () => {
  let releaseSession;
  const pendingSession = new Promise((resolve) => {
    releaseSession = resolve;
  });
  const requestReentry = createReentryConsentAction({
    prompt: { show: async () => ({ action: "decline", status: "declined" }) },
    createConsentSession: async () => pendingSession,
    confirmConsentSession: async () => {
      throw new Error("Decline must not be confirmed");
    },
  });

  const first = requestReentry({ source: "button" });
  await assert.rejects(
    () => requestReentry({ source: "agent" }),
    (error) => {
      assert.ok(error instanceof ReentryConsentActionError);
      assert.equal(error.code, "reentry_consent_action_active");
      return true;
    },
  );
  releaseSession({
    title: "Continue?",
    reason: "Review one future continuation.",
    consentUrl: `https://receiver.example/consent?token=${Buffer.alloc(32, 9).toString("base64url")}`,
    consentSessionId: "consent_session_overlap",
  });
  assert.deepEqual(await first, { status: "declined" });
});

test("WebMCP absence is visible and leaves the ordinary JavaScript action available", async () => {
  const action = async () => ({ status: "declined" });
  const result = await registerReentryWebMcpTool({
    documentRef: new FakeDocument(),
    name: "request_codex_reentry",
    description: "Ask the signed-in user to approve one future Codex continuation.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: action,
  });

  assert.deepEqual(result, { registered: false, reason: "webmcp_unavailable" });
  assert.deepEqual(await action(), { status: "declined" });
});

function findByText(element, text) {
  if (element.textContent === text) return element;
  for (const child of element.children) {
    const found = findByText(child, text);
    if (found) return found;
  }
  return undefined;
}

class FakeDocument {
  body = new FakeElement("body");

  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

class FakeElement {
  children = [];
  listeners = new Map();
  parent;
  open = false;
  style = {};
  textContent = "";
  className = "";
  id = "";

  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
  }

  append(...children) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  setAttribute() {}

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  remove() {
    if (this.parent === undefined) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = undefined;
  }

  click() {
    this.listeners.get("click")?.();
  }
}

class FakeWindow {
  listeners = new Map();
  popup = {
    closed: false,
    close() { this.closed = true; },
    focus() {},
  };
  openedUrl;
  outerWidth = 1_200;
  outerHeight = 900;
  screenX = 0;
  screenY = 0;

  open(url) {
    this.openedUrl = url;
    return this.popup;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  dispatchMessage(event) {
    this.listeners.get("message")?.(event);
  }

  setInterval() {
    return 1;
  }

  clearInterval() {}
}
