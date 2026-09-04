"use client";

import { useState } from "react";
import { useEffect } from "react";
import { FiClock, FiInfo, FiMonitor, FiRefreshCw } from "react-icons/fi";
import {
  createPairingSession,
  listConnectors,
  type ConnectorSummary,
  type PairingSession,
} from "@/lib/api/pairing";
import { Button } from "@/components/ui/Button";

type PairingState = "pending" | "used" | "expired";
const CONNECTOR_REFRESH_INTERVAL_MS = 5_000;

function formatExpiry(value: string): string {
  const expiry = new Date(value);
  if (!Number.isFinite(expiry.getTime())) return "soon";

  return expiry.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown date";

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function connectorStatus(connector: ConnectorSummary): "Paired" | "Expired" | "Disconnected" {
  if (connector.revoked_at) return "Disconnected";
  if (Date.parse(connector.expires_at) <= Date.now()) return "Expired";
  return "Paired";
}

function pairingBadgeClass(state: PairingState): string {
  if (state === "pending") return "border-[#9fe870]/30 bg-[#9fe870]/10 text-[#b9f57b]";
  if (state === "used") return "border-[#8fe5d1]/30 bg-[#8fe5d1]/10 text-[#8fe5d1]";
  return "border-[#f1cf70]/30 bg-[#f1cf70]/10 text-[#f1cf70]";
}

function connectorBadgeClass(status: "Paired" | "Expired" | "Disconnected"): string {
  if (status === "Paired") return "border-[#a6d193] bg-[#e2f6d5] text-[#286323]";
  if (status === "Expired") return "border-[#e8cf8c] bg-[#fff5d9] text-[#8a5d00]";
  return "border-[#e7aaa2] bg-[#fff1ef] text-[#9b3029]";
}

export default function PairThisMac() {
  const [pairing, setPairing] = useState<PairingSession | null>(null);
  const [pairingState, setPairingState] = useState<PairingState>("pending");
  const [pairedConnector, setPairedConnector] = useState<ConnectorSummary | null>(null);
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [connectorError, setConnectorError] = useState<string | null>(null);
  const currentPairedConnector = pairedConnector
    ? connectors.find((connector) => connector.connector_id === pairedConnector.connector_id) ??
      pairedConnector
    : null;

  useEffect(() => {
    let cancelled = false;

    async function loadConnectors(showLoading = false) {
      if (showLoading) setIsLoadingConnectors(true);
      try {
        const result = await listConnectors();
        if (cancelled) return;
        setConnectors(result.connectors);
        setConnectorError(null);
      } catch (requestError) {
        if (cancelled) return;
        setConnectorError(
          requestError instanceof Error ? requestError.message : "Unable to load paired Macs.",
        );
      } finally {
        if (!cancelled && showLoading) setIsLoadingConnectors(false);
      }
    }

    void loadConnectors(true);
    const intervalId = window.setInterval(
      () => void loadConnectors(),
      CONNECTOR_REFRESH_INTERVAL_MS,
    );
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!pairing || pairingState !== "pending") return;

    let cancelled = false;
    const pairingId = pairing.pairing_id;
    const expiresAt = Date.parse(pairing.expires_at);

    function markExpired() {
      if (!cancelled) setPairingState("expired");
    }

    async function checkPairing() {
      if (Date.now() >= expiresAt) {
        markExpired();
        return;
      }

      try {
        const result = await listConnectors();
        if (cancelled) return;
        setConnectors(result.connectors);
        setConnectorError(null);
        const connector = result.connectors.find(
          (item) => item.pairing_id === pairingId,
        );
        if (connector) {
          setPairedConnector(connector);
          setPairingState("used");
        }
      } catch (requestError) {
        if (!cancelled) {
          setConnectorError(
            requestError instanceof Error ? requestError.message : "Unable to check pairing status.",
          );
        }
      }
    }

    void checkPairing();
    const intervalId = window.setInterval(() => void checkPairing(), 2_000);
    const timeoutId = window.setTimeout(markExpired, Math.max(0, expiresAt - Date.now()));

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [pairing, pairingState]);

  async function handlePairThisMac() {
    setPairingError(null);
    setIsSubmitting(true);

    try {
      setPairing(await createPairingSession());
      setPairingState("pending");
      setPairedConnector(null);
    } catch (requestError) {
      setPairingError(
        requestError instanceof Error ? requestError.message : "Unable to pair this Mac.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="devices"
      aria-labelledby="devices-title"
      className="mt-6 max-w-5xl overflow-hidden rounded-[32px] border border-[#cddfc8] bg-white/80 shadow-[0_24px_80px_rgba(22,51,0,0.1)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#163300] px-5 py-5 text-[#efffe7] sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#b9f57b] text-[#163300]">
            <FiMonitor className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9f57b]/70">Connected devices</p>
            <h2 id="devices-title" className="mt-1 text-xl font-bold tracking-[-0.03em] text-white">Pair a Mac</h2>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => void handlePairThisMac()}
          isLoading={isSubmitting}
          className="!bg-[#b9f57b] !text-[#163300] hover:!bg-[#d5ffad]"
        >
          {pairing ? <FiRefreshCw aria-hidden="true" /> : <FiMonitor aria-hidden="true" />}
          <span>{pairing ? "New code" : "Pair this Mac"}</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="border-b border-white/10 bg-[#07100c] p-5 text-[#efffe7] sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">One-time code</p>
            {pairing ? (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${pairingBadgeClass(pairingState)}`}>
                {pairingState === "pending" ? "Waiting" : pairingState === "used" ? "Used" : "Expired"}
              </span>
            ) : null}
          </div>

          {pairing ? (
            <p
              aria-label="Pairing code"
              aria-live="polite"
              className="mt-10 font-mono text-[clamp(36px,5vw,52px)] font-bold leading-none tracking-[0.16em] text-[#b9f57b]"
            >
              {pairingState === "pending"
                ? pairing.pairing_code
                : pairingState === "used"
                  ? "USED"
                  : "EXPIRED"}
            </p>
          ) : (
            <div className="mt-10 flex h-[92px] items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 text-white/45">
              <FiMonitor className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm">No code yet</span>
            </div>
          )}

          <p aria-live="polite" className="mt-5 max-w-sm text-sm leading-6 text-white/58">
            {pairingState === "pending" && pairing
              ? `Enter it in the Local Connector before ${formatExpiry(pairing.expires_at)}.`
              : pairingState === "used"
                ? currentPairedConnector && connectorStatus(currentPairedConnector) === "Disconnected"
                  ? `${currentPairedConnector.device_name} is disconnected.`
                  : `${currentPairedConnector?.device_name ?? "Your Mac"} is connected to this account.`
                : pairingState === "expired"
                  ? "Code expired. Create another."
                  : "Create a code to connect a Mac."}
          </p>

          {pairingError ? (
            <p role="alert" className="mt-4 rounded-2xl border border-[#e7aaa2] bg-[#3a1515] px-3 py-2 text-sm text-[#ffb4ad]">
              {pairingError}
            </p>
          ) : null}
        </div>

        <div className="bg-[#f7fbf4] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">Account devices</p>
              <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#163300]">Your devices</h3>
            </div>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#dff3d7] px-2 font-mono text-xs font-bold text-[#286323]" aria-label={`${connectors.length} devices`}>
              {connectors.length}
            </span>
          </div>

          {isLoadingConnectors ? (
            <p className="mt-8 text-sm text-[#587052]">Loading…</p>
          ) : connectors.length === 0 ? (
            <div className="mt-8 flex items-center gap-3 text-sm text-[#587052]">
              <FiClock className="h-4 w-4 text-[#7b9b74]" aria-hidden="true" />
              No Macs paired yet.
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-[#dbe8d7]">
              {connectors.map((connector) => {
                const status = connectorStatus(connector);
                return (
                  <li key={connector.connector_id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dff3d7] text-[#286323]">
                        <FiMonitor className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#163300]">{connector.device_name}</p>
                        <p className="mt-1 truncate text-xs text-[#7b9077]">
                          Added {formatDate(connector.created_at)} · Expires {formatDate(connector.expires_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${connectorBadgeClass(status)}`}>
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {connectorError ? (
            <p role="alert" className="mt-4 rounded-2xl border border-[#e7aaa2] bg-[#fff1ef] px-3 py-2 text-sm text-[#9b3029]">
              {connectorError}
            </p>
          ) : null}

          <p className="mt-7 flex items-center gap-2 text-xs text-[#7b9077]">
            <FiInfo className="h-3.5 w-3.5 shrink-0 text-[#4a8e3d]" aria-hidden="true" />
            Refreshes automatically. Status is not live presence.
          </p>
        </div>
      </div>
    </section>
  );
}
