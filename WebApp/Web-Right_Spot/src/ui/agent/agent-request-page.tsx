"use client";

import { useCallback, useEffect, useState } from "react";

import RolePageFrame from "../shared/role-page-frame";
import StatusBanner from "../shared/status-banner";
import {
  AgentApiError,
  prepareAgentResponse,
  readAgentRequest,
  sendAgentResponse,
  startAgentReview,
  type AgentRequestResponse,
  type WorkflowResponseDto,
} from "./agent-api";
import { agentErrorMessage } from "./agent-dashboard-page";
import styles from "./agent.module.css";

type AgentRequestPageProps = {
  requestId: string;
};

type PreparationKind = WorkflowResponseDto["kind"];

export default function AgentRequestPage({ requestId }: AgentRequestPageProps) {
  return (
    <RolePageFrame
      requiredRole="agent"
      currentPath={`/agent/requests/${requestId}`}
      title="Request workspace"
      eyebrow="Property agent workspace"
      description="Read the current request, prepare a bounded response, and make the send decision yourself."
    >
      <AgentRequestWorkspace requestId={requestId} />
    </RolePageFrame>
  );
}

function AgentRequestWorkspace({ requestId }: AgentRequestPageProps) {
  const [detail, setDetail] = useState<AgentRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);
  const [mutation, setMutation] = useState<"review" | "prepare" | "send" | null>(null);
  const [preparationKind, setPreparationKind] = useState<PreparationKind>("SLOT_PROPOSAL");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [tenantNote, setTenantNote] = useState("");
  const [internalReviewNote, setInternalReviewNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadDetail = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    setConflictNotice(null);

    try {
      setDetail(await readAgentRequest(requestId));
    } catch (caught: unknown) {
      setError(agentErrorMessage(caught, "detail"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadDetail("initial");
  }, [loadDetail]);

  useEffect(() => {
    const prepared = detail?.request.preparedResponse;
    if (!prepared) {
      setPreparationKind("SLOT_PROPOSAL");
      setSelectedSlotId("");
      setTenantNote("");
      return;
    }
    setPreparationKind(prepared.kind);
    setSelectedSlotId(prepared.kind === "SLOT_PROPOSAL" ? prepared.slotId : "");
    setTenantNote(prepared.tenantNote ?? "");
    setInternalReviewNote(detail?.request.internalReviewNote ?? "");
  }, [detail?.request.preparedResponse, detail?.request.internalReviewNote]);

  async function handleStartReview() {
    if (!detail) return;
    setConflictNotice(null);
    setMutation("review");
    setError(null);
    setNotice(null);
    try {
      const response = await startAgentReview(requestId, {
        fixtureGeneration: detail.fixtureGeneration,
        expectedRequestVersion: detail.request.version,
      });
      setDetail(response);
      setNotice("Review started. The request remains visible as in review until you prepare a response.");
    } catch (caught: unknown) {
      await handleMutationError(caught);
    } finally {
      setMutation(null);
    }
  }

  async function handlePrepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setFormError(null);

    if (preparationKind === "SLOT_PROPOSAL") {
      const slot = detail.availability.find((candidate) => candidate.id === selectedSlotId);
      if (!slot || slot.status !== "AVAILABLE") {
        setFormError("Choose one of the currently available slots before preparing a proposal.");
        return;
      }
    }
    if (tenantNote.trim().length === 0 && tenantNote.length > 0) {
      setFormError("The tenant-facing note must contain visible text or be cleared.");
      return;
    }
    if (internalReviewNote.trim().length === 0 && internalReviewNote.length > 0) {
      setFormError("The internal review note must contain visible text or be cleared.");
      return;
    }

    const preparation: WorkflowResponseDto = preparationKind === "SLOT_PROPOSAL"
      ? {
          kind: "SLOT_PROPOSAL",
          slotId: selectedSlotId,
          ...(tenantNote.length > 0 ? { tenantNote } : {}),
        }
      : {
          kind: "AGENT_DECLINE",
          ...(tenantNote.length > 0 ? { tenantNote } : {}),
        };

    setConflictNotice(null);
    setMutation("prepare");
    setError(null);
    setNotice(null);
    try {
      const response = await prepareAgentResponse(requestId, {
        fixtureGeneration: detail.fixtureGeneration,
        expectedRequestVersion: detail.request.version,
        preparation,
        ...(internalReviewNote.length > 0 ? { internalReviewNote } : {}),
      });
      setDetail(response);
      setNotice("Response prepared. Nothing has been sent to the tenant yet.");
    } catch (caught: unknown) {
      await handleMutationError(caught);
    } finally {
      setMutation(null);
    }
  }

  async function handleSend() {
    if (!detail?.request.preparedResponse) return;
    setConflictNotice(null);
    setMutation("send");
    setError(null);
    setNotice(null);
    try {
      const response = await sendAgentResponse(requestId, {
        fixtureGeneration: detail.fixtureGeneration,
        expectedRequestVersion: detail.request.version,
      });
      setDetail(response);
      setNotice(response.request.state === "SLOT_PROPOSED"
        ? "Proposal sent. The tenant can now respond to the available viewing time."
        : "Decline sent. The request is now complete for this fixture.");
    } catch (caught: unknown) {
      await handleMutationError(caught);
    } finally {
      setMutation(null);
    }
  }

  async function handleMutationError(caught: unknown) {
    if (caught instanceof AgentApiError && caught.status === 409) {
      try {
        const refreshed = await readAgentRequest(requestId);
        setDetail(refreshed);
        setError(null);
        setConflictNotice("The workflow changed before that action completed. The latest request state is shown below.");
      } catch (refreshError: unknown) {
        setConflictNotice(null);
        setError(agentErrorMessage(refreshError, "detail"));
      }
      return;
    }
    setError(agentErrorMessage(caught, "detail"));
  }

  const hasPreparedResponse = Boolean(detail?.request.preparedResponse);
  const canPrepare = detail?.request.state === "AGENT_REVIEWING";
  const canSend = canPrepare && hasPreparedResponse;

  return (
    <section className={styles.workspace} aria-labelledby="request-heading">
      <div className={styles.workspaceHeader}>
        <div className={styles.headerCopy}>
          <p className="eyebrow">Viewing request desk</p>
          <h2 id="request-heading">Check the facts before you act</h2>
          <p className="panel-copy">The server owns the current request state. Review the tenant context and availability here, then prepare and send in separate steps.</p>
        </div>
        <div className={styles.headerActions}>
          <a className="button button-quiet" href="/agent">Back to queue</a>
          <button
            className="button button-quiet"
            type="button"
            onClick={() => void loadDetail("refresh")}
            disabled={isLoading || isRefreshing || mutation !== null}
          >
            {isRefreshing ? "Refreshing…" : "Refresh request"}
          </button>
        </div>
      </div>

      {error || notice || conflictNotice ? (
        <div className={styles.feedbackStack}>
          {error ? <StatusBanner tone="error" message={error} /> : null}
          {notice ? <StatusBanner tone="success" message={notice} /> : null}
          {conflictNotice ? <StatusBanner tone="info" message={conflictNotice} /> : null}
        </div>
      ) : null}

      {isLoading || isRefreshing ? (
        <RequestLoading />
      ) : !error && detail ? (
        <>
          <RequestSummary detail={detail} />
          {detail.request.state === "REQUEST_SUBMITTED" ? (
            <section className={`${styles.actionPanel} ${styles.stepPanel}`} aria-labelledby="start-review-heading">
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber} aria-hidden="true">1</span>
                <div>
                  <p className="eyebrow">Step 1 of 3</p>
                  <h3 id="start-review-heading">Start review</h3>
                </div>
              </div>
              <p className="panel-copy">Opening this workspace did not change the request. Start review when you are ready to inspect and prepare a response.</p>
              <div className={styles.actionFooter}>
                <p>This records that an assigned agent has begun review. It does not contact the tenant.</p>
                <button className="button button-primary" type="button" onClick={() => void handleStartReview()} disabled={mutation !== null}>
                  {mutation === "review" ? "Starting review…" : "Start review"}
                </button>
              </div>
            </section>
          ) : null}
          {canPrepare ? (
            <PreparationPanel
              detail={detail}
              preparationKind={preparationKind}
              selectedSlotId={selectedSlotId}
              tenantNote={tenantNote}
              internalReviewNote={internalReviewNote}
              formError={formError}
              mutation={mutation}
              onKindChange={setPreparationKind}
              onSlotChange={setSelectedSlotId}
              onTenantNoteChange={setTenantNote}
              onInternalNoteChange={setInternalReviewNote}
              onSubmit={handlePrepare}
            />
          ) : null}
          {canSend ? (
            <section className={`${styles.actionPanel} ${styles.consequencePanel}`} aria-labelledby="send-response-heading">
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber} aria-hidden="true">3</span>
                <div>
                  <p className="eyebrow">Step 3 of 3 · human decision</p>
                  <h3 id="send-response-heading">Send the prepared response</h3>
                </div>
                <span className={styles.consequenceBadge}>Consequential action</span>
              </div>
              <p className="panel-copy">Review exactly what the tenant will receive. Preparation remains agent-only until you use the send control below.</p>
              <PreparedSendSummary detail={detail} />
              <div className={styles.sendBoundary}>
                <p><strong>Nothing is sent automatically.</strong> This action changes the request and cannot be undone in this fixture.</p>
                <button className="button button-primary" type="button" onClick={() => void handleSend()} disabled={mutation !== null}>
                  {mutation === "send" ? "Sending to tenant…" : "Send response to tenant"}
                </button>
              </div>
            </section>
          ) : null}
          {detail.request.state !== "REQUEST_SUBMITTED" && !canPrepare && !canSend ? (
            <ReadOnlyResponse detail={detail} />
          ) : null}
        </>
      ) : error ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyMark} aria-hidden="true">!</span>
          <div className={styles.emptyStateBody}>
            <h3>Request workspace unavailable</h3>
            <p className="panel-copy">Use the queue link to return to assigned work, or retry this request read.</p>
            <button className="button button-primary" type="button" onClick={() => void loadDetail("refresh")} disabled={isRefreshing}>
              {isRefreshing ? "Trying again…" : "Retry request read"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RequestLoading() {
  return (
    <div className={styles.loadingState} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.loadingCopy}>
        <span className={styles.loadingMark} aria-hidden="true" />
        <div>
          <p className="eyebrow">Request update</p>
          <h3>Loading request workspace</h3>
          <p className="panel-copy">RightSpot is checking the assigned request and its current availability.</p>
        </div>
      </div>
      <div className={styles.loadingPreview} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function RequestSummary({ detail }: { detail: AgentRequestResponse }) {
  const { request, listing } = detail;
  return (
    <div className={styles.summaryGrid}>
      <section className={`${styles.infoCard} ${styles.requestFactsCard}`} aria-labelledby="request-facts-heading">
        <div className={styles.cardHeader}>
          <div>
            <p className="eyebrow">Current state</p>
            <h3 id="request-facts-heading">Tenant request</h3>
          </div>
          <span className={styles.statePill} data-state={request.state}>{stateLabel(request.state)}</span>
        </div>
        <div className={styles.requestEssentials}>
          <div>
            <span className={styles.factLabel}>Preferred times</span>
            <ul className={styles.preferredTimes}>
              {request.preferredTimes.map((time) => (
                <li key={time}><time dateTime={time}>{formatDateTime(time)}</time></li>
              ))}
            </ul>
          </div>
          <div className={styles.tenantContext}>
            <span className={styles.factLabel}>Tenant note</span>
            <p>{request.tenantNote ?? "No tenant note was provided."}</p>
          </div>
        </div>
        <details className={styles.technicalDetails}>
          <summary>Technical request details</summary>
          <dl className={styles.technicalList}>
            <div><dt>Request ID</dt><dd>{request.id}</dd></div>
            <div><dt>Request version</dt><dd>{request.version}</dd></div>
            <div><dt>Fixture generation</dt><dd>{detail.fixtureGeneration}</dd></div>
          </dl>
        </details>
      </section>
      <section className={`${styles.infoCard} ${styles.listingCard}`} aria-labelledby="listing-facts-heading">
        <p className="eyebrow">Assigned listing</p>
        <h3 id="listing-facts-heading">{listing.title}</h3>
        <p className={styles.listingAddress}>{listing.address} · {listing.area}</p>
        <p className={styles.listingPrice}>£{listing.monthlyRentGbp.toLocaleString("en-GB")} <span>pcm</span></p>
        <div className={styles.factRow}><span>{listing.bedrooms} bed</span><span>{listing.sizeSqM} m²</span><span>Available {formatDate(listing.availableFrom)}</span></div>
        <p className={styles.listingStatus}>Listing status · {listing.status.toLowerCase()}</p>
      </section>
      <section className={`${styles.infoCard} ${styles.availabilityCard}`} aria-labelledby="availability-heading">
        <div className={styles.cardHeader}>
          <div>
            <p className="eyebrow">Synthetic availability</p>
            <h3 id="availability-heading">Available times</h3>
          </div>
          <span className={styles.timezone}>Europe/London</span>
        </div>
        <ul className={styles.availabilityList}>
          {detail.availability.map((slot) => (
            <li className={styles.availabilityRow} data-status={slot.status} key={slot.id}>
              <time dateTime={slot.startsAt} aria-label={formatSlot(slot)}>
                <span>{formatSlotDate(slot.startsAt)}</span>
                <strong>{formatSlotTimeRange(slot.startsAt, slot.endsAt)}</strong>
              </time>
              <span className={styles.availabilityStatus}>{availabilityStatusLabel(slot.status)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PreparationPanel({
  detail,
  preparationKind,
  selectedSlotId,
  tenantNote,
  internalReviewNote,
  formError,
  mutation,
  onKindChange,
  onSlotChange,
  onTenantNoteChange,
  onInternalNoteChange,
  onSubmit,
}: {
  detail: AgentRequestResponse;
  preparationKind: PreparationKind;
  selectedSlotId: string;
  tenantNote: string;
  internalReviewNote: string;
  formError: string | null;
  mutation: "review" | "prepare" | "send" | null;
  onKindChange: (kind: PreparationKind) => void;
  onSlotChange: (slotId: string) => void;
  onTenantNoteChange: (note: string) => void;
  onInternalNoteChange: (note: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={`${styles.actionPanel} ${styles.stepPanel}`} aria-labelledby="prepare-heading">
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber} aria-hidden="true">2</span>
        <div>
          <p className="eyebrow">Step 2 of 3</p>
          <h3 id="prepare-heading">Prepare a response</h3>
        </div>
        <span className={styles.statePill} data-state="AGENT_REVIEWING">Still in review</span>
      </div>
      <p className="panel-copy">Choose an available slot or prepare a decline. You can review and replace this saved working state before anything reaches the tenant.</p>
      <form className={styles.preparationForm} onSubmit={onSubmit}>
        <fieldset disabled={mutation !== null}>
          <legend className={styles.srOnly}>Response preparation</legend>
          <div className={styles.choiceGrid}>
            <label className={`${styles.choiceCard} ${preparationKind === "SLOT_PROPOSAL" ? styles.choiceCardSelected : ""}`}>
              <input type="radio" name="preparation-kind" value="SLOT_PROPOSAL" checked={preparationKind === "SLOT_PROPOSAL"} onChange={() => onKindChange("SLOT_PROPOSAL")} />
              <span><strong>Propose a slot</strong><small>Choose a returned available time.</small></span>
            </label>
            <label className={`${styles.choiceCard} ${preparationKind === "AGENT_DECLINE" ? styles.choiceCardSelected : ""}`}>
              <input type="radio" name="preparation-kind" value="AGENT_DECLINE" checked={preparationKind === "AGENT_DECLINE"} onChange={() => onKindChange("AGENT_DECLINE")} />
              <span><strong>Decline request</strong><small>Prepare a bounded tenant-facing reason.</small></span>
            </label>
          </div>
          {preparationKind === "SLOT_PROPOSAL" ? (
            <label className={styles.field}>
              <span className={styles.fieldHeading}>Available slot <span aria-hidden="true">*</span></span>
              <select value={selectedSlotId} onChange={(event) => onSlotChange(event.target.value)} required>
                <option value="">Select an available time</option>
                {detail.availability.map((slot) => (
                  <option key={slot.id} value={slot.id} disabled={slot.status !== "AVAILABLE"}>
                    {formatSlot(slot)} — {slot.status.toLowerCase().replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className={`${styles.field} ${styles.noteField}`}>
            <span className={styles.fieldHeading}>
              <span>Tenant-facing note <span className={styles.optional}>(optional)</span></span>
              <span className={styles.visibilityTag}>Shared on send</span>
            </span>
            <textarea aria-describedby="tenant-note-help" value={tenantNote} onChange={(event) => onTenantNoteChange(event.target.value)} maxLength={500} rows={3} placeholder="Keep the message concise and useful to the tenant." />
            <small id="tenant-note-help">The tenant sees this note only after the separate send action. {tenantNote.length}/500 characters.</small>
          </label>
          <label className={`${styles.field} ${styles.privateField}`}>
            <span className={styles.fieldHeading}>
              <span>Internal review note <span className={styles.optional}>(optional)</span></span>
              <span className={styles.privateTag}>Agent-only</span>
            </span>
            <textarea aria-describedby="internal-note-help" value={internalReviewNote} onChange={(event) => onInternalNoteChange(event.target.value)} maxLength={500} rows={3} placeholder="Record context for your review workspace." />
            <small id="internal-note-help">Private review context; never shown to the tenant. {internalReviewNote.length}/500 characters.</small>
          </label>
          {formError ? <StatusBanner tone="error" message={formError} /> : null}
          <div className={styles.preparationFooter}>
            <p><strong>Preparation only.</strong> Saving here does not send a message or change the tenant-visible request state.</p>
            <button className="button button-primary" type="submit" disabled={mutation !== null}>
              {mutation === "prepare" ? "Saving preparation…" : "Save prepared response"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}

function ReadOnlyResponse({ detail }: { detail: AgentRequestResponse }) {
  const response = detail.request.sentResponse;
  return (
    <section className={`${styles.actionPanel} ${styles.completedPanel}`} aria-labelledby="response-status-heading">
      <div className={styles.cardHeader}>
        <div>
          <p className="eyebrow">Decision recorded</p>
          <h3 id="response-status-heading">This response is read-only</h3>
        </div>
        <span className={styles.statePill} data-state={detail.request.state}>{stateLabel(detail.request.state)}</span>
      </div>
      <p className="panel-copy">The server has recorded {stateLabel(detail.request.state).toLowerCase()}. The response cannot be edited or withdrawn in this fixture.</p>
      {response ? (
        <dl className={styles.responseSummary}>
          <div><dt>Response</dt><dd>{response.kind === "SLOT_PROPOSAL" ? "Slot proposal" : "Agent decline"}</dd></div>
          {response.kind === "SLOT_PROPOSAL" ? <div><dt>Viewing time</dt><dd>{formatSlot(detail.availability.find((slot) => slot.id === response.slotId))}</dd></div> : null}
          <div><dt>Tenant-facing note</dt><dd>{response.tenantNote ?? "No note was included."}</dd></div>
          {detail.request.proposalExpiresAt ? <div><dt>Proposal deadline</dt><dd>{formatDateTime(detail.request.proposalExpiresAt)}</dd></div> : null}
        </dl>
      ) : null}
    </section>
  );
}

function PreparedSendSummary({ detail }: { detail: AgentRequestResponse }) {
  const response = detail.request.preparedResponse;
  if (!response) return null;

  return (
    <div className={styles.preparedSummary} role="group" aria-labelledby="prepared-response-summary-heading">
      <div className={styles.preparedSummaryHeader}>
        <span id="prepared-response-summary-heading">Prepared response</span>
        <span className={styles.statePill} data-state="AGENT_REVIEWING">Not sent</span>
      </div>
      <dl className={styles.responseSummary}>
        <div><dt>Decision</dt><dd>{response.kind === "SLOT_PROPOSAL" ? "Propose a viewing slot" : "Decline the request"}</dd></div>
        {response.kind === "SLOT_PROPOSAL" ? <div><dt>Viewing time</dt><dd>{formatSlot(detail.availability.find((slot) => slot.id === response.slotId))}</dd></div> : null}
        <div><dt>Tenant-facing note</dt><dd>{response.tenantNote ?? "No note will be included."}</dd></div>
      </dl>
    </div>
  );
}

function stateLabel(state: AgentRequestResponse["request"]["state"]): string {
  return {
    TENANT_DRAFT: "Draft",
    REQUEST_SUBMITTED: "Needs review",
    AGENT_REVIEWING: "In review",
    SLOT_PROPOSED: "Proposal sent",
    VIEWING_CONFIRMED: "Confirmed",
    TENANT_DECLINED: "Tenant declined",
    EXPIRED: "Expired",
    AGENT_DECLINED: "Declined",
  }[state];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function formatSlotDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function formatSlotTimeRange(startsAt: string, endsAt: string): string {
  const formatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
}

function availabilityStatusLabel(status: AgentRequestResponse["availability"][number]["status"]): string {
  return {
    AVAILABLE: "Available",
    HELD_FOR_PROPOSAL: "Held for proposal",
    CONFIRMED: "Confirmed",
  }[status];
}

function formatSlot(slot: AgentRequestResponse["availability"][number] | undefined): string {
  return slot ? `${formatDateTime(slot.startsAt)}–${new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: "Europe/London" }).format(new Date(slot.endsAt))}` : "Selected slot";
}
