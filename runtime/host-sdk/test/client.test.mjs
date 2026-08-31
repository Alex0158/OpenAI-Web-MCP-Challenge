import assert from "node:assert/strict";
import test from "node:test";

import { createContinuationPrompt } from "../src/client.mjs";

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
  assert.equal(dialog.children[0].textContent, "Continue this workflow?");

  const approve = findByText(dialog, "Approve");
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
