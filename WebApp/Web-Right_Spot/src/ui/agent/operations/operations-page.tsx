"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RolePageFrame from "../../shared/role-page-frame";
import StatusBanner from "../../shared/status-banner";
import {
  OperationsApiError,
  readOperations,
  type OperationsQuery,
  type OperationsResponse,
} from "./operations-api";
import OperationsWebMcp, {
  OperationsReadStaleError,
} from "./operations-webmcp";
import type { OperationsApiListingItem, OperationsApiViewingItem } from "../../../shared/contracts/operations-api";
import styles from "./operations.module.css";

const DEFAULT_QUERY: OperationsQuery = { kind: "listingPipeline" };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function OperationsPage() {
  return (
    <RolePageFrame requiredRole="agent" currentPath="/agent/operations" title="Operations insights" eyebrow="Property agent workspace" description="Read the current assigned portfolio and upcoming viewing commitments from the Operations authority.">
      <OperationsWorkspace />
    </RolePageFrame>
  );
}

function OperationsWorkspace() {
  const [kind, setKind] = useState<OperationsQuery["kind"]>(DEFAULT_QUERY.kind);
  const [area, setArea] = useState("");
  const [publicationState, setPublicationState] = useState("");
  const [lifecycleState, setLifecycleState] = useState("");
  const [minPublishedAgeDays, setMinPublishedAgeDays] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [listingId, setListingId] = useState("");
  const [response, setResponse] = useState<OperationsResponse | null>(null);
  const [error, setError] = useState<OperationsApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOperationsAssistanceUnavailable, setIsOperationsAssistanceUnavailable] = useState(false);
  const latestReadId = useRef(0);
  const activeRead = useRef<{ readId: number; controller: AbortController } | null>(null);
  const isMounted = useRef(false);

  const cancelReads = useCallback(() => {
    activeRead.current?.controller.abort();
    activeRead.current = null;
    latestReadId.current += 1;
    if (isMounted.current) setIsLoading(false);
  }, []);

  const handleOperationsRegistrationError = useCallback(() => {
    setIsOperationsAssistanceUnavailable(true);
  }, []);

  const executeRead = useCallback(async (
    query: OperationsQuery,
    options: { signal?: AbortSignal } = {},
  ): Promise<OperationsResponse> => {
    const callerSignal = options.signal;
    if (callerSignal?.aborted) throw new OperationsReadStaleError();

    activeRead.current?.controller.abort();
    const readId = latestReadId.current + 1;
    latestReadId.current = readId;
    setError(null);
    setResponse(null);
    setIsLoading(false);

    const validation = validateQuery(query);
    if (validation) {
      const validationError = new OperationsApiError(400, "VALIDATION_FAILED", validation);
      setError(validationError);
      throw validationError;
    }

    const controller = new AbortController();
    activeRead.current = { readId, controller };
    let callerAborted = false;
    const isCurrentRead = () => isMounted.current
      && !callerAborted
      && !callerSignal?.aborted
      && !controller.signal.aborted
      && readId === latestReadId.current;
    const handleCallerAbort = () => {
      callerAborted = true;
      controller.abort();
      if (readId === latestReadId.current) {
        latestReadId.current += 1;
        if (isMounted.current) setIsLoading(false);
      }
    };
    callerSignal?.addEventListener("abort", handleCallerAbort, { once: true });

    setKind(query.kind);
    setArea(query.area ?? "");
    if (query.kind === "listingPipeline") {
      setPublicationState(query.publicationState ?? "");
      setLifecycleState(query.lifecycleState ?? "");
      setMinPublishedAgeDays(query.minPublishedAgeDays === undefined ? "" : String(query.minPublishedAgeDays));
      setFrom("");
      setTo("");
      setStatus("");
      setListingId("");
    } else {
      setPublicationState("");
      setLifecycleState("");
      setMinPublishedAgeDays("");
      setFrom(query.from);
      setTo(query.to);
      setStatus(query.status ?? "");
      setListingId(query.listingId ?? "");
    }
    setIsLoading(true);

    try {
      const nextResponse = await readOperations(query, { signal: controller.signal });
      if (!isCurrentRead()) throw new OperationsReadStaleError();
      setResponse(nextResponse);
      return nextResponse;
    } catch (caught: unknown) {
      if (!isCurrentRead()) throw new OperationsReadStaleError();
      const nextError = caught instanceof OperationsApiError
        ? caught
        : new OperationsApiError(
          0,
          "HTTP_ERROR",
          "The Operations service returned an unexpected response. Try again.",
        );
      setError(nextError);
      throw nextError;
    } finally {
      callerSignal?.removeEventListener("abort", handleCallerAbort);
      if (activeRead.current?.readId === readId) {
        activeRead.current = null;
        if (isMounted.current && readId === latestReadId.current) setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void executeRead(DEFAULT_QUERY).catch(() => undefined);
    return () => {
      isMounted.current = false;
      cancelReads();
    };
  }, [cancelReads, executeRead]);

  function currentQuery(): OperationsQuery {
    if (kind === "listingPipeline") {
      return {
        kind,
        ...(area ? { area } : {}),
        ...(publicationState ? { publicationState: publicationState as "PUBLISHED" | "UNPUBLISHED" } : {}),
        ...(lifecycleState ? { lifecycleState: lifecycleState as "OPEN" | "UNAVAILABLE" | "LET_AGREED" | "ARCHIVED" } : {}),
        ...(minPublishedAgeDays ? { minPublishedAgeDays: Number(minPublishedAgeDays) } : {}),
      };
    }
    return { kind, from, to, ...(status ? { status: status as "PROPOSED" | "CONFIRMED" } : {}), ...(area ? { area } : {}), ...(listingId ? { listingId } : {}) };
  }

  function clearFilters() {
    cancelReads();
    setKind(DEFAULT_QUERY.kind); setArea(""); setPublicationState(""); setLifecycleState(""); setMinPublishedAgeDays(""); setFrom(""); setTo(""); setStatus(""); setListingId(""); setResponse(null); setError(null);
  }

  return (
    <>
      <OperationsWebMcp
        executeRead={executeRead}
        cancelReads={cancelReads}
        onRegistrationError={handleOperationsRegistrationError}
      />
      <section className={styles.workspace} aria-labelledby="operations-heading">
      <div className={styles.workspaceHeader}><div><p className="eyebrow">Manual read surface</p><h2 id="operations-heading">See the current work that needs attention</h2><p className="panel-copy">Choose one bounded report. Every row, count, and freshness field below comes from the server-owned Operations projection.</p></div></div>
      {isOperationsAssistanceUnavailable ? <p role="status" aria-live="polite">Operations assistance is unavailable in this session. Use the manual controls below.</p> : null}
      <form className={styles.queryPanel} onSubmit={(event) => { event.preventDefault(); void executeRead(currentQuery()).catch(() => undefined); }} aria-label="Operations filters">
        <div className={styles.formGrid}>
          <label className={styles.field}><span>Operations report</span><select aria-label="Operations report" value={kind} onChange={(event) => { cancelReads(); setKind(event.target.value as OperationsQuery["kind"]); setResponse(null); setError(null); }}><option value="listingPipeline">Listing pipeline</option><option value="upcomingViewings">Upcoming viewings</option></select></label>
          <label className={styles.field}><span>Area (optional)</span><input value={area} onChange={(event) => setArea(event.target.value)} /></label>
          {kind === "listingPipeline" ? <>
            <label className={styles.field}><span>Publication state</span><select value={publicationState} onChange={(event) => setPublicationState(event.target.value)}><option value="">All publication states</option><option value="PUBLISHED">Published</option><option value="UNPUBLISHED">Unpublished</option></select></label>
            <label className={styles.field}><span>Lifecycle state</span><select value={lifecycleState} onChange={(event) => setLifecycleState(event.target.value)}><option value="">All lifecycle states</option><option value="OPEN">Open</option><option value="UNAVAILABLE">Unavailable</option><option value="LET_AGREED">Let agreed</option><option value="ARCHIVED">Archived</option></select></label>
            <label className={styles.field}><span>Minimum published age (days)</span><input inputMode="numeric" value={minPublishedAgeDays} onChange={(event) => setMinPublishedAgeDays(event.target.value)} /></label>
          </> : <>
            <label className={styles.field}><span>From date (London)</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} required /></label>
            <label className={styles.field}><span>To date (London)</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} required /></label>
            <label className={styles.field}><span>Viewing status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All viewing statuses</option><option value="PROPOSED">Proposed</option><option value="CONFIRMED">Confirmed</option></select></label>
            <label className={styles.field}><span>Listing ID</span><input value={listingId} onChange={(event) => setListingId(event.target.value)} /></label>
          </>}
        </div>
        <div className={styles.formActions}><button className="button button-primary" type="submit" disabled={isLoading}>{isLoading ? "Reading…" : "Run operations read"}</button><button className="button button-quiet" type="button" onClick={clearFilters} disabled={isLoading}>Clear filters</button></div>
      </form>
      {isLoading ? <div className={styles.state} role="status" aria-live="polite" aria-busy="true"><h3>Loading Operations data</h3><p className="panel-copy">Reading the current authoritative projection.</p></div> : null}
      {error ? <div className={styles.feedback}><StatusBanner tone="error" message={error.message} /><button className="button button-primary" type="button" onClick={() => void executeRead(currentQuery()).catch(() => undefined)} >Retry operations read</button></div> : null}
      {!isLoading && !error && response ? <OperationsResult response={response} /> : null}
      </section>
    </>
  );
}

function OperationsResult({ response }: { response: OperationsResponse }) {
  const items = response.items;
  return <section className={styles.result} aria-labelledby="operations-result-heading"><div className={styles.resultHeader}><div><p className="eyebrow">Authoritative result</p><h3 id="operations-result-heading">{response.filters.kind === "listingPipeline" ? "Listing pipeline" : "Upcoming viewings"}</h3></div><span className={styles.freshness}>{response.freshness}</span></div><dl className={styles.metadata}><div><dt>Applied filters</dt><dd><code>{JSON.stringify(response.filters)}</code></dd></div><div><dt>Evaluated as of</dt><dd>{formatInstant(response.asOf)}</dd></div><div><dt>Data as of</dt><dd>{formatInstant(response.dataAsOf)}</dd></div><div><dt>Timezone</dt><dd>{response.timezone}</dd></div><div><dt>Exact counts</dt><dd>{response.totalCount} total · {response.returnedCount} returned{response.truncated ? " · capped at 25" : ""}</dd></div></dl>{items.length === 0 ? <div className={styles.state} role="status"><h4>No matching records</h4><p className="panel-copy">The Operations authority returned a valid empty result for these filters.</p></div> : response.filters.kind === "listingPipeline" ? <ListingRows items={items as OperationsApiListingItem[]} /> : <ViewingRows items={items as OperationsApiViewingItem[]} />}</section>;
}

function ListingRows({ items }: { items: OperationsApiListingItem[] }) { return <div className={styles.rows}>{items.map((item) => <article className={styles.row} key={item.id}><h4>{item.title}</h4><p>{item.area} · £{item.monthlyRentGbp.toLocaleString()} monthly · {item.bedrooms} bedrooms</p><small>{item.publicationState} · {item.lifecycleState} · Published age {item.publishedAgeDays} days{item.stale ? " · stale" : ""}</small></article>)}</div>; }
function ViewingRows({ items }: { items: OperationsApiViewingItem[] }) { return <div className={styles.rows}>{items.map((item) => <article className={styles.row} key={item.slotId}><h4>{item.listingTitle}</h4><p>{item.area} · {item.status} · {formatInstant(item.startsAt)}</p><small><a href={`/agent/requests/${encodeURIComponent(item.requestId)}`}>Open authorized request {item.requestId}</a></small></article>)}</div>; }

function validateQuery(query: OperationsQuery): string | null {
  if (query.kind === "listingPipeline") return query.minPublishedAgeDays !== undefined && (!Number.isInteger(query.minPublishedAgeDays) || query.minPublishedAgeDays < 0) ? "Minimum published age must be a non-negative whole number." : null;
  if (!DATE_PATTERN.test(query.from) || !DATE_PATTERN.test(query.to)) return "Enter both dates in YYYY-MM-DD format.";
  if (Number.isNaN(Date.parse(`${query.from}T00:00:00Z`)) || Number.isNaN(Date.parse(`${query.to}T00:00:00Z`))) return "Enter valid calendar dates.";
  if (query.from >= query.to) return "The end date must be after the start date.";
  return null;
}

function formatInstant(value: string): string { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value)); }
