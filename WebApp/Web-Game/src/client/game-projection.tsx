"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { ClientSnapshot } from "../server/world-projection";
import type { MovePlayerDirection } from "../shared/move-player-command";
import {
  buildGathererDispatchChoices,
  resolveGathererDispatchSelection,
  type GathererDispatchSelection,
} from "./gatherer-dispatch";
import {
  directionForMapKey,
  directionForMapKeyName,
  shouldSuppressMapKeyDefault,
  shouldSuppressDirectionButtonKey,
} from "./keyboard-movement";
import type { RealtimeCapability, RealtimeConnectionState } from "./realtime-projection";
import type { WebMcpPageStatus } from "./webmcp-page-tools";
import {
  buildAccessibleMissionRows,
  buildCanvasDrawCommands,
  buildProjectionViewModel,
  getProjectionViewport,
} from "./projection-model";
import styles from "./game-projection.module.css";
import { VisualIcon } from "./visual-icons";

const TILE_SIZE = 24;

export interface GameProjectionProps {
  snapshot: ClientSnapshot | null;
  connectionState: RealtimeConnectionState;
  capability: RealtimeCapability;
  webmcpStatus: WebMcpPageStatus;
  webmcpStatusMessage: string;
  pageMutationPending: boolean;
  movementEnabled: boolean;
  movementPending: boolean;
  movementStatus: string;
  dispatchScope: string | null;
  dispatchEnabled: boolean;
  dispatchPending: boolean;
  dispatchStatus: string;
  onMove: (direction: MovePlayerDirection) => boolean;
  onHoldStart: (direction: MovePlayerDirection) => boolean;
  onHoldStop: () => void;
  onDispatch: (selection: GathererDispatchSelection) => boolean;
  onReconnect: () => void;
}

function drawFrame(canvas: HTMLCanvasElement, props: {
  view: ReturnType<typeof buildProjectionViewModel>;
  commands: ReturnType<typeof buildCanvasDrawCommands>;
}): void {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const viewport = getProjectionViewport(props.view);
  const width = viewport ? viewport.width * TILE_SIZE : 32 * TILE_SIZE;
  const height = viewport ? viewport.height * TILE_SIZE : 20 * TILE_SIZE;
  const pixelRatio = typeof window === "undefined" ? 1 : Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.aspectRatio = `${width} / ${height}`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const toCanvas = (x: number, y: number) => ({
    x: (x - (viewport?.left ?? 0)) * TILE_SIZE,
    y: (y - (viewport?.top ?? 0)) * TILE_SIZE,
  });
  for (const command of props.commands) {
    if (command.kind === "clear") {
      context.fillStyle = command.color;
      context.fillRect(0, 0, width, height);
      continue;
    }
    if (command.kind === "tile") {
      const point = toCanvas(command.x, command.y);
      context.fillStyle = command.blocked
        ? "#27342f"
        : command.explored ? "#29483d" : "#0d1d18";
      context.fillRect(point.x, point.y, TILE_SIZE, TILE_SIZE);
      context.strokeStyle = command.explored ? "#34584a" : "#122820";
      context.strokeRect(point.x, point.y, TILE_SIZE, TILE_SIZE);
      continue;
    }
    if (command.kind === "resource") {
      const point = toCanvas(command.x, command.y);
      context.fillStyle = command.resourceType === "wood" ? "#b9783f" : "#9ba8a1";
      if (command.availability === "DEPLETED") {
        context.globalAlpha = 0.45;
      }
      context.beginPath();
      context.arc(point.x + TILE_SIZE / 2, point.y + TILE_SIZE / 2, TILE_SIZE * 0.3, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      continue;
    }
    if (command.kind === "route") {
      if (command.points.length < 2) {
        continue;
      }
      context.strokeStyle = "#d6c27a";
      context.lineWidth = 2;
      context.beginPath();
      command.points.forEach((point, index) => {
        const canvasPoint = toCanvas(point.x, point.y);
        if (index === 0) {
          context.moveTo(canvasPoint.x + TILE_SIZE / 2, canvasPoint.y + TILE_SIZE / 2);
        } else {
          context.lineTo(canvasPoint.x + TILE_SIZE / 2, canvasPoint.y + TILE_SIZE / 2);
        }
      });
      context.stroke();
      continue;
    }
    const point = toCanvas(command.x, command.y);
    const centerX = point.x + TILE_SIZE / 2;
    const centerY = point.y + TILE_SIZE / 2;
    const radius = TILE_SIZE * 0.34;
    context.fillStyle = command.actorKind === "monster"
      ? "#b978c6"
      : command.actorKind === "shelter"
        ? "#d6c27a"
        : command.actorKind === "player"
          ? "#85c7b1"
          : command.role === "HUNTER" ? "#d47878" : "#79a9d1";
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = command.cargoCapacityUsed > 0 ? "#f2d27d" : "#f2f6e9";
    context.lineWidth = 2;
    context.stroke();
  }
}

export function GameProjection({
  snapshot,
  connectionState,
  capability,
  webmcpStatus,
  webmcpStatusMessage,
  pageMutationPending,
  movementEnabled,
  movementPending,
  movementStatus,
  dispatchScope,
  dispatchEnabled,
  dispatchPending,
  dispatchStatus,
  onMove,
  onHoldStart,
  onHoldStop,
  onDispatch,
  onReconnect,
}: GameProjectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapKeyboardDirectionRef = useRef<MovePlayerDirection | null>(null);
  const buttonKeyboardDirectionRef = useRef<MovePlayerDirection | null>(null);
  const pointerHoldRef = useRef<number | null>(null);
  const pointerHoldTargetRef = useRef<HTMLButtonElement | null>(null);
  const ignoredPointerTargetsRef = useRef(new Map<number, HTMLButtonElement>());
  const ignoredPointerClickTargetsRef = useRef(new Set<HTMLButtonElement>());
  const suppressNextClickRef = useRef(false);
  const clickSuppressionTimerRef = useRef<number | null>(null);
  const [selectedSoldierId, setSelectedSoldierId] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const view = useMemo(() => buildProjectionViewModel({ snapshot, connectionState, capability }), [snapshot, connectionState, capability]);
  const commands = useMemo(() => buildCanvasDrawCommands(view), [view]);
  const rows = useMemo(() => buildAccessibleMissionRows(view), [view]);
  const dispatchChoices = useMemo(
    () => buildGathererDispatchChoices(view.snapshotStatus === "READY" ? snapshot : null),
    [snapshot, view.snapshotStatus],
  );
  const selectedSoldier = dispatchChoices.soldiers.find(
    (choice) => choice.soldierId === selectedSoldierId && !choice.disabled,
  ) ?? null;
  const selectedTarget = dispatchChoices.targets.find((choice) => choice.targetId === selectedTargetId && !choice.disabled) ?? null;
  const sensedWood = view.resourceNodes.filter((node) => node.resourceType === "wood").length;
  const sensedRock = view.resourceNodes.filter((node) => node.resourceType === "rock").length;
  const sensedNodeCount = view.snapshotStatus === "READY" ? { wood: sensedWood, rock: sensedRock } : null;

  useEffect(() => {
    if (canvasRef.current) {
      drawFrame(canvasRef.current, { view, commands });
    }
  }, [view, commands]);

  useEffect(() => {
    setSelectedSoldierId("");
    setSelectedTargetId("");
  }, [dispatchScope]);

  useEffect(() => {
    if (selectedSoldierId !== ""
      && !dispatchChoices.soldiers.some((choice) => choice.soldierId === selectedSoldierId && !choice.disabled)) {
      setSelectedSoldierId("");
    }
    if (selectedTargetId !== ""
      && !dispatchChoices.targets.some((choice) => choice.targetId === selectedTargetId && !choice.disabled)) {
      setSelectedTargetId("");
    }
  }, [dispatchChoices, selectedSoldierId, selectedTargetId]);

  const clearClickSuppression = () => {
    if (clickSuppressionTimerRef.current !== null) {
      window.clearTimeout(clickSuppressionTimerRef.current);
      clickSuppressionTimerRef.current = null;
    }
    suppressNextClickRef.current = false;
  };

  const armClickSuppression = () => {
    clearClickSuppression();
    suppressNextClickRef.current = true;
    clickSuppressionTimerRef.current = window.setTimeout(() => {
      clickSuppressionTimerRef.current = null;
      suppressNextClickRef.current = false;
    }, 0);
  };

  const beginPointerClickSuppression = () => {
    clearClickSuppression();
    suppressNextClickRef.current = true;
  };

  const releasePointerCapture = () => {
    const pointerId = pointerHoldRef.current;
    const target = pointerHoldTargetRef.current;
    pointerHoldRef.current = null;
    pointerHoldTargetRef.current = null;
    if (pointerId !== null && target?.hasPointerCapture(pointerId)) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // The browser may have already released capture during teardown.
      }
    }
  };

  const finishIgnoredPointer = (pointerId: number) => {
    const target = ignoredPointerTargetsRef.current.get(pointerId);
    if (!target) {
      return;
    }
    ignoredPointerTargetsRef.current.delete(pointerId);
    ignoredPointerClickTargetsRef.current.add(target);
    window.setTimeout(() => {
      ignoredPointerClickTargetsRef.current.delete(target);
    }, 0);
  };

  const cancelActiveGesture = () => {
    mapKeyboardDirectionRef.current = null;
    buttonKeyboardDirectionRef.current = null;
    releasePointerCapture();
    ignoredPointerTargetsRef.current.clear();
    ignoredPointerClickTargetsRef.current.clear();
    clearClickSuppression();
    onHoldStop();
  };

  const finishPointerHold = (pointerId: number, clearClick: boolean) => {
    if (pointerHoldRef.current !== pointerId) {
      return;
    }
    releasePointerCapture();
    onHoldStop();
    if (clearClick) {
      clearClickSuppression();
    } else {
      // A generated click normally follows pointerup/lostpointercapture in the
      // same turn. If no click is generated, the token expires without
      // swallowing a later assistive or programmatic activation.
      armClickSuppression();
    }
  };

  useEffect(() => {
    const stopPointerHold = (event: PointerEvent) => {
      if (pointerHoldRef.current === event.pointerId) {
        finishPointerHold(event.pointerId, event.type === "pointercancel");
      } else {
        finishIgnoredPointer(event.pointerId);
      }
    };
    const stopForLifecycleChange = () => {
      cancelActiveGesture();
    };
    window.addEventListener("pointerup", stopPointerHold);
    window.addEventListener("pointercancel", stopPointerHold);
    window.addEventListener("blur", stopForLifecycleChange);
    document.addEventListener("visibilitychange", stopForLifecycleChange);
    return () => {
      window.removeEventListener("pointerup", stopPointerHold);
      window.removeEventListener("pointercancel", stopPointerHold);
      window.removeEventListener("blur", stopForLifecycleChange);
      document.removeEventListener("visibilitychange", stopForLifecycleChange);
      cancelActiveGesture();
    };
  }, [onHoldStop]);

  useEffect(() => {
    if (connectionState === "READY" && movementEnabled && !(pageMutationPending && !movementPending)) {
      return;
    }
    cancelActiveGesture();
  }, [connectionState, movementEnabled, movementPending, onHoldStop, pageMutationPending]);

  const handleMapKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const pageFocused = document.hasFocus();
    const pageVisible = document.visibilityState === "visible";
    const movementSurfaceFocused = document.activeElement === event.currentTarget;
    const isComposing = event.nativeEvent.isComposing;
    const mapKeyInput = {
      key: event.key,
      repeat: event.repeat,
      isComposing,
      defaultPrevented: event.defaultPrevented,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pageFocused,
      pageVisible,
      movementSurfaceFocused,
      connectionReady: connectionState === "READY",
      snapshotReady: view.snapshotStatus === "READY",
      commandPending: pageMutationPending && !movementPending,
    };
    const direction = directionForMapKey({
      ...mapKeyInput,
    });
    if (shouldSuppressMapKeyDefault({
      key: event.key,
      isComposing,
      defaultPrevented: event.defaultPrevented,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pageFocused,
      pageVisible,
      movementSurfaceFocused,
    })) {
      event.preventDefault();
    }
    if (direction !== null && onHoldStart(direction)) {
      mapKeyboardDirectionRef.current = direction;
      buttonKeyboardDirectionRef.current = null;
    }
  };

  const handleMapKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const direction = directionForMapKeyName(event.key);
    if (direction !== null && mapKeyboardDirectionRef.current === direction) {
      mapKeyboardDirectionRef.current = null;
      onHoldStop();
    }
  };

  const handleDirectionButtonKeyDown = (
    direction: MovePlayerDirection,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    if (shouldSuppressDirectionButtonKey(event)) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    if (!event.repeat && onHoldStart(direction)) {
      mapKeyboardDirectionRef.current = null;
      buttonKeyboardDirectionRef.current = direction;
    }
  };

  const handleDirectionButtonKeyUp = (
    direction: MovePlayerDirection,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    if (buttonKeyboardDirectionRef.current === direction) {
      buttonKeyboardDirectionRef.current = null;
      onHoldStop();
    }
  };

  const handleDirectionButtonBlur = (direction: MovePlayerDirection) => {
    if (buttonKeyboardDirectionRef.current === direction) {
      buttonKeyboardDirectionRef.current = null;
      onHoldStop();
    }
  };

  const handleDirectionPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    direction: MovePlayerDirection,
  ) => {
    if ((event.pointerType === "mouse" || event.pointerType === "pen") && event.button !== 0) {
      return;
    }
    if (pointerHoldRef.current !== null && pointerHoldRef.current !== event.pointerId) {
      event.preventDefault();
      ignoredPointerTargetsRef.current.set(event.pointerId, event.currentTarget);
      return;
    }
    if (pointerHoldRef.current === event.pointerId) {
      event.preventDefault();
      return;
    }
    if (!onHoldStart(direction)) {
      return;
    }
    event.preventDefault();
    beginPointerClickSuppression();
    mapKeyboardDirectionRef.current = null;
    buttonKeyboardDirectionRef.current = null;
    pointerHoldRef.current = event.pointerId;
    pointerHoldTargetRef.current = event.currentTarget;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is a convenience; the window listener still releases the hold.
    }
  };

  const handleDirectionPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerHoldRef.current === event.pointerId) {
      finishPointerHold(event.pointerId, event.type === "pointercancel");
    } else {
      finishIgnoredPointer(event.pointerId);
    }
  };

  const handleDirectionClick = (
    direction: MovePlayerDirection,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (event.detail > 0
      && (suppressNextClickRef.current || ignoredPointerClickTargetsRef.current.has(event.currentTarget))) {
      clearClickSuppression();
      ignoredPointerClickTargetsRef.current.delete(event.currentTarget);
      return;
    }
    ignoredPointerClickTargetsRef.current.delete(event.currentTarget);
    clearClickSuppression();
    onMove(direction);
  };

  const handleDispatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selection = resolveGathererDispatchSelection(snapshot, selectedSoldierId, selectedTargetId);
    if (selection) {
      onDispatch(selection);
    }
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Persistent magical frontier</p>
          <h1 className={styles.title}>Sleepless Kingdom</h1>
        </div>
        <div className={styles.badges} aria-label="Connection and capability status">
          <span className={styles.badge}>Connection: {connectionState}</span>
          <span className={styles.badge}>Realtime capability: {capability}</span>
          <span className={styles.badge} title={webmcpStatusMessage}>WebMCP: {webmcpStatus}</span>
        </div>
      </header>

      <div className={styles.statusRow}>
        <p className={styles.status} role="status" aria-live="polite">
          {view.snapshotStatus !== "READY" ? <VisualIcon name="icon_warning" className={styles.statusIcon} /> : null}
          <span>{view.statusMessage}</span>
        </p>
        <p className={styles.capabilityStatus} role="status" aria-live="polite">{webmcpStatusMessage}</p>
        {connectionState !== "READY" ? (
          <button
            type="button"
            className={styles.reconnectButton}
            onClick={onReconnect}
            disabled={connectionState === "CONNECTING"}
            aria-label={connectionState === "CONNECTING" ? "Connecting to the realtime server" : "Reconnect to the realtime server"}
          >
            {connectionState === "CONNECTING" ? "Connecting…" : "Reconnect"}
          </button>
        ) : null}
      </div>

      <section className={styles.layout} aria-label="Game projection">
        <div
          className={styles.mapCard}
          role="group"
          tabIndex={0}
          aria-labelledby="world-map-heading"
          aria-describedby="movement-help player-position movement-status"
          aria-keyshortcuts="W A S D ArrowUp ArrowLeft ArrowDown ArrowRight"
          onKeyDown={handleMapKeyDown}
          onKeyUp={handleMapKeyUp}
          onBlur={(event) => {
            if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
              if (mapKeyboardDirectionRef.current !== null) {
                mapKeyboardDirectionRef.current = null;
                onHoldStop();
              }
              return;
            }
            cancelActiveGesture();
          }}
        >
          <div className={styles.sectionHeading}>
            <h2 className={styles.sectionTitle} id="world-map-heading"><VisualIcon name="icon_landmark" className={styles.icon} /> World map</h2>
            <span>{view.worldTime === null ? "No world time" : `World time ${view.worldTime}`}</span>
          </div>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="Top-down world projection. The text mission list below is the accessible equivalent." />
          <div className={styles.movementPanel}>
            <div className={styles.movementCopy}>
              <p id="movement-help" className={styles.movementHelp}>Focus this map, then press or hold W A S D or the arrow keys. Holding sends one server-owned movement intent; the worker advances it and authoritative snapshots render each result.</p>
              <p id="player-position" className={styles.playerPosition}>
                {snapshot
                  ? `Player position ${snapshot.player.position.x}, ${snapshot.player.position.y} · revision ${snapshot.player.revision}`
                  : "Player position waiting for an authoritative snapshot"}
              </p>
              <p id="movement-status" className={styles.movementStatus} role="status" aria-live="polite">{movementStatus}</p>
            </div>
            <div className={styles.directionPad} role="group" aria-label="Move player one tile" aria-busy={movementPending}>
              <button
                type="button"
                className={`${styles.directionButton} ${styles.directionUp}`}
                aria-label="Move player up"
                disabled={!movementEnabled}
                onKeyDown={(event) => handleDirectionButtonKeyDown("up", event)}
                onKeyUp={(event) => handleDirectionButtonKeyUp("up", event)}
                onBlur={() => handleDirectionButtonBlur("up")}
                onPointerDown={(event) => handleDirectionPointerDown(event, "up")}
                onPointerUp={handleDirectionPointerEnd}
                onPointerCancel={handleDirectionPointerEnd}
                onLostPointerCapture={handleDirectionPointerEnd}
                onClick={(event) => handleDirectionClick("up", event)}
              >
                <span aria-hidden="true">↑</span><span>W</span>
              </button>
              <button
                type="button"
                className={`${styles.directionButton} ${styles.directionLeft}`}
                aria-label="Move player left"
                disabled={!movementEnabled}
                onKeyDown={(event) => handleDirectionButtonKeyDown("left", event)}
                onKeyUp={(event) => handleDirectionButtonKeyUp("left", event)}
                onBlur={() => handleDirectionButtonBlur("left")}
                onPointerDown={(event) => handleDirectionPointerDown(event, "left")}
                onPointerUp={handleDirectionPointerEnd}
                onPointerCancel={handleDirectionPointerEnd}
                onLostPointerCapture={handleDirectionPointerEnd}
                onClick={(event) => handleDirectionClick("left", event)}
              >
                <span aria-hidden="true">←</span><span>A</span>
              </button>
              <button
                type="button"
                className={`${styles.directionButton} ${styles.directionDown}`}
                aria-label="Move player down"
                disabled={!movementEnabled}
                onKeyDown={(event) => handleDirectionButtonKeyDown("down", event)}
                onKeyUp={(event) => handleDirectionButtonKeyUp("down", event)}
                onBlur={() => handleDirectionButtonBlur("down")}
                onPointerDown={(event) => handleDirectionPointerDown(event, "down")}
                onPointerUp={handleDirectionPointerEnd}
                onPointerCancel={handleDirectionPointerEnd}
                onLostPointerCapture={handleDirectionPointerEnd}
                onClick={(event) => handleDirectionClick("down", event)}
              >
                <span aria-hidden="true">↓</span><span>S</span>
              </button>
              <button
                type="button"
                className={`${styles.directionButton} ${styles.directionRight}`}
                aria-label="Move player right"
                disabled={!movementEnabled}
                onKeyDown={(event) => handleDirectionButtonKeyDown("right", event)}
                onKeyUp={(event) => handleDirectionButtonKeyUp("right", event)}
                onBlur={() => handleDirectionButtonBlur("right")}
                onPointerDown={(event) => handleDirectionPointerDown(event, "right")}
                onPointerUp={handleDirectionPointerEnd}
                onPointerCancel={handleDirectionPointerEnd}
                onLostPointerCapture={handleDirectionPointerEnd}
                onClick={(event) => handleDirectionClick("right", event)}
              >
                <span aria-hidden="true">→</span><span>D</span>
              </button>
            </div>
          </div>
          <p className={styles.mapLegend}><VisualIcon name="icon_landmark" className={styles.icon} /> <span>Discovered landmarks use the same text and map projection.</span></p>
          <p className={styles.caption}>Geometric placeholders preserve map, route, and cargo meaning while visual assets are still replaceable.</p>
        </div>

        <aside className={styles.dashboard} aria-label="Shelter dashboard">
          <section>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Shelter</h2>
              <span>{view.shelter?.shelterId ?? "Waiting"}</span>
            </div>
            <p className={styles.metric}><span className={styles.iconLabel}><VisualIcon name="icon_coin" className={styles.icon} /> Coins</span> <strong>{view.shelter?.coins ?? "—"}</strong></p>
            <div className={styles.resourceSummary} aria-label="Sensed Wood and Rock resource nodes">
              <span className={styles.resourceChip}><VisualIcon name="icon_wood" className={styles.icon} /> <span>Wood <strong>{sensedNodeCount?.wood ?? "—"}</strong></span></span>
              <span className={styles.resourceChip}><VisualIcon name="icon_rock" className={styles.icon} /> <span>Rock <strong>{sensedNodeCount?.rock ?? "—"}</strong></span></span>
            </div>
            <p className={styles.muted}>All values come from the latest server snapshot.</p>
          </section>

          <section aria-labelledby="missions-heading">
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle} id="missions-heading">Mission status</h2>
              <span>{rows.length} soldiers</span>
            </div>
            <div className={styles.toolLegend} aria-label="Mission tool cues">
              <span className={styles.iconLabel}><VisualIcon name="icon_pickaxe" className={styles.icon} /> Gather</span>
              <span className={styles.iconLabel}><VisualIcon name="icon_sword" className={styles.icon} /> Hunt</span>
              <span className={styles.iconLabel}><VisualIcon name="icon_cargo" className={styles.icon} /> Cargo</span>
            </div>
            {rows.length === 0 ? (
              <p className={styles.muted}>Mission rows appear after an authoritative snapshot is accepted.</p>
            ) : (
              <ol className={styles.missions}>
                {rows.map((row) => <li key={row.soldierId}>{row.text}</li>)}
              </ol>
            )}
          </section>

          <section aria-labelledby="dispatch-heading">
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle} id="dispatch-heading"><VisualIcon name="icon_pickaxe" className={styles.icon} /> Gatherer command</h2>
              <span>Human control</span>
            </div>
            <form className={styles.dispatchForm} onSubmit={handleDispatch}>
              <fieldset
                className={styles.dispatchFieldset}
                disabled={!dispatchEnabled || !dispatchChoices.ready}
                aria-busy={dispatchPending}
                aria-describedby="dispatch-availability dispatch-policy dispatch-risk dispatch-status"
              >
                <legend>Dispatch gatherer</legend>
                <p id="dispatch-availability" className={styles.dispatchHelp}>
                  {dispatchChoices.unavailableReason
                    ?? (pageMutationPending && !dispatchPending
                      ? "Dispatch waits until the current page command is authoritatively settled."
                      : "Choose a resident soldier and a resource available in the latest authoritative snapshot.")}
                </p>
                <label className={styles.dispatchLabel} htmlFor="dispatch-soldier">Resident soldier</label>
                <select
                  className={styles.dispatchSelect}
                  id="dispatch-soldier"
                  value={selectedSoldierId}
                  onChange={(event) => setSelectedSoldierId(event.target.value)}
                >
                  <option value="">Select a resident soldier</option>
                  {dispatchChoices.soldiers.map((choice) => (
                    <option key={choice.soldierId} value={choice.soldierId} disabled={choice.disabled}>
                      {choice.label}
                    </option>
                  ))}
                </select>

                <label className={styles.dispatchLabel} htmlFor="dispatch-target">Sensed resource target</label>
                <select
                  className={styles.dispatchSelect}
                  id="dispatch-target"
                  value={selectedTargetId}
                  onChange={(event) => setSelectedTargetId(event.target.value)}
                >
                  <option value="">Select Wood or Rock</option>
                  {dispatchChoices.targets.map((choice) => (
                    <option key={choice.targetId} value={choice.targetId} disabled={choice.disabled}>
                      {choice.label}
                    </option>
                  ))}
                </select>

                <dl id="dispatch-policy" className={styles.dispatchPolicy} aria-label="Fixed gatherer mission policy">
                  <div><dt>Role</dt><dd>GATHERER</dd></div>
                  <div><dt>Tier</dt><dd>Tier 1</dd></div>
                  <div><dt>Tool</dt><dd>{selectedTarget?.tool ?? "Select a target"}</dd></div>
                  <div><dt>Return</dt><dd>WHEN_FULL</dd></div>
                </dl>
                <p id="dispatch-risk" className={styles.dispatchRisk}>Cargo remains unbanked until shelter deposit.</p>
                <button
                  type="submit"
                  className={styles.dispatchButton}
                  disabled={selectedSoldier === null || selectedTarget === null}
                >
                  {dispatchPending ? "Dispatching…" : "Dispatch gatherer"}
                </button>
              </fieldset>
            </form>
            <p id="dispatch-status" className={styles.dispatchStatus} role="status" aria-live="polite">
              {dispatchStatus}
            </p>
          </section>

          <section aria-labelledby="events-heading">
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle} id="events-heading">Causal history</h2>
              <span>{view.recentEvents.length} events</span>
            </div>
            {view.recentEvents.length === 0 ? (
              <p className={styles.muted}>No visible causal events yet.</p>
            ) : (
              <ul className={styles.events}>
                {view.recentEvents.map((event) => (
                  <li key={event.eventId}>{event.eventType} · world time {event.worldTime}</li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
