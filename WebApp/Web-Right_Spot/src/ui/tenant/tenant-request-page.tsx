"use client";

import { useEffect, useRef, useState } from "react";
import RolePageFrame from "../shared/role-page-frame";
import type {
  TenantRequestDto,
  TenantRequestResponse,
  WorkflowListingDto,
} from "../../shared/contracts/workflow-api";
import {
  confirmTenantRequest,
  createCommandId,
  createTenantDraft,
  declineTenantRequest,
  readTenantRequest,
  submitTenantRequest,
  tenantApiErrorMessage,
  updateTenantDraft,
} from "./tenant-api";
import type { TenantApiError } from "./tenant-api";
import { londonWallTimeToUtcIso, utcIsoToLondonInput } from "./tenant-request-time";
import styles from "./tenant.module.css";

export type TenantRequestConflictNotice = {
  tone: "status" | "error";
  message: string;
};

export default function TenantRequestPage() {
  const [data, setData] = useState<TenantRequestResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [conflictNotice, setConflictNotice] = useState<TenantRequestConflictNotice | null>(null);
  const [pendingResponse, setPendingResponse] = useState<"confirm" | "decline" | null>(null);
  const [pendingDraftMutation, setPendingDraftMutation] = useState(false);
  const latestReadId = useRef(0);

  function applyServerData(nextData: TenantRequestResponse, successMessage?: string) {
    latestReadId.current += 1;
    setData(nextData);
    setIsLoading(false);
    setConflictNotice(null);
    if (successMessage) setStatusMessage(successMessage);
  }

  function load(message?: string) {
    const readId = ++latestReadId.current;
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);
    setConflictNotice(null);
    void readTenantRequest()
      .then((nextData) => {
        if (readId !== latestReadId.current) return;
        applyServerData(nextData);
        if (message) setStatusMessage(message);
      })
      .catch((nextError: unknown) => {
        if (readId !== latestReadId.current) return;
        setError(nextError);
      })
      .finally(() => {
        if (readId !== latestReadId.current) return;
        setIsLoading(false);
      });
  }

  useEffect(() => { load(); }, []);

  function handleConflict(errorValue: unknown) {
    if (isTenantApiError(errorValue) && errorValue.status === 409) {
      load("The request changed on the server. This page was refreshed with the authoritative tenant view.");
      return;
    }
    setError(errorValue);
  }

  async function respond(type: "confirm" | "decline") {
    if (!data?.request || data.request.state !== "SLOT_PROPOSED") return;
    setStatusMessage(null);
    setError(null);
    setPendingResponse(type);
    try {
      const response = type === "confirm"
        ? await confirmTenantRequest({
            commandId: createCommandId("confirm-viewing"),
            fixtureGeneration: data.fixtureGeneration,
            expectedRequestVersion: data.request.version,
          })
        : await declineTenantRequest({
            commandId: createCommandId("decline-viewing"),
            fixtureGeneration: data.fixtureGeneration,
            expectedRequestVersion: data.request.version,
          });
      applyServerData(response);
      setStatusMessage(type === "confirm" ? "Viewing confirmed from the server response." : "Viewing declined from the server response.");
    } catch (errorValue: unknown) {
      handleConflict(errorValue);
    } finally {
      setPendingResponse(null);
    }
  }

  return (
    <RolePageFrame
      requiredRole="tenant"
      currentPath="/tenant/requests"
      title="Keep one request in view."
      eyebrow="Tenant request dashboard"
      description="Your request, the current response, and a safe status timeline stay together in one tenant projection."
    >
      {statusMessage ? <div className={styles.inlineSuccess} role="status">{statusMessage}</div> : null}
      {conflictNotice ? (
        <div
          className={conflictNotice.tone === "error" ? styles.inlineError : styles.inlineStatus}
          role={conflictNotice.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {conflictNotice.message}
        </div>
      ) : null}
      <div className={styles.toolbar}>
        <div>
          <span className={styles.toolbarLabel}>Current request view</span>
          <span className={styles.mutedCopy}>Read from the server-authoritative tenant projection</span>
        </div>
        <button className="button button-quiet" type="button" disabled={isLoading || pendingDraftMutation || pendingResponse !== null} onClick={() => load()}>Refresh</button>
      </div>
      {isLoading ? (
        <div className={`${styles.feedbackState} ${styles.loadingState}`} role="status" aria-live="polite" aria-busy="true">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Checking your request</h2>
            <p>RightSpot is reading the latest tenant-visible state and status history.</p>
          </div>
        </div>
      ) : null}
      {!isLoading && error ? (
        <div className={`${styles.feedbackState} ${styles.errorState}`} role="alert">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Request status is unavailable</h2>
            <p>{tenantApiErrorMessage(error, "load your request")}</p>
            <button className="button button-quiet" type="button" onClick={() => load()}>Retry request</button>
          </div>
        </div>
      ) : null}
      {!isLoading && !error && data ? (
        <RequestDashboard
          data={data}
          onSaved={applyServerData}
          onRespond={respond}
          pendingResponse={pendingResponse}
          onPendingChange={setPendingDraftMutation}
          onFeedbackChange={setStatusMessage}
          onConflictNotice={setConflictNotice}
        />
      ) : null}
    </RolePageFrame>
  );
}

type RequestDashboardProps = {
  data: TenantRequestResponse;
  onSaved: (data: TenantRequestResponse, successMessage?: string) => void;
  onRespond: (type: "confirm" | "decline") => void;
  pendingResponse: "confirm" | "decline" | null;
  onPendingChange?: (pending: boolean) => void;
  onFeedbackChange: (message: string | null) => void;
  onConflictNotice: (notice: TenantRequestConflictNotice) => void;
};

function RequestDashboard({ data, onSaved, onRespond, pendingResponse, onPendingChange, onFeedbackChange, onConflictNotice }: RequestDashboardProps) {
  if (!data.request || !data.listing) {
    return (
      <section className={`${styles.feedbackState} ${styles.emptyRequestState}`} aria-labelledby="empty-request-title">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <p className="eyebrow">No active request</p>
          <h2 id="empty-request-title">Start with one promising home</h2>
          <p>Browse the seeded listings, choose one place, save a draft, then submit the Viewing Request through a separate explicit action.</p>
          <a className="button button-primary" href="/tenant">Browse rentals</a>
          <details className={styles.technicalDisclosure}>
            <summary>Demo record details</summary>
            <p>Fixture generation {data.fixtureGeneration}</p>
          </details>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.requestLayout}>
      {data.request.state === "TENANT_DRAFT" ? (
        <TenantRequestEditor
          key={`${data.request.id}-${data.request.version}`}
          listing={data.listing}
          fixtureGeneration={data.fixtureGeneration}
          request={data.request}
          onSaved={onSaved}
          onPendingChange={onPendingChange}
          onFeedbackChange={onFeedbackChange}
          onConflictNotice={onConflictNotice}
        />
      ) : null}
      <section className={styles.requestCard} aria-labelledby="request-status-title">
        <div className={styles.requestHeading}>
          <div>
            <p className="eyebrow">Current Viewing Request</p>
            <h2 id="request-status-title">{formatState(data.request.state)}</h2>
            <p className={styles.statusGuidance}>{stateGuidance(data.request.state)}</p>
          </div>
          <span className={styles.stateBadge} aria-label={`Request state: ${formatState(data.request.state)}`}>
            {formatState(data.request.state)}
          </span>
        </div>

        <a className={styles.requestListing} href={`/tenant/listings/${encodeURIComponent(data.listing.id)}`}>
          <span>Requested home</span>
          <strong>{data.listing.title}</strong>
          <span>{data.listing.area} · £{data.listing.monthlyRentGbp.toLocaleString("en-GB")} per month</span>
        </a>

        <dl className={styles.requestFacts}>
          <div>
            <dt>Preferred viewing times</dt>
            <dd>
              <ul className={styles.preferredTimeList}>
                {data.request.preferredTimes.map((time, index) => <li key={`${time}-${index}`}>{formatDateTime(time)}</li>)}
              </ul>
            </dd>
          </div>
        </dl>
        {data.request.tenantNote ? (
          <div className={styles.noteBlock}>
            <strong>Your note to the property agent</strong>
            <p>{data.request.tenantNote}</p>
          </div>
        ) : null}
        <TenantResponse state={data.request.state}
          response={data.request.response}
          viewingSlot={data.request.viewingSlot}
          expiresAt={data.request.proposalExpiresAt}
        />
        {data.request.state === "SLOT_PROPOSED" && data.request.viewingSlot ? (
          <section className={styles.decisionPanel} aria-labelledby="tenant-decision-title">
            <p className="eyebrow">Your decision</p>
            <h3 id="tenant-decision-title">Does the proposed viewing work?</h3>
            <p>Confirm or decline the proposal explicitly. RightSpot will use the latest server version for the decision.</p>
            <div className={styles.formActions}>
              <button className="button button-primary" type="button" disabled={pendingResponse !== null} onClick={() => onRespond("confirm")}>
                {pendingResponse === "confirm" ? "Confirming…" : "Confirm proposed viewing"}
              </button>
              <button className="button button-quiet" type="button" disabled={pendingResponse !== null} onClick={() => onRespond("decline")}>
                {pendingResponse === "decline" ? "Declining…" : "Decline proposed viewing"}
              </button>
            </div>
          </section>
        ) : data.request.state === "SLOT_PROPOSED" ? (
          <p className={styles.readOnlyNote} role="alert">The proposed viewing time is unavailable. Refresh before deciding.</p>
        ) : data.request.state !== "TENANT_DRAFT" ? (
          <p className={styles.readOnlyNote}>There is no tenant action to take in this state. Refresh for the latest response or reset the demo fixture outside this workspace.</p>
        ) : null}

        <details className={styles.technicalDisclosure}>
          <summary>Demo record details</summary>
          <dl className={styles.technicalFacts}>
            <div><dt>Workflow state</dt><dd>{data.request.state}</dd></div>
            <div><dt>Request version</dt><dd>{data.request.version}</dd></div>
            <div><dt>Fixture generation</dt><dd>{data.fixtureGeneration}</dd></div>
          </dl>
        </details>
      </section>
      <Timeline entries={data.timeline} />
    </div>
  );
}

export function TenantRequestEditor({
  listing,
  fixtureGeneration,
  request,
  onSaved,
  onPendingChange,
  onFeedbackChange,
  onConflictNotice,
}: {
  listing: WorkflowListingDto;
  fixtureGeneration: number;
  request: TenantRequestDto | null;
  onSaved: (data: TenantRequestResponse, successMessage?: string) => void;
  onPendingChange?: (pending: boolean) => void;
  onFeedbackChange?: (message: string | null) => void;
  onConflictNotice: (notice: TenantRequestConflictNotice) => void;
}) {
  const [times, setTimes] = useState(() => request?.preferredTimes.map(toInputDateTime) ?? [""]);
  const [tenantNote, setTenantNote] = useState(request?.tenantNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [savedSignature, setSavedSignature] = useState(() => signature(times, tenantNote));
  const dirty = savedSignature !== signature(times, tenantNote);

  function updateTime(index: number, value: string) {
    setTimes(times.map((time, currentIndex) => currentIndex === index ? value : time));
    setError(null);
    onFeedbackChange?.(null);
  }

  function validateTimes(): string[] | null {
    if (times.length < 1 || times.length > 3 || times.some((time) => !time)) {
      setError("Add one to three preferred times before saving the draft.");
      return null;
    }
    const isoTimes: string[] = [];
    for (const time of times) {
      try {
        isoTimes.push(londonWallTimeToUtcIso(time));
      } catch (errorValue: unknown) {
        setError(errorValue instanceof Error ? errorValue.message : "Each preferred time must be a valid date and time.");
        return null;
      }
    }
    if (isoTimes.some((time, index) => index > 0 && time <= isoTimes[index - 1]!)) {
      setError("Preferred times must be in strictly increasing order; duplicate times are not accepted.");
      return null;
    }
    return isoTimes;
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFeedbackChange?.(null);
    const preferredTimes = validateTimes();
    if (!preferredTimes) return;
    setIsPending(true);
    onPendingChange?.(true);
    setError(null);
    try {
      const response = request
        ? await updateTenantDraft({
            commandId: createCommandId("update-draft"),
            fixtureGeneration,
            expectedRequestVersion: request.version,
            expectedListingVersion: listing.version,
            preferredTimes,
            ...(tenantNote.trim() ? { tenantNote: tenantNote.trim() } : {}),
          })
        : await createTenantDraft({
            commandId: createCommandId("create-draft"),
            fixtureGeneration,
            listingId: listing.id,
            expectedListingVersion: listing.version,
            preferredTimes,
            ...(tenantNote.trim() ? { tenantNote: tenantNote.trim() } : {}),
          });
      setSavedSignature(signature(times, tenantNote));
      onSaved(response, "Draft saved from the server response. Review it, then submit explicitly.");
    } catch (errorValue: unknown) {
      await handleMutationError(errorValue, "save the draft");
    } finally {
      setIsPending(false);
      onPendingChange?.(false);
    }
  }

  async function submitDraft() {
    if (!request || request.state !== "TENANT_DRAFT" || dirty) return;
    setIsPending(true);
    onPendingChange?.(true);
    setError(null);
    onFeedbackChange?.(null);
    try {
      const response = await submitTenantRequest({
        commandId: createCommandId("submit-request"),
        fixtureGeneration,
        expectedRequestVersion: request.version,
        expectedListingVersion: listing.version,
      });
      onSaved(response, "Viewing Request submitted from the server response.");
    } catch (errorValue: unknown) {
      await handleMutationError(errorValue, "submit the request");
    } finally {
      setIsPending(false);
      onPendingChange?.(false);
    }
  }

  async function handleMutationError(errorValue: unknown, action: string) {
    if (isTenantApiError(errorValue) && errorValue.status === 409) {
      try {
        const refreshed = await readTenantRequest();
        onSaved(refreshed);
        onConflictNotice({
          tone: "status",
          message: "The request changed on the server. The latest tenant view is shown; review it before trying again.",
        });
      } catch {
        onConflictNotice({
          tone: "error",
          message: "The request changed on the server, but the latest tenant view could not be refreshed. Reload this page before trying again.",
        });
      }
      return;
    }
    setError(tenantApiErrorMessage(errorValue, action));
  }

  return (
    <section className={styles.editorCard} aria-labelledby="request-editor-title">
      <div className={styles.editorHeading}>
        <div>
          <p className="eyebrow">Viewing Request draft</p>
          <h2 id="request-editor-title">Choose times the agent can act on</h2>
        </div>
        <span className={styles.draftBadge}>{request ? "Saved draft" : "New draft"}</span>
      </div>
      <p className={styles.editorIntro}>Use Europe/London times. Saving keeps the request as a draft; submission remains a separate, visible action.</p>
      <form onSubmit={saveDraft}>
        <fieldset className={styles.fieldset} disabled={isPending}>
          <legend>Preferred viewing times</legend>
          <p className={styles.fieldHint}>Add one to three options in chronological order so the property agent can compare them quickly.</p>
          {times.map((time, index) => (
            <div className={styles.timeRow} key={`time-${index}`}>
              <label>
                Option {index + 1}
                <input type="datetime-local" value={time} onChange={(event) => updateTime(index, event.target.value)} />
              </label>
              {times.length > 1 ? (
                <button
                  className="button button-quiet"
                  type="button"
                  aria-label={`Remove preferred viewing time option ${index + 1}`}
                  onClick={() => {
                    setTimes(times.filter((_, currentIndex) => currentIndex !== index));
                    setError(null);
                    onFeedbackChange?.(null);
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          {times.length < 3 ? <button className="button button-quiet" type="button" onClick={() => { setTimes([...times, ""]); onFeedbackChange?.(null); }}>Add another time</button> : null}
          <label className={styles.noteField}>
            Note for the property agent (optional)
            <textarea maxLength={500} rows={4} value={tenantNote} onChange={(event) => { setTenantNote(event.target.value); setError(null); onFeedbackChange?.(null); }} />
            <span>Keep this to access or scheduling information the agent needs.</span>
          </label>
        </fieldset>
        {error ? <div className={styles.inlineError} role="alert">{error}</div> : null}
        <div className={styles.editorActions} aria-label="Draft and submission actions">
          <div className={styles.actionStep}>
            <div className={styles.actionStepCopy}>
              <span aria-hidden="true">01</span>
              <div><strong>Save the draft</strong><p>Keep the times editable and review the server response.</p></div>
            </div>
            <button className="button button-quiet" type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save draft"}</button>
          </div>
          <div className={`${styles.actionStep} ${styles.submitStep}`}>
            <div className={styles.actionStepCopy}>
              <span aria-hidden="true">02</span>
              <div><strong>Submit to the agent</strong><p>This explicit action moves the saved draft into review.</p></div>
            </div>
            <button className="button button-primary" type="button" disabled={isPending || !request || request.state !== "TENANT_DRAFT" || dirty} onClick={submitDraft}>
              {isPending ? "Working…" : dirty ? "Save before submit" : "Submit Viewing Request"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function TenantResponse({
  state,
  response,
  viewingSlot,
  expiresAt,
}: {
  state: TenantRequestDto["state"];
  response?: TenantRequestDto["response"];
  viewingSlot?: TenantRequestDto["viewingSlot"];
  expiresAt?: string;
}) {
  if (!response) return null;
  const presentation = tenantResponsePresentation(state, response);
  if (!presentation) return null;
  const hasViewingSlot = response.kind === "SLOT_PROPOSAL" && viewingSlot !== undefined;
  return (
    <section className={styles.responseBlock} aria-labelledby="tenant-response-title">
      <div className={styles.responseHeading}>
        <div>
          <p className="eyebrow">Property agent response</p>
          <h3 id="tenant-response-title">{presentation.heading}</h3>
        </div>
        <span>{presentation.badge}</span>
      </div>
      {hasViewingSlot ? (
        <p className={styles.slotReference}>
          <span>{state === "SLOT_PROPOSED" ? "Proposed viewing time:" : "Recorded viewing time:"}</span>
          {" "}
          <strong>
            <time dateTime={viewingSlot.startsAt} aria-label={formatViewingSlot(viewingSlot.startsAt, viewingSlot.endsAt)}>
              {formatViewingSlot(viewingSlot.startsAt, viewingSlot.endsAt)}
            </time>
          </strong>
        </p>
      ) : response.kind === "SLOT_PROPOSAL" ? (
        <p className={styles.inlineError} role="alert">
          {state === "SLOT_PROPOSED"
            ? "The proposed viewing time is unavailable. Refresh before deciding."
            : "The recorded viewing time is unavailable. Refresh before relying on this response."}
        </p>
      ) : null}
      {response.tenantNote ? <p className={styles.responseNote}>{response.tenantNote}</p> : null}
      {presentation.showDeadline && expiresAt && hasViewingSlot ? <p className={styles.responseDeadline}><span>Respond by</span><strong>{formatDateTime(expiresAt)}</strong></p> : null}
    </section>
  );
}

type TenantResponsePresentation = {
  heading: string;
  badge: string;
  showDeadline: boolean;
};

function tenantResponsePresentation(
  state: TenantRequestDto["state"],
  response: NonNullable<TenantRequestDto["response"]>,
): TenantResponsePresentation | null {
  switch (state) {
    case "SLOT_PROPOSED":
      if (response.kind !== "SLOT_PROPOSAL") return null;
      return { heading: "A viewing slot was proposed", badge: "Action needed", showDeadline: true };
    case "VIEWING_CONFIRMED":
      if (response.kind !== "SLOT_PROPOSAL") return null;
      return { heading: "Viewing slot confirmed", badge: "Decision recorded", showDeadline: false };
    case "TENANT_DECLINED":
      if (response.kind !== "SLOT_PROPOSAL") return null;
      return { heading: "Viewing proposal declined", badge: "Decision recorded", showDeadline: false };
    case "EXPIRED":
      if (response.kind !== "SLOT_PROPOSAL") return null;
      return { heading: "Viewing proposal expired", badge: "Closed", showDeadline: false };
    case "AGENT_DECLINED":
      if (response.kind === "AGENT_DECLINE") {
        return { heading: "The agent declined this request", badge: "Response received", showDeadline: false };
      }
      return null;
    case "TENANT_DRAFT":
    case "REQUEST_SUBMITTED":
    case "AGENT_REVIEWING":
      return null;
  }
}

function Timeline({ entries }: { entries: TenantRequestResponse["timeline"] }) {
  return (
    <section className={styles.timelineCard} aria-labelledby="timeline-title">
      <p className="eyebrow">Status history</p>
      <h2 id="timeline-title">What changed</h2>
      <p className={styles.timelineIntro}>A compact tenant-safe record of each committed request transition.</p>
      {entries.length === 0 ? <p className={styles.mutedCopy}>No request events yet.</p> : (
        <ol className={styles.timelineList}>
          {entries.map((entry) => (
            <li key={`${entry.sequence}-${entry.requestVersion}`}>
              <span className={styles.timelineIndex}>{String(entry.sequence).padStart(2, "0")}</span>
              <div>
                <strong>{formatState(entry.toState)}</strong>
                <span>{entry.operation.replaceAll("_", " ")}</span>
                <small>Request version {entry.requestVersion}</small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function signature(times: string[], note: string): string {
  return JSON.stringify({ times, note });
}

function toInputDateTime(value: string): string {
  return utcIsoToLondonInput(value);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(date);
}

function formatViewingSlot(startsAt: string, endsAt: string): string {
  const endTime = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(endsAt));
  return `${formatDateTime(startsAt)}–${endTime}`;
}

function formatState(state: string): string {
  return state.toLowerCase().replaceAll("_", " ");
}

function stateGuidance(state: TenantRequestDto["state"]): string {
  switch (state) {
    case "TENANT_DRAFT":
      return "Review the saved details, then use the separate submit action when the request is ready.";
    case "REQUEST_SUBMITTED":
      return "The request has been sent and is waiting for the property agent to begin review.";
    case "AGENT_REVIEWING":
      return "The property agent is reviewing the request and the available viewing options.";
    case "SLOT_PROPOSED":
      return "The property agent has proposed a slot. Review the response and make your decision below.";
    case "VIEWING_CONFIRMED":
      return "The proposed viewing has been confirmed. This request is now complete.";
    case "TENANT_DECLINED":
      return "You declined the proposed viewing. This request is now complete.";
    case "EXPIRED":
      return "The proposal deadline passed before a tenant decision was recorded.";
    case "AGENT_DECLINED":
      return "The property agent declined this request and included any tenant-visible response below.";
  }
}

function isTenantApiError(error: unknown): error is TenantApiError {
  return error instanceof Error && error.name === "TenantApiError";
}
