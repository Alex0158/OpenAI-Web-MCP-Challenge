const PROMPT_OPTION_FIELDS = Object.freeze(["documentRef"]);
const PROMPT_INPUT_FIELDS = Object.freeze(["title", "reason"]);
const REENTRY_PROMPT_OPTION_FIELDS = Object.freeze(["documentRef", "windowRef"]);
const REENTRY_PROMPT_INPUT_FIELDS = Object.freeze([
  "title",
  "reason",
  "consentUrl",
  "consentSessionId",
]);
const REENTRY_ACTION_OPTION_FIELDS = Object.freeze([
  "prompt",
  "createConsentSession",
  "confirmConsentSession",
]);
const REENTRY_ACTION_SESSION_FIELDS = Object.freeze([
  "title",
  "reason",
  "consentUrl",
  "consentSessionId",
]);
const REENTRY_ACTION_CONFIRMATION_FIELDS = Object.freeze([
  "status",
  "continuationId",
]);
const WEBMCP_TOOL_OPTION_FIELDS = Object.freeze([
  "documentRef",
  "name",
  "description",
  "inputSchema",
  "annotations",
  "execute",
]);
const TITLE_MAX_BYTES = 120;
const REASON_MAX_BYTES = 500;
const TOOL_DESCRIPTION_MAX_BYTES = 500;
const PROMPT_CLASS = "webmcp-continuation";
const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    margin: -2px -2px 0 0;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: transparent;
    color: #6b6b6b;
    cursor: pointer;
    font-size: 12px;
    font-weight: 650;
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

const REENTRY_PROMPT_STYLES = `
  dialog.${PROMPT_CLASS}__dialog{width:min(calc(100vw - 32px),520px);color:#f5f4ef;color-scheme:dark}
  dialog.${PROMPT_CLASS}__dialog::backdrop{background:rgb(3 6 4 / 72%);backdrop-filter:blur(10px)}
  .${PROMPT_CLASS}__card{border:1px solid #354335;border-radius:22px;background:radial-gradient(circle at 90% 0%,rgb(159 232 112 / 12%),transparent 32%),linear-gradient(145deg,rgb(255 255 255 / 4%),transparent 45%),#121712;box-shadow:0 30px 100px rgb(0 0 0 / 52%),0 0 0 1px rgb(159 232 112 / 5%);color:#f5f4ef}
  .${PROMPT_CLASS}__card::before{position:absolute;inset:0 22px auto;height:2px;border-radius:0 0 999px 999px;background:linear-gradient(90deg,transparent,#9fe870 25%,#9fc7ff 75%,transparent);content:"";opacity:.9}
  .${PROMPT_CLASS}__surface{padding:30px 30px 23px}
  .${PROMPT_CLASS}__brand{gap:10px}
  .${PROMPT_CLASS}__brand::before{width:9px;height:9px;border:3px solid rgb(159 232 112 / 18%);border-radius:50%;background:#9fe870;box-shadow:0 0 18px rgb(159 232 112 / 55%);content:""}
  .${PROMPT_CLASS}__eyebrow{margin-bottom:5px;color:#9fc7ff;font:700 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em}
  .${PROMPT_CLASS}__brand-name{color:#f5f4ef;font:700 14px/1.1 Poppins,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .${PROMPT_CLASS}__brand-version{border-color:#354335;background:#1b241c;color:#9fe870;font:700 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.03em}
  .${PROMPT_CLASS}__close{height:30px;margin:0;padding:0 9px;border-color:#354335;border-radius:999px;color:#9ca99d;font-size:11px}
  .${PROMPT_CLASS}__close:hover{border-color:#5d755c;background:#1b241c;color:#f5f4ef}
  .${PROMPT_CLASS}__title{margin-top:34px;color:#f5f4ef;font:700 clamp(27px,5vw,34px)/1.04 Poppins,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.055em}
  .${PROMPT_CLASS}__reason{max-width:40ch;color:#c3ccc1;font-size:15px;line-height:1.55}
  .${PROMPT_CLASS}__notice{align-items:flex-start;gap:12px;margin-top:25px;padding:14px 15px;border:1px solid #354335;border-radius:14px;background:linear-gradient(90deg,rgb(159 232 112 / 9%),rgb(159 199 255 / 4%))}
  .${PROMPT_CLASS}__notice::before{flex:0 0 auto;width:8px;height:8px;margin-top:4px;border:3px solid rgb(159 232 112 / 20%);border-radius:50%;background:#9fe870;box-shadow:0 0 14px rgb(159 232 112 / 40%);content:""}
  .${PROMPT_CLASS}__notice-copy{gap:3px}
  .${PROMPT_CLASS}__notice-copy strong{color:#f5f4ef;font-size:12px}
  .${PROMPT_CLASS}__notice-copy span{color:#9ca99d;font-size:12px;line-height:1.4}
  .${PROMPT_CLASS}__actions{gap:10px;margin-top:25px}
  .${PROMPT_CLASS}__button{min-height:46px;border-color:#354335;border-radius:12px;background:#1a211b;color:#dbe4d8;font-size:13px;font-weight:700}
  .${PROMPT_CLASS}__button:hover{border-color:#668064;background:#222d23}
  .${PROMPT_CLASS}__button--primary{border-color:#9fe870;background:#9fe870;color:#0b100c;box-shadow:0 8px 24px rgb(159 232 112 / 15%)}
  .${PROMPT_CLASS}__button--primary:hover{border-color:#b8f398;background:#b8f398}
  .${PROMPT_CLASS}__handoff-status{color:#9fe870}
  .${PROMPT_CLASS}__footer{margin-top:15px;color:#728073;font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.02em}
  @media(max-width:520px){.${PROMPT_CLASS}__surface{padding:26px 21px 20px}}
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
    const brandCopy = documentRef.createElement("div");
    const eyebrow = documentRef.createElement("div");
    const brandNameLine = documentRef.createElement("div");
    const brandName = documentRef.createElement("span");
    const brandVersion = documentRef.createElement("span");
    const closeButton = documentRef.createElement("button");
    const title = documentRef.createElement("h2");
    const reason = documentRef.createElement("p");
    const notice = documentRef.createElement("div");
    const noticeCopy = documentRef.createElement("div");
    const noticeTitle = documentRef.createElement("strong");
    const noticeReason = documentRef.createElement("span");
    const actions = documentRef.createElement("div");
    const approve = documentRef.createElement("button");
    const decline = documentRef.createElement("button");
    const footer = documentRef.createElement("div");
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
    brandCopy.className = `${PROMPT_CLASS}__brand-copy`;
    eyebrow.className = `${PROMPT_CLASS}__eyebrow`;
    brandNameLine.className = `${PROMPT_CLASS}__brand-name-line`;
    brandName.className = `${PROMPT_CLASS}__brand-name`;
    brandVersion.className = `${PROMPT_CLASS}__brand-version`;
    closeButton.className = `${PROMPT_CLASS}__close`;
    title.className = `${PROMPT_CLASS}__title`;
    reason.className = `${PROMPT_CLASS}__reason`;
    notice.className = `${PROMPT_CLASS}__notice`;
    noticeCopy.className = `${PROMPT_CLASS}__notice-copy`;
    actions.className = `${PROMPT_CLASS}__actions`;
    approve.className = `${PROMPT_CLASS}__button ${PROMPT_CLASS}__button--primary`;
    decline.className = `${PROMPT_CLASS}__button`;
    footer.className = `${PROMPT_CLASS}__footer`;

    const titleId = `${PROMPT_CLASS}-title-${instanceId}`;
    const reasonId = `${PROMPT_CLASS}-reason-${instanceId}`;
    title.id = titleId;
    reason.id = reasonId;
    title.textContent = input.title;
    reason.textContent = input.reason;
    eyebrow.textContent = "Codex continuation";
    brandName.textContent = "WebMCP Continuation SDK";
    brandVersion.textContent = "v0.1";
    closeButton.textContent = "Close";
    closeButton.setAttribute("aria-label", "Close request");
    closeButton.setAttribute("title", "Close request");
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

    brandNameLine.append(brandName, brandVersion);
    brandCopy.append(eyebrow, brandNameLine);
    brand.append(brandCopy);
    topbar.append(brand, closeButton);
    noticeCopy.append(noticeTitle, noticeReason);
    notice.append(noticeCopy);
    actions.append(decline, approve);
    footer.append(footerText);
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

/**
 * Create the account-backed browser handoff.
 *
 * The Host dialog does not approve anything. It opens the Receiver-owned consent URL from a user
 * gesture and accepts completion only from that exact Receiver origin and popup window.
 */
export function createReentryConsentPrompt(options = {}) {
  requireExactRecord(
    options,
    REENTRY_PROMPT_OPTION_FIELDS,
    [],
    "Re-entry consent prompt options",
  );
  const documentRef = options.documentRef ?? globalThis.document;
  const windowRef = options.windowRef ?? globalThis.window;
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new TypeError("Re-entry consent prompt requires a browser document");
  }
  if (!windowRef || typeof windowRef.open !== "function" || typeof windowRef.addEventListener !== "function") {
    throw new TypeError("Re-entry consent prompt requires a browser window");
  }

  let active;
  return Object.freeze({ show, close });

  function show(input) {
    requireExactRecord(
      input,
      REENTRY_PROMPT_INPUT_FIELDS,
      REENTRY_PROMPT_INPUT_FIELDS,
      "Re-entry consent prompt input",
    );
    requireText(input.title, TITLE_MAX_BYTES, "Re-entry consent title");
    requireText(input.reason, REASON_MAX_BYTES, "Re-entry consent reason");
    const consent = requireConsentUrl(input.consentUrl);
    const consentSessionId = requirePromptIdentifier(input.consentSessionId);
    if (active !== undefined) throw new Error("Re-entry consent prompt is already open");
    if (typeof documentRef.body?.append !== "function") {
      throw new TypeError("Re-entry consent prompt requires document.body.append");
    }

    const dialog = documentRef.createElement("dialog");
    if (typeof dialog.showModal !== "function") {
      throw new TypeError("Re-entry consent prompt requires HTMLDialogElement.showModal");
    }
    const style = documentRef.createElement("style");
    const card = documentRef.createElement("div");
    const surface = documentRef.createElement("div");
    const topbar = documentRef.createElement("div");
    const brand = documentRef.createElement("div");
    const brandCopy = documentRef.createElement("div");
    const eyebrow = documentRef.createElement("div");
    const brandNameLine = documentRef.createElement("div");
    const brandName = documentRef.createElement("span");
    const brandVersion = documentRef.createElement("span");
    const closeButton = documentRef.createElement("button");
    const title = documentRef.createElement("h2");
    const reason = documentRef.createElement("p");
    const notice = documentRef.createElement("div");
    const noticeCopy = documentRef.createElement("div");
    const noticeTitle = documentRef.createElement("strong");
    const noticeReason = documentRef.createElement("span");
    const status = documentRef.createElement("p");
    const actions = documentRef.createElement("div");
    const cancel = documentRef.createElement("button");
    const review = documentRef.createElement("button");
    const footer = documentRef.createElement("div");
    const footerText = documentRef.createElement("span");
    const instanceId = ++promptSequence;

    style.textContent = `${PROMPT_STYLES}${REENTRY_PROMPT_STYLES}
      .${PROMPT_CLASS}__handoff-status{min-height:20px;margin:14px 0 0;color:#9fe870;font-size:12px;line-height:1.4}
      .${PROMPT_CLASS}__button[disabled]{cursor:not-allowed;opacity:.48;transform:none}
    `;
    dialog.className = `${PROMPT_CLASS}__dialog`;
    card.className = `${PROMPT_CLASS}__card`;
    surface.className = `${PROMPT_CLASS}__surface`;
    topbar.className = `${PROMPT_CLASS}__topbar`;
    brand.className = `${PROMPT_CLASS}__brand`;
    brandCopy.className = `${PROMPT_CLASS}__brand-copy`;
    eyebrow.className = `${PROMPT_CLASS}__eyebrow`;
    brandNameLine.className = `${PROMPT_CLASS}__brand-name-line`;
    brandName.className = `${PROMPT_CLASS}__brand-name`;
    brandVersion.className = `${PROMPT_CLASS}__brand-version`;
    closeButton.className = `${PROMPT_CLASS}__close`;
    title.className = `${PROMPT_CLASS}__title`;
    reason.className = `${PROMPT_CLASS}__reason`;
    notice.className = `${PROMPT_CLASS}__notice`;
    noticeCopy.className = `${PROMPT_CLASS}__notice-copy`;
    status.className = `${PROMPT_CLASS}__handoff-status`;
    actions.className = `${PROMPT_CLASS}__actions`;
    review.className = `${PROMPT_CLASS}__button ${PROMPT_CLASS}__button--primary`;
    cancel.className = `${PROMPT_CLASS}__button`;
    footer.className = `${PROMPT_CLASS}__footer`;

    const titleId = `${PROMPT_CLASS}-reentry-title-${instanceId}`;
    const reasonId = `${PROMPT_CLASS}-reentry-reason-${instanceId}`;
    title.id = titleId;
    reason.id = reasonId;
    status.setAttribute("role", "status");
    title.textContent = input.title;
    reason.textContent = input.reason;
    eyebrow.textContent = "Codex re-entry";
    brandName.textContent = "Re-entry";
    brandVersion.textContent = "for Codex";
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.setAttribute("aria-label", "Close request");
    noticeTitle.textContent = "Your approval lives in Re-entry";
    noticeReason.textContent = "Your account and connected Mac stay private from this Host.";
    review.type = "button";
    review.textContent = "Review in Re-entry";
    cancel.type = "button";
    cancel.textContent = "Not now";
    footerText.textContent = "Codex waits until Re-entry confirms";
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.setAttribute("aria-describedby", reasonId);
    dialog.setAttribute("aria-modal", "true");

    brandNameLine.append(brandName, brandVersion);
    brandCopy.append(eyebrow, brandNameLine);
    brand.append(brandCopy);
    topbar.append(brand, closeButton);
    noticeCopy.append(noticeTitle, noticeReason);
    notice.append(noticeCopy);
    actions.append(cancel, review);
    footer.append(footerText);
    surface.append(topbar, title, reason, notice, status, actions, footer);
    card.append(surface);
    dialog.append(style, card);
    documentRef.body.append(dialog);

    return new Promise((resolve) => {
      const onMessage = (event) => {
        if (
          event.origin !== consent.origin ||
          event.source !== active?.popup ||
          !isConsentCompletion(event.data, consentSessionId)
        ) {
          return;
        }
        settle(event.data.status === "approved" ? "approve" : "decline", event.data.status);
      };
      active = { dialog, resolve, popup: null, onMessage, popupTimer: null };
      windowRef.addEventListener("message", onMessage);
      review.addEventListener("click", openConsent);
      cancel.addEventListener("click", () => settle("cancel", "cancelled"), { once: true });
      closeButton.addEventListener("click", () => settle("cancel", "cancelled"), { once: true });
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault?.();
        settle("cancel", "cancelled");
      }, { once: true });
      dialog.showModal();

      function openConsent() {
        if (active?.popup && !active.popup.closed) {
          active.popup.focus?.();
          return;
        }
        const left = Math.max(0, Math.round((windowRef.screenX ?? 0) + ((windowRef.outerWidth ?? 960) - 560) / 2));
        const top = Math.max(0, Math.round((windowRef.screenY ?? 0) + ((windowRef.outerHeight ?? 780) - 720) / 2));
        const popup = windowRef.open(
          consent.href,
          `reentry-consent-${consentSessionId}`,
          `popup=yes,width=560,height=720,left=${left},top=${top}`,
        );
        if (!popup) {
          status.textContent = "Popup blocked. Allow popups for this site, then try again.";
          return;
        }
        active.popup = popup;
        status.textContent = "Re-entry is open. Complete the decision there.";
        review.textContent = "Return to Re-entry";
        active.popupTimer = windowRef.setInterval?.(() => {
          if (active?.popup?.closed) {
            windowRef.clearInterval?.(active.popupTimer);
            active.popupTimer = null;
            status.textContent = "Re-entry closed before a decision. Open it again when ready.";
            review.textContent = "Review in Re-entry";
          }
        }, 500);
      }
    });

    function settle(action, status) {
      if (active === undefined || active.dialog !== dialog) return;
      const current = active;
      active = undefined;
      cleanupPrompt(current, windowRef);
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      dialog.remove();
      current.resolve({ action, status });
    }
  }

  function close() {
    if (active === undefined) return;
    const current = active;
    active = undefined;
    cleanupPrompt(current, windowRef);
    if (current.dialog.open && typeof current.dialog.close === "function") current.dialog.close();
    current.dialog.remove();
    current.resolve({ action: "cancel", status: "cancelled" });
  }
}

/**
 * Create one browser action that can be called by ordinary page UI or used directly as a WebMCP
 * Site Tool execute handler.
 *
 * The first callback asks the Host server to create a signed consent session. A trusted popup
 * completion only allows the second callback to run; that callback must re-read Receiver status,
 * retain the opaque binding on the Host server, and return only a safe continuation identifier.
 */
export function createReentryConsentAction(options) {
  requireExactRecord(
    options,
    REENTRY_ACTION_OPTION_FIELDS,
    ["createConsentSession", "confirmConsentSession"],
    "Re-entry consent action options",
  );
  requireFunction(options.createConsentSession, "createConsentSession");
  requireFunction(options.confirmConsentSession, "confirmConsentSession");
  if (
    options.prompt !== undefined &&
    (!options.prompt || typeof options.prompt !== "object" || typeof options.prompt.show !== "function")
  ) {
    throw new TypeError("Re-entry consent action prompt requires show");
  }

  let active = false;
  let prompt = options.prompt;

  return Object.freeze(async function requestReentryConsent(input = {}) {
    requirePlainRecord(input, "Re-entry consent action input");
    if (active) throw new ReentryConsentActionError(
      "reentry_consent_action_active",
      "A Re-entry consent request is already open",
    );

    active = true;
    try {
      const session = await options.createConsentSession(input);
      requireExactRecord(
        session,
        REENTRY_ACTION_SESSION_FIELDS,
        REENTRY_ACTION_SESSION_FIELDS,
        "Re-entry consent session",
      );
      requireText(session.title, TITLE_MAX_BYTES, "Re-entry consent title");
      requireText(session.reason, REASON_MAX_BYTES, "Re-entry consent reason");
      requireConsentUrl(session.consentUrl);
      requirePromptIdentifier(session.consentSessionId);

      prompt ??= createReentryConsentPrompt();
      const decision = await prompt.show(session);
      const decisionStatus = requireActionDecision(decision);
      if (decisionStatus !== "approved") {
        return Object.freeze({ status: decisionStatus });
      }

      const confirmation = await options.confirmConsentSession({
        consentSessionId: session.consentSessionId,
      });
      requireExactRecord(
        confirmation,
        REENTRY_ACTION_CONFIRMATION_FIELDS,
        REENTRY_ACTION_CONFIRMATION_FIELDS,
        "Re-entry consent confirmation",
      );
      if (confirmation.status !== "approved") {
        throw new ReentryConsentActionError(
          "reentry_consent_not_confirmed",
          "Re-entry approval was not confirmed by the Host server",
        );
      }
      requirePromptIdentifier(confirmation.continuationId);
      return Object.freeze({
        status: "approved",
        continuationId: confirmation.continuationId,
      });
    } finally {
      active = false;
    }
  });
}

/**
 * Register a top-level JavaScript Site Tool when the current browser exposes WebMCP.
 *
 * The execute function should normally be the function returned by createReentryConsentAction, so
 * a human button and an Agent invocation enter exactly the same Host application logic.
 */
export async function registerReentryWebMcpTool(options) {
  requireExactRecord(
    options,
    WEBMCP_TOOL_OPTION_FIELDS,
    ["name", "description", "inputSchema", "execute"],
    "Re-entry WebMCP tool options",
  );
  if (typeof options.name !== "string" || !TOOL_NAME_PATTERN.test(options.name)) {
    throw new TypeError("Re-entry WebMCP tool name is invalid");
  }
  requireText(
    options.description,
    TOOL_DESCRIPTION_MAX_BYTES,
    "Re-entry WebMCP tool description",
  );
  requireWebMcpInputSchema(options.inputSchema);
  requireFunction(options.execute, "execute");
  if (options.annotations !== undefined) {
    requirePlainRecord(options.annotations, "Re-entry WebMCP tool annotations");
  }

  const documentRef = options.documentRef ?? globalThis.document;
  const registerTool = documentRef?.modelContext?.registerTool;
  if (typeof registerTool !== "function") {
    return Object.freeze({ registered: false, reason: "webmcp_unavailable" });
  }

  await registerTool.call(documentRef.modelContext, {
    name: options.name,
    description: options.description,
    inputSchema: options.inputSchema,
    ...(options.annotations === undefined ? {} : { annotations: options.annotations }),
    execute: options.execute,
  });
  return Object.freeze({ registered: true, name: options.name });
}

export class ReentryConsentActionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReentryConsentActionError";
    this.code = code;
  }
}

function cleanupPrompt(active, windowRef) {
  windowRef.removeEventListener?.("message", active.onMessage);
  if (active.popupTimer !== null) windowRef.clearInterval?.(active.popupTimer);
  if (active.popup && !active.popup.closed) active.popup.close?.();
}

function requireConsentUrl(value) {
  if (typeof value !== "string" || value.length > 2_048) {
    throw new TypeError("Re-entry consentUrl is invalid");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Re-entry consentUrl is invalid");
  }
  const loopback = ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (url.protocol === "http:" && !loopback) ||
    url.username ||
    url.password ||
    url.pathname !== "/consent" ||
    url.hash ||
    url.searchParams.getAll("token").length !== 1 ||
    [...url.searchParams.keys()].some((key) => key !== "token") ||
    !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get("token") ?? "")
  ) {
    throw new TypeError("Re-entry consentUrl is invalid");
  }
  return url;
}

function requirePromptIdentifier(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) {
    throw new TypeError("Re-entry consentSessionId is invalid");
  }
  return value;
}

function isConsentCompletion(value, consentSessionId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const fields = Object.keys(value);
  return fields.length === 3 &&
    fields.every((field) => ["type", "consent_session_id", "status"].includes(field)) &&
    value.type === "reentry.consent.complete" &&
    value.consent_session_id === consentSessionId &&
    ["approved", "declined"].includes(value.status);
}

function requireActionDecision(value) {
  requireExactRecord(
    value,
    ["action", "status"],
    ["action", "status"],
    "Re-entry consent prompt result",
  );
  let expectedAction;
  if (value.status === "approved") expectedAction = "approve";
  if (value.status === "declined") expectedAction = "decline";
  if (value.status === "cancelled") expectedAction = "cancel";
  if (value.action !== expectedAction) {
    throw new TypeError("Re-entry consent prompt result is invalid");
  }
  return value.status;
}

function requireWebMcpInputSchema(value) {
  requirePlainRecord(value, "Re-entry WebMCP inputSchema");
  if (value.type !== "object" || value.additionalProperties !== false) {
    throw new TypeError("Re-entry WebMCP inputSchema must be a closed object schema");
  }
  if (value.properties !== undefined) {
    requirePlainRecord(value.properties, "Re-entry WebMCP inputSchema properties");
  }
}

function requireFunction(value, label) {
  if (typeof value !== "function") {
    throw new TypeError(`Re-entry consent action requires ${label}`);
  }
}

function requirePlainRecord(value, label) {
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
