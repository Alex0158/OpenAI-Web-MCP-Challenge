"use client";

import { useEffect, useState } from "react";
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
import styles from "./tenant.module.css";

export default function TenantRequestPage() {
  const [data, setData] = useState<TenantRequestResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingResponse, setPendingResponse] = useState<"confirm" | "decline" | null>(null);

  function load(message?: string) {
    setIsLoading(true);
    setError(null);
    void readTenantRequest()
      .then((nextData) => {
        setData(nextData);
        if (message) setStatusMessage(message);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
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
      setData(response);
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
      <div className={styles.toolbar}>
        <span className={styles.mutedCopy}>Server-authoritative request view</span>
        <button className="button button-quiet" type="button" onClick={() => load()}>Refresh</button>
      </div>
      {isLoading ? <div className={styles.loadingState} role="status" aria-busy="true">Loading your request…</div> : null}
      {!isLoading && error ? (
        <div className={styles.emptyState} role="alert">
          <h2>Request status is unavailable</h2>
          <p>{tenantApiErrorMessage(error, "load your request")}</p>
          <button className="button button-quiet" type="button" onClick={() => load()}>Retry</button>
        </div>
      ) : null}
      {!isLoading && !error && data ? (
        <RequestDashboard data={data} onSaved={setData} onRespond={respond} pendingResponse={pendingResponse} />
      ) : null}
    </RolePageFrame>
  );
}

type RequestDashboardProps = {
  data: TenantRequestResponse;
  onSaved: (data: TenantRequestResponse) => void;
  onRespond: (type: "confirm" | "decline") => void;
  pendingResponse: "confirm" | "decline" | null;
};

function RequestDashboard({ data, onSaved, onRespond, pendingResponse }: RequestDashboardProps) {
  if (!data.request || !data.listing) {
    return (
      <section className={styles.emptyState} aria-labelledby="empty-request-title">
        <p className="eyebrow">No active request</p>
        <h2 id="empty-request-title">Your request dashboard is ready</h2>
        <p>Browse the seeded listings to choose one place, save a draft, and explicitly submit a Viewing Request.</p>
        <a className="button button-primary" href="/tenant">Browse listings</a>
        <p className={styles.technicalNote}>Fixture generation {data.fixtureGeneration}</p>
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
        />
      ) : null}
      <section className={styles.requestCard} aria-labelledby="request-status-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Viewing Request</p>
            <h2 id="request-status-title">{formatState(data.request.state)}</h2>
          </div>
          <span className={styles.stateBadge}>{data.request.state}</span>
        </div>
        <p className={styles.mutedCopy}>{data.listing.title} · {data.listing.area} · £{data.listing.monthlyRentGbp.toLocaleString("en-GB")} / month</p>
        <dl className={styles.requestFacts}>
          <div><dt>Preferred times</dt><dd>{data.request.preferredTimes.map(formatDateTime).join(" · ")}</dd></div>
          <div><dt>Request version</dt><dd>{data.request.version}</dd></div>
          <div><dt>Fixture generation</dt><dd>{data.fixtureGeneration}</dd></div>
        </dl>
        {data.request.tenantNote ? <p className={styles.noteBlock}><strong>Your note</strong>{data.request.tenantNote}</p> : null}
        <TenantResponse response={data.request.response} expiresAt={data.request.proposalExpiresAt} />
        {data.request.state === "SLOT_PROPOSED" ? (
          <div className={styles.formActions}>
            <button className="button button-primary" type="button" disabled={pendingResponse !== null} onClick={() => onRespond("confirm")}>
              {pendingResponse === "confirm" ? "Confirming…" : "Confirm proposed viewing"}
            </button>
            <button className="button button-quiet" type="button" disabled={pendingResponse !== null} onClick={() => onRespond("decline")}>
              {pendingResponse === "decline" ? "Declining…" : "Decline proposed viewing"}
            </button>
          </div>
        ) : data.request.state !== "TENANT_DRAFT" ? (
          <p className={styles.readOnlyNote}>This request is read-only until the fixture is reset.</p>
        ) : null}
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
}: {
  listing: WorkflowListingDto;
  fixtureGeneration: number;
  request: TenantRequestDto | null;
  onSaved: (data: TenantRequestResponse) => void;
}) {
  const [times, setTimes] = useState(() => request?.preferredTimes.map(toInputDateTime) ?? [""]);
  const [tenantNote, setTenantNote] = useState(request?.tenantNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [savedSignature, setSavedSignature] = useState(() => signature(times, tenantNote));
  const dirty = savedSignature !== signature(times, tenantNote);

  function updateTime(index: number, value: string) {
    setTimes(times.map((time, currentIndex) => currentIndex === index ? value : time));
    setError(null);
    setStatusMessage(null);
  }

  function validateTimes(): string[] | null {
    if (times.length < 1 || times.length > 3 || times.some((time) => !time)) {
      setError("Add one to three preferred times before saving the draft.");
      return null;
    }
    const isoTimes: string[] = [];
    for (const time of times) {
      const date = new Date(time);
      if (Number.isNaN(date.valueOf())) {
        setError("Each preferred time must be a valid date and time.");
        return null;
      }
      isoTimes.push(date.toISOString());
    }
    if (isoTimes.some((time, index) => index > 0 && time <= isoTimes[index - 1]!)) {
      setError("Preferred times must be in strictly increasing order; duplicate times are not accepted.");
      return null;
    }
    return isoTimes;
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const preferredTimes = validateTimes();
    if (!preferredTimes) return;
    setIsPending(true);
    setError(null);
    setStatusMessage(null);
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
      onSaved(response);
      setSavedSignature(signature(times, tenantNote));
      setStatusMessage("Draft saved from the server response. Review it, then submit explicitly.");
    } catch (errorValue: unknown) {
      await handleMutationError(errorValue, "save the draft");
    } finally {
      setIsPending(false);
    }
  }

  async function submitDraft() {
    if (!request || request.state !== "TENANT_DRAFT" || dirty) return;
    setIsPending(true);
    setError(null);
    setStatusMessage(null);
    try {
      const response = await submitTenantRequest({
        commandId: createCommandId("submit-request"),
        fixtureGeneration,
        expectedRequestVersion: request.version,
        expectedListingVersion: listing.version,
      });
      onSaved(response);
      setStatusMessage("Viewing Request submitted from the server response.");
    } catch (errorValue: unknown) {
      await handleMutationError(errorValue, "submit the request");
    } finally {
      setIsPending(false);
    }
  }

  async function handleMutationError(errorValue: unknown, action: string) {
    if (isTenantApiError(errorValue) && errorValue.status === 409) {
      try {
        onSaved(await readTenantRequest());
      } catch {
        // Keep the bounded stale message visible when the refetch itself fails.
      }
      setError("This draft is stale or the request changed. The tenant view was refreshed; review it before trying again.");
      return;
    }
    setError(tenantApiErrorMessage(errorValue, action));
  }

  return (
    <section className={styles.editorCard} aria-labelledby="request-editor-title">
      <p className="eyebrow">Viewing Request draft</p>
      <h2 id="request-editor-title">Choose times the agent can act on</h2>
      <p className={styles.mutedCopy}>Use Europe/London times. Save the draft first; submission is a separate, visible action.</p>
      <form onSubmit={saveDraft}>
        <fieldset className={styles.fieldset} disabled={isPending}>
          <legend>Preferred viewing times</legend>
          {times.map((time, index) => (
            <div className={styles.timeRow} key={`time-${index}`}>
              <label>
                Option {index + 1}
                <input type="datetime-local" value={time} onChange={(event) => updateTime(index, event.target.value)} />
              </label>
              {times.length > 1 ? <button className="button button-quiet" type="button" onClick={() => setTimes(times.filter((_, currentIndex) => currentIndex !== index))}>Remove</button> : null}
            </div>
          ))}
          {times.length < 3 ? <button className="button button-quiet" type="button" onClick={() => setTimes([...times, ""])}>Add another time</button> : null}
          <label>
            Note for the property agent (optional)
            <textarea maxLength={500} rows={4} value={tenantNote} onChange={(event) => { setTenantNote(event.target.value); setError(null); setStatusMessage(null); }} />
          </label>
        </fieldset>
        {error ? <div className={styles.inlineError} role="alert">{error}</div> : null}
        {statusMessage ? <div className={styles.inlineSuccess} role="status">{statusMessage}</div> : null}
        <div className={styles.formActions}>
          <button className="button button-primary" type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save draft"}</button>
          <button className="button button-quiet" type="button" disabled={isPending || !request || request.state !== "TENANT_DRAFT" || dirty} onClick={submitDraft}>
            {isPending ? "Working…" : dirty ? "Save before submit" : "Submit Viewing Request"}
          </button>
        </div>
      </form>
    </section>
  );
}

function TenantResponse({ response, expiresAt }: { response?: TenantRequestDto["response"]; expiresAt?: string }) {
  if (!response) return null;
  return (
    <div className={styles.responseBlock}>
      <p className="eyebrow">Tenant-visible response</p>
      <h3>{response.kind === "SLOT_PROPOSAL" ? "A viewing slot was proposed" : "The agent declined this request"}</h3>
      {response.kind === "SLOT_PROPOSAL" ? <p>Slot reference: <code>{response.slotId}</code></p> : null}
      {response.tenantNote ? <p>{response.tenantNote}</p> : null}
      {expiresAt ? <p className={styles.mutedCopy}>Response deadline: {formatDateTime(expiresAt)}</p> : null}
    </div>
  );
}

function Timeline({ entries }: { entries: TenantRequestResponse["timeline"] }) {
  return (
    <section className={styles.timelineCard} aria-labelledby="timeline-title">
      <p className="eyebrow">Status history</p>
      <h2 id="timeline-title">What changed</h2>
      {entries.length === 0 ? <p className={styles.mutedCopy}>No request events yet.</p> : (
        <ol className={styles.timelineList}>
          {entries.map((entry) => (
            <li key={`${entry.sequence}-${entry.requestVersion}`}>
              <span className={styles.timelineIndex}>{entry.sequence}</span>
              <div><strong>{formatState(entry.toState)}</strong><span>{entry.operation.replaceAll("_", " ")} · version {entry.requestVersion}</span></div>
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
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(date);
}

function formatState(state: string): string {
  return state.toLowerCase().replaceAll("_", " ");
}

function isTenantApiError(error: unknown): error is TenantApiError {
  return error instanceof Error && error.name === "TenantApiError";
}
