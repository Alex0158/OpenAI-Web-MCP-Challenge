const PROMPT_OPTION_FIELDS = Object.freeze(["documentRef"]);
const PROMPT_INPUT_FIELDS = Object.freeze(["title", "reason"]);
const TITLE_MAX_BYTES = 120;
const REASON_MAX_BYTES = 500;

/**
 * Create the browser half of the SDK.
 *
 * The prompt is presentation only. It does not hold a signing key, create a Grant, or decide
 * Receiver authority. The caller sends the returned decision to its server-side integration.
 */
export function createContinuationPrompt(options = {}) {
  requireExactRecord(options, PROMPT_OPTION_FIELDS, [], "Continuation prompt options");
  const documentRef = options.documentRef ?? globalThis.document;
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new TypeError("Continuation prompt requires a browser document");
  }

  let active;
  return Object.freeze({ show, close });

  function show(input) {
    requireExactRecord(input, PROMPT_INPUT_FIELDS, PROMPT_INPUT_FIELDS, "Continuation prompt input");
    requireText(input.title, TITLE_MAX_BYTES, "Continuation prompt title");
    requireText(input.reason, REASON_MAX_BYTES, "Continuation prompt reason");
    if (active !== undefined) {
      throw new Error("Continuation prompt is already open");
    }
    if (typeof documentRef.body?.append !== "function") {
      throw new TypeError("Continuation prompt requires document.body.append");
    }

    const dialog = documentRef.createElement("dialog");
    const title = documentRef.createElement("h2");
    const reason = documentRef.createElement("p");
    const actions = documentRef.createElement("div");
    const approve = documentRef.createElement("button");
    const decline = documentRef.createElement("button");

    if (typeof dialog.showModal !== "function") {
      throw new TypeError("Continuation prompt requires HTMLDialogElement.showModal");
    }

    title.textContent = input.title;
    reason.textContent = input.reason;
    approve.type = "button";
    approve.textContent = "Approve";
    decline.type = "button";
    decline.textContent = "Decline";
    dialog.setAttribute("aria-label", input.title);
    dialog.style.cssText = "border:0;border-radius:12px;padding:24px;max-width:420px;box-shadow:0 20px 60px rgb(0 0 0 / 25%);";
    actions.style.cssText = "display:flex;gap:8px;justify-content:flex-end;margin-top:20px;";
    approve.style.cssText = "padding:8px 14px;";
    decline.style.cssText = "padding:8px 14px;";

    actions.append(decline, approve);
    dialog.append(title, reason, actions);
    documentRef.body.append(dialog);

    return new Promise((resolve) => {
      active = { dialog, resolve };
      approve.addEventListener("click", () => settle("approve"), { once: true });
      decline.addEventListener("click", () => settle("decline"), { once: true });
      dialog.addEventListener("cancel", () => settle("decline"), { once: true });
      dialog.showModal();
    });

    function settle(action) {
      if (active === undefined || active.dialog !== dialog) return;
      const current = active;
      active = undefined;
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      dialog.remove();
      current.resolve({ action });
    }
  }

  function close() {
    if (active === undefined) return;
    const dialog = active.dialog;
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    dialog.remove();
    const resolve = active.resolve;
    active = undefined;
    resolve({ action: "decline" });
  }
}

function requireText(value, maximumBytes, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    new TextEncoder().encode(value).byteLength > maximumBytes
  ) {
    throw new TypeError(`${label} is invalid`);
  }
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${label} contains an invalid property`);
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
