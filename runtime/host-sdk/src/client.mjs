const PROMPT_OPTION_FIELDS = Object.freeze(["documentRef"]);
const PROMPT_INPUT_FIELDS = Object.freeze(["title", "reason"]);
const TITLE_MAX_BYTES = 120;
const REASON_MAX_BYTES = 500;
const PROMPT_CLASS = "webmcp-continuation";
let promptSequence = 0;

const PROMPT_STYLES = `
  dialog.${PROMPT_CLASS}__dialog {
    width: min(calc(100vw - 32px), 468px);
    max-width: none;
    margin: auto;
    padding: 0;
    border: 0;
    border-radius: 18px;
    background: transparent;
    color: #2d2d2d;
    overflow: visible;
    color-scheme: light;
  }

  dialog.${PROMPT_CLASS}__dialog::backdrop {
    background: rgb(0 0 0 / 58%);
    backdrop-filter: blur(6px);
    animation: ${PROMPT_CLASS}-backdrop-in 160ms ease-out both;
  }

  .${PROMPT_CLASS}__card {
    position: relative;
    border: 1px solid #d9d9d9;
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 24px 70px rgb(0 0 0 / 25%), 0 4px 12px rgb(0 0 0 / 10%);
    animation: ${PROMPT_CLASS}-card-in 180ms cubic-bezier(.2, .75, .25, 1) both;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .${PROMPT_CLASS}__surface {
    padding: 24px 24px 20px;
    border-radius: inherit;
  }

  .${PROMPT_CLASS}__topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .${PROMPT_CLASS}__brand {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .${PROMPT_CLASS}__mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: #202123;
    color: #ffffff;
  }

  .${PROMPT_CLASS}__mark-glyph {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -.16em;
    transform: translateX(-1px);
  }

  .${PROMPT_CLASS}__eyebrow {
    margin: 0 0 4px;
    color: #6b6b6b;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .13em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .${PROMPT_CLASS}__brand-name-line {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .${PROMPT_CLASS}__brand-name {
    color: #2d2d2d;
    font-size: 13px;
    font-weight: 650;
    letter-spacing: -.01em;
  }

  .${PROMPT_CLASS}__brand-version {
    padding: 2px 6px;
    border: 1px solid #e5e5e5;
    border-radius: 999px;
    background: #f7f7f7;
    color: #6b6b6b;
    font-size: 9px;
    font-weight: 650;
    letter-spacing: .03em;
  }

  .${PROMPT_CLASS}__close {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin: -2px -2px 0 0;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 9px;
    background: transparent;
    color: #6b6b6b;
    cursor: pointer;
    font-size: 21px;
    font-weight: 300;
    line-height: 1;
    transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
  }

  .${PROMPT_CLASS}__close:hover {
    border-color: #d9d9d9;
    background: #f7f7f7;
    color: #202123;
  }

  .${PROMPT_CLASS}__close:focus-visible,
  .${PROMPT_CLASS}__button:focus-visible {
    outline: 3px solid rgb(16 163 127 / 35%);
    outline-offset: 3px;
  }

  .${PROMPT_CLASS}__title {
    margin: 28px 0 10px;
    color: #202123;
    font-size: clamp(24px, 5vw, 29px);
    font-weight: 700;
    letter-spacing: -.04em;
    line-height: 1.08;
  }

  .${PROMPT_CLASS}__reason {
    max-width: 38ch;
    margin: 0;
    color: #5d5d5d;
    font-size: 15px;
    line-height: 1.55;
  }

  .${PROMPT_CLASS}__notice {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: 22px;
    padding: 13px 14px;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    background: #f7f7f7;
  }

  .${PROMPT_CLASS}__notice-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 27px;
    height: 27px;
    border-radius: 8px;
    background: #e6f4f0;
    color: #0d8a6a;
    font-size: 14px;
    font-weight: 750;
  }

  .${PROMPT_CLASS}__notice-copy {
    display: grid;
    gap: 2px;
  }

  .${PROMPT_CLASS}__notice-copy strong {
    color: #2d2d2d;
    font-size: 12px;
    font-weight: 680;
  }

  .${PROMPT_CLASS}__notice-copy span {
    color: #6b6b6b;
    font-size: 12px;
    line-height: 1.35;
  }

  .${PROMPT_CLASS}__actions {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 9px;
    margin-top: 24px;
  }

  .${PROMPT_CLASS}__button {
    min-height: 44px;
    padding: 0 15px;
    border: 1px solid #d9d9d9;
    border-radius: 10px;
    background: #ffffff;
    color: #2d2d2d;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 650;
    letter-spacing: -.005em;
    transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;
  }

  .${PROMPT_CLASS}__button:hover {
    transform: translateY(-1px);
    border-color: #bdbdbd;
    background: #f7f7f7;
  }

  .${PROMPT_CLASS}__button:active {
    transform: translateY(0);
  }

  .${PROMPT_CLASS}__button--primary {
    border-color: #202123;
    background: #202123;
    color: #ffffff;
  }

  .${PROMPT_CLASS}__button--primary:hover {
    border-color: #40414f;
    background: #40414f;
  }

  .${PROMPT_CLASS}__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin: 14px 0 0;
    color: #8a8a8a;
    font-size: 11px;
    line-height: 1.4;
    text-align: center;
  }

  .${PROMPT_CLASS}__footer-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10a37f;
    box-shadow: 0 0 0 4px rgb(16 163 127 / 12%);
  }

  @keyframes ${PROMPT_CLASS}-backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes ${PROMPT_CLASS}-card-in {
    from { opacity: 0; transform: translateY(8px) scale(.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 520px) {
    .${PROMPT_CLASS}__surface {
      padding: 21px 18px 17px;
    }

    .${PROMPT_CLASS}__actions {
      grid-template-columns: 1fr;
    }

    .${PROMPT_CLASS}__button--primary {
      order: -1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    dialog.${PROMPT_CLASS}__dialog::backdrop,
    .${PROMPT_CLASS}__card {
      animation: none;
    }

    .${PROMPT_CLASS}__button,
    .${PROMPT_CLASS}__close {
      transition: none;
    }
  }
`;

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
    const style = documentRef.createElement("style");
    const card = documentRef.createElement("div");
    const surface = documentRef.createElement("div");
    const topbar = documentRef.createElement("div");
    const brand = documentRef.createElement("div");
    const mark = documentRef.createElement("div");
    const markGlyph = documentRef.createElement("span");
    const brandCopy = documentRef.createElement("div");
    const eyebrow = documentRef.createElement("div");
    const brandNameLine = documentRef.createElement("div");
    const brandName = documentRef.createElement("span");
    const brandVersion = documentRef.createElement("span");
    const closeButton = documentRef.createElement("button");
    const title = documentRef.createElement("h2");
    const reason = documentRef.createElement("p");
    const notice = documentRef.createElement("div");
    const noticeIcon = documentRef.createElement("span");
    const noticeCopy = documentRef.createElement("div");
    const noticeTitle = documentRef.createElement("strong");
    const noticeReason = documentRef.createElement("span");
    const actions = documentRef.createElement("div");
    const approve = documentRef.createElement("button");
    const decline = documentRef.createElement("button");
    const footer = documentRef.createElement("div");
    const footerDot = documentRef.createElement("span");
    const footerText = documentRef.createElement("span");

    if (typeof dialog.showModal !== "function") {
      throw new TypeError("Continuation prompt requires HTMLDialogElement.showModal");
    }

    const instanceId = ++promptSequence;
    style.textContent = PROMPT_STYLES;
    dialog.className = `${PROMPT_CLASS}__dialog`;
    card.className = `${PROMPT_CLASS}__card`;
    surface.className = `${PROMPT_CLASS}__surface`;
    topbar.className = `${PROMPT_CLASS}__topbar`;
    brand.className = `${PROMPT_CLASS}__brand`;
    mark.className = `${PROMPT_CLASS}__mark`;
    markGlyph.className = `${PROMPT_CLASS}__mark-glyph`;
    brandCopy.className = `${PROMPT_CLASS}__brand-copy`;
    eyebrow.className = `${PROMPT_CLASS}__eyebrow`;
    brandNameLine.className = `${PROMPT_CLASS}__brand-name-line`;
    brandName.className = `${PROMPT_CLASS}__brand-name`;
    brandVersion.className = `${PROMPT_CLASS}__brand-version`;
    closeButton.className = `${PROMPT_CLASS}__close`;
    title.className = `${PROMPT_CLASS}__title`;
    reason.className = `${PROMPT_CLASS}__reason`;
    notice.className = `${PROMPT_CLASS}__notice`;
    noticeIcon.className = `${PROMPT_CLASS}__notice-icon`;
    noticeCopy.className = `${PROMPT_CLASS}__notice-copy`;
    actions.className = `${PROMPT_CLASS}__actions`;
    approve.className = `${PROMPT_CLASS}__button ${PROMPT_CLASS}__button--primary`;
    decline.className = `${PROMPT_CLASS}__button`;
    footer.className = `${PROMPT_CLASS}__footer`;
    footerDot.className = `${PROMPT_CLASS}__footer-dot`;

    const titleId = `${PROMPT_CLASS}-title-${instanceId}`;
    const reasonId = `${PROMPT_CLASS}-reason-${instanceId}`;
    title.id = titleId;
    reason.id = reasonId;
    title.textContent = input.title;
    reason.textContent = input.reason;
    eyebrow.textContent = "Codex continuation";
    markGlyph.textContent = "</>";
    brandName.textContent = "WebMCP Continuation SDK";
    brandVersion.textContent = "v0.1";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close request");
    closeButton.setAttribute("title", "Close request");
    noticeIcon.textContent = "✓";
    noticeTitle.textContent = "Codex is ready to continue";
    noticeReason.textContent = "Review before the next step runs.";
    footerText.textContent = "Codex waits for your approval";
    approve.type = "button";
    approve.textContent = "Approve & continue";
    decline.type = "button";
    decline.textContent = "Not now";
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.setAttribute("aria-describedby", reasonId);
    dialog.setAttribute("aria-modal", "true");

    mark.append(markGlyph);
    brandNameLine.append(brandName, brandVersion);
    brandCopy.append(eyebrow, brandNameLine);
    brand.append(mark, brandCopy);
    topbar.append(brand, closeButton);
    noticeCopy.append(noticeTitle, noticeReason);
    notice.append(noticeIcon, noticeCopy);
    actions.append(decline, approve);
    footer.append(footerDot, footerText);
    surface.append(topbar, title, reason, notice, actions, footer);
    card.append(surface);
    dialog.append(style, card);
    documentRef.body.append(dialog);

    return new Promise((resolve) => {
      active = { dialog, resolve };
      approve.addEventListener("click", () => settle("approve"), { once: true });
      decline.addEventListener("click", () => settle("decline"), { once: true });
      closeButton.addEventListener("click", () => settle("decline"), { once: true });
      dialog.addEventListener("cancel", () => settle("decline"), { once: true });
      dialog.addEventListener("close", () => settle("decline"), { once: true });
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
    const current = active;
    active = undefined;
    const dialog = current.dialog;
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    dialog.remove();
    current.resolve({ action: "decline" });
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
