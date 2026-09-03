"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ClientSnapshot } from "../server/world-projection";
import {
  ASSIGN_SOLDIER_MISSION_COMMAND_PATH,
  parseAssignSoldierMissionCommandFailure,
  parseAssignSoldierMissionCommandSuccess,
  type AssignSoldierMissionCommandEnvelope,
} from "../shared/assign-soldier-mission-command";
import {
  MOVE_PLAYER_COMMAND_PATH,
  parseMovePlayerCommandFailure,
  parseMovePlayerCommandSuccess,
  type MovePlayerCommandEnvelope,
  type MovePlayerDirection,
} from "../shared/move-player-command";
import { createConnectionAttemptGate } from "./connection-attempt-gate";
import {
  createGathererDispatchReconciliationGate,
  createPageMutationGate,
  resolveGathererDispatchSelection,
  type GathererDispatchAttempt,
  type GathererDispatchRefreshFailure,
  type GathererDispatchSelection,
  type PageMutationLease,
} from "./gatherer-dispatch";
import { GameProjection } from "./game-projection";
import {
  createHeldMovementController,
  createMovementReconciliationGate,
  shouldBlockHeldMovement,
  type HeldMovementController,
  type MovementAttempt,
} from "./keyboard-movement";
import { createServerMovementIntentController, type ServerMovementIntentController } from "./server-movement-intent";
import {
  gameRealtimeUrl,
  parseGameBootstrap,
  snapshotMatchesBootstrapScope,
  type GameBootstrapPayload,
} from "./game-bootstrap";
import {
  explicitResyncPresentationState,
  RealtimeProjectionClient,
  type RealtimeCapability,
  type RealtimeConnectionState,
} from "./realtime-projection";
import { createWebMcpPageToolRegistrar, type WebMcpPageStatus } from "./webmcp-page-tools";

function parseFrame(value: unknown): value is { kind: "client_snapshot"; connectionId: string; sequence: number; snapshot: ClientSnapshot } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return (value as { kind?: unknown }).kind === "client_snapshot";
}

function movementScope(payload: GameBootstrapPayload): string {
  return [payload.contractVersion, payload.worldId, payload.playerId, payload.shelterId].join("\u0000");
}

function parseCommandErrorCode(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || typeof record.error_code !== "string" || record.error_code === "") {
    return null;
  }
  return record.error_code;
}

function isDispatchRefreshFailureCode(value: string | null): value is GathererDispatchRefreshFailure["code"] {
  return value === "STALE_REVISION"
    || value === "ROLE_LOCKED"
    || value === "NOT_AT_SHELTER"
    || value === "MISSION_ACTIVE"
    || value === "TARGET_UNAVAILABLE";
}

export function LiveGameProjection() {
  const [snapshot, setSnapshot] = useState<ClientSnapshot | null>(null);
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>("CONNECTING");
  const [capability, setCapability] = useState<RealtimeCapability>("unsupported");
  const [webmcpStatus, setWebmcpStatus] = useState<WebMcpPageStatus>("unsupported");
  const [webmcpStatusMessage, setWebmcpStatusMessage] = useState("WebMCP is unavailable in this browser. Human controls remain available.");
  const [pageMutationPending, setPageMutationPending] = useState(false);
  const [movementPending, setMovementPending] = useState(false);
  const [movementRecoveryBlocked, setMovementRecoveryBlocked] = useState(false);
  const [movementStatus, setMovementStatus] = useState("Movement unavailable until an authoritative map snapshot is ready.");
  const [dispatchPending, setDispatchPending] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState("Dispatch unavailable until an authoritative snapshot is ready.");
  const [dispatchScope, setDispatchScope] = useState<string | null>(null);
  const snapshotRef = useRef<ClientSnapshot | null>(null);
  const projectionRef = useRef<RealtimeProjectionClient | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const bootstrapRef = useRef<GameBootstrapPayload | null>(null);
  const connectionStateRef = useRef<RealtimeConnectionState>("CONNECTING");
  const movementGateRef = useRef<ReturnType<typeof createMovementReconciliationGate> | null>(null);
  const heldMovementRef = useRef<HeldMovementController | null>(null);
  const serverIntentRef = useRef<ServerMovementIntentController | null>(null);
  const dispatchGateRef = useRef<ReturnType<typeof createGathererDispatchReconciliationGate> | null>(null);
  const pageMutationGateRef = useRef<ReturnType<typeof createPageMutationGate> | null>(null);
  const movementLeaseRef = useRef<PageMutationLease | null>(null);
  const dispatchLeaseRef = useRef<PageMutationLease | null>(null);
  const dispatchRejectionStatusRef = useRef<string | null>(null);
  const dispatchHasCommandStatusRef = useRef(false);
  const reconnectRef = useRef<(() => void) | null>(null);
  const submitMoveRef = useRef<((direction: MovePlayerDirection) => boolean) | null>(null);
  const submitDispatchRef = useRef<((selection: GathererDispatchSelection) => boolean) | null>(null);
  const webmcpRegistrarRef = useRef<ReturnType<typeof createWebMcpPageToolRegistrar> | null>(null);

  if (movementGateRef.current === null) {
    movementGateRef.current = createMovementReconciliationGate();
  }
  if (heldMovementRef.current === null) {
    heldMovementRef.current = createHeldMovementController({
      submit: (direction) => submitMoveRef.current?.(direction) ?? false,
    });
  }
  if (serverIntentRef.current === null) {
    serverIntentRef.current = createServerMovementIntentController({
      getContext: () => {
        const bootstrap = bootstrapRef.current;
        const currentSnapshot = snapshotRef.current;
        return bootstrap && currentSnapshot
          ? { contractVersion: bootstrap.contractVersion, playerRevision: currentSnapshot.player.revision }
          : null;
      },
      send: (frame) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          throw new Error("REALTIME_CLOSED");
        }
        socket.send(JSON.stringify(frame));
      },
      onStatus: (message) => setMovementStatus(message),
    });
  }
  if (dispatchGateRef.current === null) {
    dispatchGateRef.current = createGathererDispatchReconciliationGate();
  }
  if (pageMutationGateRef.current === null) {
    pageMutationGateRef.current = createPageMutationGate();
  }

  useEffect(() => {
    let disposed = false;
    const connectionGate = createConnectionAttemptGate();
    const movementGate = movementGateRef.current;
    const heldMovement = heldMovementRef.current;
    const serverIntent = serverIntentRef.current;
    const dispatchGate = dispatchGateRef.current;
    const pageMutationGate = pageMutationGateRef.current;
    if (movementGate === null || heldMovement === null || serverIntent === null || dispatchGate === null || pageMutationGate === null) {
      return;
    }
    let webmcpStartedForScope = false;

    const updateConnectionState = (next: RealtimeConnectionState) => {
      connectionStateRef.current = next;
      setConnectionState(next);
    };

    const syncMutationPending = () => {
      setMovementPending(movementGate.pending || serverIntent.pending);
      setMovementRecoveryBlocked(movementGate.recoveryRequired || serverIntent.recoveryRequired);
      setDispatchPending(dispatchGate.pending);
      setPageMutationPending(pageMutationGate.pending);
      heldMovement.setState({
        available: connectionStateRef.current === "READY" && snapshotRef.current !== null,
        pending: movementGate.pending || serverIntent.pending,
        blocked: shouldBlockHeldMovement({
          recoveryRequired: movementGate.recoveryRequired || serverIntent.recoveryRequired,
          pageMutationPending: pageMutationGate.pending,
          movementPending: movementGate.pending || serverIntent.pending,
        }),
      });
    };

    const scopeIsCurrent = (scope: string): boolean => {
      const bootstrap = bootstrapRef.current;
      return bootstrap !== null && movementScope(bootstrap) === scope;
    };

    const requestCurrentResync = (scope: string): boolean => {
      if (disposed || !scopeIsCurrent(scope)) {
        return false;
      }
      const projection = projectionRef.current;
      const socket = socketRef.current;
      if (!projection || !socket || socket.readyState !== WebSocket.OPEN || projection.connectionId === null) {
        return false;
      }
      try {
        socket.send(JSON.stringify(projection.requestResync("EXPLICIT")));
        updateConnectionState(explicitResyncPresentationState(connectionStateRef.current, "sent"));
        return true;
      } catch {
        updateConnectionState(explicitResyncPresentationState(connectionStateRef.current, "failed"));
        return false;
      }
    };

    const pageTools = createWebMcpPageToolRegistrar({
      onStatus: (status, message) => {
        if (!disposed) {
          setWebmcpStatus(status);
          setWebmcpStatusMessage(message);
        }
      },
      onReconcile: () => {
        const bootstrap = bootstrapRef.current;
        if (bootstrap) {
          requestCurrentResync(movementScope(bootstrap));
        }
      },
    });
    webmcpRegistrarRef.current = pageTools;

    const finishMovement = () => {
      const lease = movementLeaseRef.current;
      movementLeaseRef.current = null;
      if (lease) {
        pageMutationGate.release(lease);
      }
      syncMutationPending();
    };

    const finishDispatch = () => {
      const lease = dispatchLeaseRef.current;
      dispatchLeaseRef.current = null;
      if (lease) {
        pageMutationGate.release(lease);
      }
      syncMutationPending();
    };

    const markUnknownAndResync = (attempt: MovementAttempt, message: string) => {
      if (disposed || !scopeIsCurrent(attempt.scope)) {
        return;
      }
      heldMovement.stop();
      const outcome = movementGate.markUnknown(attempt);
      if (outcome.kind !== "request_resync") {
        return;
      }
      syncMutationPending();
      setMovementStatus(message);
      if (!requestCurrentResync(attempt.scope)) {
        if (connectionStateRef.current !== "CONNECTING") {
          updateConnectionState("STALE");
        }
      }
    };

    const markDispatchUnknownAndResync = (attempt: GathererDispatchAttempt, message: string) => {
      if (disposed || !scopeIsCurrent(attempt.scope)) {
        return;
      }
      const outcome = dispatchGate.markUnknown(attempt);
      if (outcome.kind !== "request_resync") {
        return;
      }
      syncMutationPending();
      setDispatchStatus(message);
      if (!requestCurrentResync(attempt.scope) && connectionStateRef.current !== "CONNECTING") {
        updateConnectionState("STALE");
      }
    };

    const refreshAfterDispatchRejection = (
      attempt: GathererDispatchAttempt,
      failure: GathererDispatchRefreshFailure,
      message: string,
    ) => {
      if (disposed || !scopeIsCurrent(attempt.scope)) {
        return;
      }
      const outcome = dispatchGate.markRejectedForRefresh(attempt, failure);
      if (outcome.kind !== "request_resync") {
        markDispatchUnknownAndResync(
          attempt,
          "Dispatch rejection response was invalid. Reading the latest authoritative state once…",
        );
        return;
      }
      dispatchRejectionStatusRef.current = message;
      syncMutationPending();
      setDispatchStatus(`${message} Refreshing authoritative choices…`);
      if (!requestCurrentResync(attempt.scope) && connectionStateRef.current !== "CONNECTING") {
        updateConnectionState("STALE");
      }
    };

    const closeActive = () => {
      pageTools.stop("reconnect");
      webmcpStartedForScope = false;
      heldMovement.stop();
      serverIntent.connectionClosed();
      projectionRef.current?.close();
      projectionRef.current = null;
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
    };

    const connect = async () => {
      const connectionAttempt = connectionGate.begin();
      if (connectionAttempt === null) {
        return;
      }
      closeActive();
      if (disposed) {
        return;
      }
      updateConnectionState("CONNECTING");
      if (!pageMutationGate.pending) {
        setMovementStatus("Movement unavailable while the authoritative connection is starting.");
        setDispatchStatus("Dispatch unavailable while the authoritative connection is starting.");
      }
      try {
        const response = await fetch("/api/game/bootstrap", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("LOCAL_FIXTURE_BOOTSTRAP_UNAVAILABLE");
        }
        const payload = parseGameBootstrap(await response.json()) as GameBootstrapPayload;
        if (disposed || !connectionGate.isCurrent(connectionAttempt)) {
          return;
        }
        const previousScope = bootstrapRef.current ? movementScope(bootstrapRef.current) : null;
        const nextScope = movementScope(payload);
        bootstrapRef.current = payload;
        serverIntent.reset();
        movementGate.setScope(nextScope);
        dispatchGate.setScope(nextScope);
        pageMutationGate.setScope(nextScope);
        setDispatchScope(nextScope);
        if (previousScope !== null && previousScope !== nextScope) {
          movementLeaseRef.current = null;
          dispatchLeaseRef.current = null;
          dispatchRejectionStatusRef.current = null;
          dispatchHasCommandStatusRef.current = false;
          setMovementRecoveryBlocked(false);
          setMovementStatus("Movement unavailable until the new player scope receives an authoritative snapshot.");
          setDispatchStatus("Dispatch unavailable until the new player scope receives an authoritative snapshot.");
        }
        syncMutationPending();
        if (snapshotRef.current && !snapshotMatchesBootstrapScope(snapshotRef.current, payload)) {
          snapshotRef.current = null;
          setSnapshot(null);
        }
        const projection = RealtimeProjectionClient.fromServerScope(payload);
        projectionRef.current = projection;
        setCapability("supported");

        const socket = new WebSocket(gameRealtimeUrl(window.location));
        socketRef.current = socket;
        socket.onopen = () => {
          if (disposed || !connectionGate.isCurrent(connectionAttempt) || socketRef.current !== socket) {
            return;
          }
          updateConnectionState("CONNECTING");
        };
        socket.onmessage = (event) => {
          if (disposed
            || !connectionGate.isCurrent(connectionAttempt)
            || socketRef.current !== socket
            || projectionRef.current !== projection) {
            return;
          }
          let value: unknown;
          try {
            value = JSON.parse(typeof event.data === "string" ? event.data : "");
          } catch {
            connectionGate.complete(connectionAttempt);
            pageTools.stop("reconnect");
            webmcpStartedForScope = false;
            heldMovement.stop();
            serverIntent.connectionClosed();
            updateConnectionState("STALE");
            if (!pageMutationGate.pending) {
              setMovementStatus("Movement unavailable because the realtime frame was invalid. Reconnect to continue.");
              setDispatchStatus("Dispatch unavailable because the realtime frame was invalid. Reconnect to continue.");
            }
            return;
          }
          if (typeof value === "object" && value !== null && !Array.isArray(value)
            && (value as { kind?: unknown }).kind === "movement_intent_result") {
            serverIntent.handleResult(value);
            syncMutationPending();
            return;
          }
          if (!parseFrame(value)) {
            connectionGate.complete(connectionAttempt);
            pageTools.stop("reconnect");
            webmcpStartedForScope = false;
            heldMovement.stop();
            serverIntent.connectionClosed();
            updateConnectionState("STALE");
            if (!pageMutationGate.pending) {
              setMovementStatus("Movement unavailable because the realtime frame was invalid. Reconnect to continue.");
              setDispatchStatus("Dispatch unavailable because the realtime frame was invalid. Reconnect to continue.");
            }
            return;
          }
          const accepted = projection.accept(value);
          connectionGate.complete(connectionAttempt);
          updateConnectionState(projection.state);
          if (!accepted.accepted) {
            pageTools.stop("reconnect");
            webmcpStartedForScope = false;
            heldMovement.stop();
            serverIntent.connectionClosed();
            if (!pageMutationGate.pending) {
              setMovementStatus("Movement unavailable because the realtime projection is stale. Reconnect to continue.");
              setDispatchStatus("Dispatch unavailable because the realtime projection is stale. Reconnect to continue.");
            }
            return;
          }

          const acceptedSnapshot = projection.snapshot;
          if (!acceptedSnapshot) {
            pageTools.stop("reconnect");
            webmcpStartedForScope = false;
            heldMovement.stop();
            serverIntent.connectionClosed();
            updateConnectionState("STALE");
            setMovementStatus("Movement unavailable because the authoritative snapshot is missing. Reconnect to continue.");
            setDispatchStatus("Dispatch unavailable because the authoritative snapshot is missing. Reconnect to continue.");
            return;
          }
          snapshotRef.current = acceptedSnapshot;
          setSnapshot(acceptedSnapshot);
          if (!webmcpStartedForScope) {
            webmcpStartedForScope = true;
            void pageTools.start();
          }
          serverIntent.setReady(true);

          const movementOutcome = movementGate.acceptSnapshot(acceptedSnapshot.player.revision);
          if (movementOutcome.kind === "request_follow_up_resync") {
            setMovementStatus("Move accepted; requesting one follow-up authoritative snapshot.");
            if (!requestCurrentResync(nextScope)) {
              updateConnectionState("STALE");
              setMovementStatus("Movement is stale. Reconnect to finish authoritative reconciliation.");
            }
          } else if (movementOutcome.kind === "reconciled") {
            finishMovement();
            setMovementStatus("Move accepted. Position reconciled from the authoritative snapshot.");
          } else if (movementOutcome.kind === "reconciled_unknown") {
            finishMovement();
            setMovementStatus("Command outcome reconciled to the latest authoritative snapshot.");
          } else if (movementOutcome.kind === "stale") {
            heldMovement.stop();
            updateConnectionState("STALE");
            setMovementStatus("Movement is stale after two authoritative reads. Reconnect to continue.");
          } else if (movementOutcome.kind === "no_pending" && !pageMutationGate.pending) {
            setMovementStatus(serverIntent.activeDirection
              ? `Movement intent active (${serverIntent.activeDirection}). The worker is advancing the player.`
              : "Movement ready. Focus the map or use a direction button.");
          }

          const dispatchOutcome = dispatchGate.acceptSnapshot(nextScope, acceptedSnapshot);
          if (dispatchOutcome.kind === "request_follow_up_resync") {
            setDispatchStatus("Dispatch accepted; requesting one follow-up authoritative snapshot.");
            if (!requestCurrentResync(nextScope)) {
              updateConnectionState("STALE");
              setDispatchStatus("Dispatch is stale. Reconnect to finish authoritative reconciliation.");
            }
          } else if (dispatchOutcome.kind === "reconciled") {
            finishDispatch();
            setDispatchStatus("Dispatch accepted. Mission reconciled from the authoritative snapshot.");
          } else if (dispatchOutcome.kind === "reconciled_advanced") {
            finishDispatch();
            setDispatchStatus("Dispatch was accepted; the authoritative mission has already advanced.");
          } else if (dispatchOutcome.kind === "reconciled_unknown") {
            finishDispatch();
            setDispatchStatus("Command outcome remains unknown. The latest authoritative state is loaded; review it before retrying.");
          } else if (dispatchOutcome.kind === "reconciled_rejection") {
            finishDispatch();
            setDispatchStatus(`${dispatchRejectionStatusRef.current ?? "Dispatch rejected."} Authoritative choices refreshed.`);
            dispatchRejectionStatusRef.current = null;
          } else if (dispatchOutcome.kind === "stale") {
            updateConnectionState("STALE");
            setDispatchStatus("Dispatch is stale after two authoritative reads. Reconnect to continue.");
          } else if (dispatchOutcome.kind === "no_pending"
            && !pageMutationGate.pending
            && !dispatchHasCommandStatusRef.current) {
            setDispatchStatus("Gatherer dispatch ready. Choose a resident soldier and sensed resource target.");
          }
          syncMutationPending();
        };
        socket.onerror = () => {
          if (disposed || !connectionGate.isCurrent(connectionAttempt) || socketRef.current !== socket) {
            return;
          }
          connectionGate.complete(connectionAttempt);
          pageTools.stop("reconnect");
          webmcpStartedForScope = false;
          heldMovement.stop();
          serverIntent.connectionClosed();
          updateConnectionState("STALE");
          if (!pageMutationGate.pending) {
            setMovementStatus("Movement unavailable because the realtime connection is stale. Reconnect to continue.");
            setDispatchStatus("Dispatch unavailable because the realtime connection is stale. Reconnect to continue.");
          }
        };
        socket.onclose = () => {
          if (disposed || !connectionGate.isCurrent(connectionAttempt) || socketRef.current !== socket) {
            return;
          }
          socketRef.current = null;
          projection.close();
          connectionGate.complete(connectionAttempt);
          pageTools.stop("reconnect");
          webmcpStartedForScope = false;
          heldMovement.stop();
          serverIntent.connectionClosed();
          updateConnectionState("CLOSED");
          if (!pageMutationGate.pending) {
            setMovementStatus("Movement unavailable because the realtime connection is closed. Reconnect to continue.");
            setDispatchStatus("Dispatch unavailable because the realtime connection is closed. Reconnect to continue.");
          }
        };
      } catch {
        if (disposed || !connectionGate.isCurrent(connectionAttempt)) {
          return;
        }
        connectionGate.complete(connectionAttempt);
        heldMovement.stop();
        serverIntent.connectionClosed();
        projectionRef.current?.close();
        projectionRef.current = null;
        updateConnectionState("CLOSED");
        if (!pageMutationGate.pending) {
          setMovementStatus("Movement unavailable because the local game session could not start. Reconnect to try again.");
          setDispatchStatus("Dispatch unavailable because the local game session could not start. Reconnect to try again.");
        }
      }
    };

    const submitMove = (direction: MovePlayerDirection): boolean => {
      const bootstrap = bootstrapRef.current;
      const currentSnapshot = snapshotRef.current;
      if (disposed
        || !bootstrap
        || !currentSnapshot
        || !document.hasFocus()
        || document.visibilityState !== "visible"
        || connectionStateRef.current !== "READY"
        || !snapshotMatchesBootstrapScope(currentSnapshot, bootstrap)) {
        return false;
      }

      serverIntent.stop();

      const lease = pageMutationGate.begin("movement");
      if (lease === null) {
        return false;
      }
      const attempt = movementGate.begin(currentSnapshot.player.revision);
      if (attempt === null) {
        pageMutationGate.release(lease);
        return false;
      }
      movementLeaseRef.current = lease;
      syncMutationPending();
      setMovementStatus(`Submitting ${direction} move to the authoritative server…`);

      const envelope: MovePlayerCommandEnvelope = {
        command_id: `browser-move-command:${crypto.randomUUID()}`,
        command_type: "move_player",
        contract_version: bootstrap.contractVersion,
        expected_entity_revisions: { player: attempt.expectedRevision },
        idempotency_key: `browser-move-idempotency:${crypto.randomUUID()}`,
        typed_arguments: { direction },
      };

      void (async () => {
        try {
          const response = await fetch(MOVE_PLAYER_COMMAND_PATH, {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(envelope),
          });
          const responseValue: unknown = await response.json();
          if (disposed || !scopeIsCurrent(attempt.scope)) {
            return;
          }
          if (!response.ok) {
            let errorCode = parseCommandErrorCode(responseValue);
            if (response.status === 409) {
              try {
                errorCode = parseMovePlayerCommandFailure(responseValue, {
                  commandId: envelope.command_id,
                  contractVersion: envelope.contract_version,
                }).error_code;
              } catch {
                errorCode = null;
              }
            }
            if (errorCode === "STALE_REVISION") {
              markUnknownAndResync(attempt, "Player revision changed. Reconciling before another move…");
              return;
            }
            if (errorCode !== null && response.status < 500) {
              heldMovement.stop();
              if (!movementGate.reject(attempt)) {
                return;
              }
              finishMovement();
              setMovementStatus(errorCode === "MOVEMENT_BLOCKED"
                ? "Movement blocked. The player remains at the authoritative position."
                : `Movement unavailable (${errorCode}).`);
              return;
            }
            markUnknownAndResync(attempt, "Command outcome unknown. Reconciling with the authoritative server…");
            return;
          }

          let acknowledgement;
          try {
            acknowledgement = parseMovePlayerCommandSuccess(responseValue, {
              commandId: envelope.command_id,
              contractVersion: envelope.contract_version,
            });
          } catch {
            markUnknownAndResync(attempt, "Command response was invalid. Reconciling with the authoritative server…");
            return;
          }
          const outcome = movementGate.acknowledge(attempt, acknowledgement.current_entity_revisions.player);
          if (outcome.kind !== "request_resync") {
            markUnknownAndResync(attempt, "Command revision was invalid. Reconciling with the authoritative server…");
            return;
          }
          syncMutationPending();
          setMovementStatus("Move accepted by the server. Reconciling authoritative position…");
          if (!requestCurrentResync(attempt.scope)) {
            if (connectionStateRef.current === "CONNECTING") {
              setMovementStatus("Move accepted. Waiting for the current authoritative connection to reconcile position…");
            } else {
              updateConnectionState("STALE");
              setMovementStatus("Move accepted, but the projection is stale. Reconnect to reconcile position.");
            }
          }
        } catch {
          markUnknownAndResync(attempt, "Command outcome unknown. Reconciling with the authoritative server…");
        }
      })();
      return true;
    };

    const submitDispatch = (selection: GathererDispatchSelection): boolean => {
      const bootstrap = bootstrapRef.current;
      const currentSnapshot = snapshotRef.current;
      if (disposed
        || !bootstrap
        || !currentSnapshot
        || !document.hasFocus()
        || document.visibilityState !== "visible"
        || connectionStateRef.current !== "READY"
        || !snapshotMatchesBootstrapScope(currentSnapshot, bootstrap)) {
        return false;
      }
      serverIntent.stop();
      const currentSelection = resolveGathererDispatchSelection(
        currentSnapshot,
        selection.soldierId,
        selection.targetId,
      );
      if (!currentSelection
        || currentSelection.tool !== selection.tool
        || currentSelection.expectedSoldierRevision !== selection.expectedSoldierRevision) {
        setDispatchStatus("Dispatch selection is no longer current. Wait for the latest authoritative snapshot.");
        return false;
      }

      const lease = pageMutationGate.begin("dispatch");
      if (lease === null) {
        return false;
      }
      const attempt = dispatchGate.begin({
        soldierId: currentSelection.soldierId,
        targetId: currentSelection.targetId,
        tool: currentSelection.tool,
        expectedSoldierRevision: currentSelection.expectedSoldierRevision,
      });
      if (attempt === null) {
        pageMutationGate.release(lease);
        return false;
      }
      dispatchLeaseRef.current = lease;
      dispatchHasCommandStatusRef.current = true;
      dispatchRejectionStatusRef.current = null;
      syncMutationPending();
      setDispatchStatus("Submitting gatherer mission to the authoritative server…");

      const envelope: AssignSoldierMissionCommandEnvelope = {
        command_id: `browser-dispatch-command:${crypto.randomUUID()}`,
        command_type: "assign_soldier_mission",
        contract_version: bootstrap.contractVersion,
        expected_entity_revisions: { soldier: attempt.expectedSoldierRevision },
        idempotency_key: `browser-dispatch-idempotency:${crypto.randomUUID()}`,
        typed_arguments: {
          soldier_id: attempt.soldierId,
          role: "GATHERER",
          tool: currentSelection.tool,
          equipment_tier: 1,
          target_id: attempt.targetId,
          return_policy: "WHEN_FULL",
        },
      };

      void (async () => {
        try {
          const response = await fetch(ASSIGN_SOLDIER_MISSION_COMMAND_PATH, {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(envelope),
          });
          const responseValue: unknown = await response.json();
          if (disposed || !scopeIsCurrent(attempt.scope)) {
            return;
          }
          if (!response.ok) {
            let errorCode = parseCommandErrorCode(responseValue);
            let refreshFailure: GathererDispatchRefreshFailure | null = null;
            if (response.status === 409 || response.status === 403) {
              try {
                const failure = parseAssignSoldierMissionCommandFailure(responseValue, {
                  commandId: envelope.command_id,
                  contractVersion: envelope.contract_version,
                });
                errorCode = failure.error_code;
                if (failure.error_code !== "NOT_OWNER"
                  && (failure.error_code === "STALE_REVISION"
                    || failure.error_code === "ROLE_LOCKED"
                    || failure.error_code === "NOT_AT_SHELTER"
                    || failure.error_code === "MISSION_ACTIVE"
                    || failure.error_code === "TARGET_UNAVAILABLE")) {
                  refreshFailure = {
                    code: failure.error_code,
                    currentSoldierRevision: failure.current_entity_revisions.soldier,
                  };
                }
              } catch {
                errorCode = null;
              }
            }
            if (isDispatchRefreshFailureCode(errorCode)) {
              if (!refreshFailure) {
                markDispatchUnknownAndResync(
                  attempt,
                  "Dispatch rejection response was invalid. Reading the latest authoritative state once…",
                );
                return;
              }
              const message = errorCode === "STALE_REVISION"
                ? "Dispatch rejected because the soldier revision changed."
                : errorCode === "TARGET_UNAVAILABLE"
                  ? "Dispatch rejected because the resource target is unavailable."
                  : "Dispatch rejected because the soldier is no longer ready at the shelter.";
              refreshAfterDispatchRejection(
                attempt,
                refreshFailure,
                message,
              );
              return;
            }
            if (errorCode !== null && response.status < 500) {
              if (!dispatchGate.reject(attempt)) {
                return;
              }
              finishDispatch();
              const message = errorCode === "NOT_OWNER"
                ? "Dispatch rejected because the soldier is not available in this player scope."
                : errorCode === "TOOL_INCOMPATIBLE"
                  ? "Dispatch rejected because the selected tool is incompatible with the target."
                  : errorCode === "DUPLICATE_COMMAND"
                    ? "Dispatch rejected because the command identity conflicts with an earlier request."
                    : `Dispatch unavailable (${errorCode}).`;
              setDispatchStatus(message);
              return;
            }
            markDispatchUnknownAndResync(attempt, "Command outcome unknown. Reading the latest authoritative state once…");
            return;
          }

          let acknowledgement;
          try {
            acknowledgement = parseAssignSoldierMissionCommandSuccess(responseValue, {
              commandId: envelope.command_id,
              contractVersion: envelope.contract_version,
            });
          } catch {
            markDispatchUnknownAndResync(attempt, "Command response was invalid. Reading the latest authoritative state once…");
            return;
          }
          const outcome = dispatchGate.acknowledge(attempt, {
            soldierId: acknowledgement.soldier_id,
            missionId: acknowledgement.mission_id,
            missionAttemptId: acknowledgement.mission_attempt_id,
            eventId: acknowledgement.event_id,
            committedRevisions: {
              soldier: acknowledgement.committed_entity_revisions.soldier,
              mission: acknowledgement.committed_entity_revisions.mission,
              missionAttempt: acknowledgement.committed_entity_revisions.mission_attempt,
            },
          });
          if (outcome.kind !== "request_resync") {
            markDispatchUnknownAndResync(attempt, "Command revision vector was invalid. Reading the latest authoritative state once…");
            return;
          }
          syncMutationPending();
          setDispatchStatus("Dispatch accepted by the server. Reconciling authoritative mission state…");
          if (!requestCurrentResync(attempt.scope)) {
            if (connectionStateRef.current === "CONNECTING") {
              setDispatchStatus("Dispatch accepted. Waiting for the current authoritative connection to reconcile mission state…");
            } else {
              updateConnectionState("STALE");
              setDispatchStatus("Dispatch accepted, but the projection is stale. Reconnect to reconcile mission state.");
            }
          }
        } catch {
          markDispatchUnknownAndResync(attempt, "Command outcome unknown. Reading the latest authoritative state once…");
        }
      })();
      return true;
    };

    reconnectRef.current = () => {
      void connect();
    };
    submitMoveRef.current = submitMove;
    submitDispatchRef.current = submitDispatch;
    void connect();
    return () => {
      disposed = true;
      pageTools.stop("unmount");
      if (webmcpRegistrarRef.current === pageTools) {
        webmcpRegistrarRef.current = null;
      }
      connectionGate.invalidate();
      movementGate.invalidate();
      heldMovement.stop();
      serverIntent.connectionClosed();
      dispatchGate.invalidate();
      pageMutationGate.invalidate();
      reconnectRef.current = null;
      submitMoveRef.current = null;
      submitDispatchRef.current = null;
      movementLeaseRef.current = null;
      dispatchLeaseRef.current = null;
      bootstrapRef.current = null;
      closeActive();
    };
  }, []);

  useEffect(() => {
    const heldMovement = heldMovementRef.current;
    if (heldMovement === null) {
      return;
    }
      heldMovement.setState({
        available: connectionState === "READY" && snapshot !== null,
        pending: movementPending,
        blocked: shouldBlockHeldMovement({
          recoveryRequired: movementRecoveryBlocked,
          pageMutationPending,
          movementPending,
        }),
      });
  }, [connectionState, movementPending, movementRecoveryBlocked, pageMutationPending, snapshot]);

  const stopHeldMovement = useCallback(() => {
    serverIntentRef.current?.stop();
    heldMovementRef.current?.stop();
  }, []);

  useEffect(() => {
    const stopForLifecycleChange = () => {
      stopHeldMovement();
    };
    window.addEventListener("blur", stopForLifecycleChange);
    document.addEventListener("visibilitychange", stopForLifecycleChange);
    return () => {
      window.removeEventListener("blur", stopForLifecycleChange);
      document.removeEventListener("visibilitychange", stopForLifecycleChange);
    };
  }, [stopHeldMovement]);

  const commandSurfaceReady = connectionState === "READY" && snapshot !== null && !pageMutationPending;

  return (
    <GameProjection
      snapshot={snapshot}
      connectionState={connectionState}
      capability={capability}
      webmcpStatus={webmcpStatus}
      webmcpStatusMessage={webmcpStatusMessage}
      pageMutationPending={pageMutationPending}
      movementEnabled={connectionState === "READY" && snapshot !== null && !movementRecoveryBlocked && (!pageMutationPending || movementPending)}
      movementPending={movementPending}
      movementStatus={movementStatus}
      dispatchScope={dispatchScope}
      dispatchEnabled={commandSurfaceReady}
      dispatchPending={dispatchPending}
      dispatchStatus={dispatchStatus}
      onMove={(direction) => submitMoveRef.current?.(direction) ?? false}
      onHoldStart={(direction) => serverIntentRef.current?.start(direction) ?? false}
      onHoldStop={stopHeldMovement}
      onDispatch={(selection) => submitDispatchRef.current?.(selection) ?? false}
      onReconnect={() => reconnectRef.current?.()}
    />
  );
}
