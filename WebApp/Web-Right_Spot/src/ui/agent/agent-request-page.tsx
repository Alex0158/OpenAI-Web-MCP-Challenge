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
      setError("The workflow changed before that action completed. The latest request state is shown below.");
      try {
        setDetail(await readAgentRequest(requestId));
      } catch (refreshError: unknown) {
        setError(agentErrorMessage(refreshError, "detail"));
      }
      return;
    }
    setError(agentErrorMessage(caught, "detail"));
  }

  const hasPreparedResponse = Boolean(detail?.request.preparedResponse);
  const canPrepare = detail?.request.state === "AGENT_REVIEWING";
  const canSend = canPrepare && hasPreparedResponse;
  const preparedResponse = detail?.request.preparedResponse;

  return (
    <section className={styles.workspace} aria-labelledby="request-heading">
      <div className={styles.workspaceHeader}>
        <div>
          <p className="eyebrow">Viewing request</p>
          <h2 id="request-heading">Read the facts, then choose the next step</h2>
          <p className="panel-copy">Request state and version below are authoritative server responses.</p>
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

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {notice ? <StatusBanner tone="success" message={notice} /> : null}

      {isLoading ? (
        <div className={styles.loadingState} role="status" aria-live="polite" aria-busy="true">
          <span className={styles.loadingMark} aria-hidden="true" />
          <div>
            <h3>Loading request workspace</h3>
            <p className="panel-copy">RightSpot is checking the assigned request and its current availability.</p>
          </div>
        </div>
      ) : detail ? (
        <>
          <RequestSummary detail={detail} />
          {detail.request.state === "REQUEST_SUBMITTED" ? (
            <section className={styles.actionPanel} aria-labelledby="start-review-heading">
              <p className="eyebrow">First human action</p>
              <h3 id="start-review-heading">Start review</h3>
              <p className="panel-copy">Opening this workspace did not change the request. Start review when you are ready to inspect and prepare a response.</p>
              <button className="button button-primary" type="button" onClick={() => void handleStartReview()} disabled={mutation !== null}>
                {mutation === "review" ? "Starting review…" : "Start review"}
              </button>
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
            <section className={styles.actionPanel} aria-labelledby="send-response-heading">
              <p className="eyebrow">Second human action</p>
              <h3 id="send-response-heading">Send the prepared response</h3>
              <p className="panel-copy">Preparation is saved as agent-only working state. Sending is a separate consequential action and cannot be undone in this fixture.</p>
              <div className={styles.preparedSummary}>
                <span className={styles.statePill}>{preparedResponse?.kind === "SLOT_PROPOSAL" ? "Slot proposal" : "Agent decline"}</span>
                {preparedResponse?.kind === "SLOT_PROPOSAL" ? <span>{formatSlot(detail.availability.find((slot) => slot.id === preparedResponse.slotId))}</span> : null}
              </div>
              <button className="button button-primary" type="button" onClick={() => void handleSend()} disabled={mutation !== null}>
                {mutation === "send" ? "Sending…" : "Send response"}
              </button>
            </section>
          ) : null}
          {detail.request.state !== "REQUEST_SUBMITTED" && !canPrepare && !canSend ? (
            <ReadOnlyResponse detail={detail} />
          ) : null}
        </>
      ) : error ? (
        <div className={styles.emptyState} role="status">
          <h3>Request workspace unavailable</h3>
          <p className="panel-copy">Use the queue link to return to assigned work, or retry this request read.</p>
          <button className="button button-primary" type="button" onClick={() => void loadDetail("refresh")} disabled={isRefreshing}>
            {isRefreshing ? "Trying again…" : "Retry request read"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function RequestSummary({ detail }: { detail: AgentRequestResponse }) {
  const { request, listing } = detail;
  return (
    <div className={styles.summaryGrid}>
      <section className={styles.infoCard} aria-labelledby="request-facts-heading">
        <div className={styles.cardHeader}>
          <div>
            <p className="eyebrow">Request facts</p>
            <h3 id="request-facts-heading">Current request</h3>
          </div>
          <span className={styles.statePill}>{stateLabel(request.state)}</span>
        </div>
        <dl className={styles.detailList}>
          <div><dt>Request</dt><dd>{request.id}</dd></div>
          <div><dt>Version</dt><dd>{request.version}</dd></div>
          <div><dt>Preferred times</dt><dd>{request.preferredTimes.map(formatDateTime).join(" · ")}</dd></div>
          <div><dt>Tenant note</dt><dd>{request.tenantNote ?? "No note provided."}</dd></div>
        </dl>
      </section>
      <section className={styles.infoCard} aria-labelledby="listing-facts-heading">
        <p className="eyebrow">Assigned listing</p>
        <h3 id="listing-facts-heading">{listing.title}</h3>
        <p className={styles.listingAddress}>{listing.address} · {listing.area}</p>
        <div className={styles.factRow}><span>£{listing.monthlyRentGbp.toLocaleString("en-GB")} pcm</span><span>{listing.bedrooms} bed</span><span>{listing.sizeSqM} m²</span></div>
        <p className="panel-copy">Available from {formatDate(listing.availableFrom)}. Listing status: {listing.status.toLowerCase()}.</p>
      </section>
      <section className={`${styles.infoCard} ${styles.availabilityCard}`} aria-labelledby="availability-heading">
        <div className={styles.cardHeader}>
          <div>
            <p className="eyebrow">Synthetic availability</p>
            <h3 id="availability-heading">Available times</h3>
          </div>
          <span className={styles.timezone}>Europe/London</span>
        </div>
        <div className={styles.availabilityList}>
          {detail.availability.map((slot) => (
            <div className={styles.availabilityRow} key={slot.id}>
              <span>{formatSlot(slot)}</span>
              <span className={styles.availabilityStatus}>{slot.status.replaceAll("_", " ").toLowerCase()}</span>
            </div>
          ))}
        </div>
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
    <section className={styles.actionPanel} aria-labelledby="prepare-heading">
      <div className={styles.cardHeader}>
        <div>
          <p className="eyebrow">First decision step</p>
          <h3 id="prepare-heading">Prepare a response</h3>
        </div>
        <span className={styles.statePill}>Still in review</span>
      </div>
      <p className="panel-copy">Choose an available slot or prepare a decline. This saves working state only; it does not send anything.</p>
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
              <span>Available slot <span aria-hidden="true">*</span></span>
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
          <label className={styles.field}>
            <span>Tenant-facing note <span className={styles.optional}>(optional)</span></span>
            <textarea value={tenantNote} onChange={(event) => onTenantNoteChange(event.target.value)} maxLength={500} rows={3} placeholder="Keep the message concise and useful to the tenant." />
            <small>{tenantNote.length}/500 characters</small>
          </label>
          <label className={styles.field}>
            <span>Internal review note <span className={styles.optional}>(agent-only, optional)</span></span>
            <textarea value={internalReviewNote} onChange={(event) => onInternalNoteChange(event.target.value)} maxLength={500} rows={3} placeholder="Record context for your review workspace." />
            <small>{internalReviewNote.length}/500 characters · never shown to the tenant</small>
          </label>
          {formError ? <StatusBanner tone="error" message={formError} /> : null}
          <button className="button button-primary" type="submit" disabled={mutation !== null}>
            {mutation === "prepare" ? "Saving preparation…" : "Prepare response"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

function ReadOnlyResponse({ detail }: { detail: AgentRequestResponse }) {
  const response = detail.request.sentResponse;
  return (
    <section className={styles.actionPanel} aria-labelledby="response-status-heading">
      <p className="eyebrow">Decision recorded</p>
      <h3 id="response-status-heading">This response is read-only</h3>
      <p className="panel-copy">The server has recorded {stateLabel(detail.request.state).toLowerCase()}. The response cannot be edited or withdrawn in this fixture.</p>
      {response ? <div className={styles.preparedSummary}><span className={styles.statePill}>{response.kind === "SLOT_PROPOSAL" ? "Slot proposal" : "Agent decline"}</span>{response.tenantNote ? <span>{response.tenantNote}</span> : null}</div> : null}
    </section>
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

function formatSlot(slot: AgentRequestResponse["availability"][number] | undefined): string {
  return slot ? `${formatDateTime(slot.startsAt)}–${new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: "Europe/London" }).format(new Date(slot.endsAt))}` : "Selected slot";
}
