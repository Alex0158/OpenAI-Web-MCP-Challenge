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
import { buildMissionStatusCards } from "./mission-presentation";
import {
  resolveActorVisual,
  resolveResourceVisual,
  resolveSelectionVisual,
  resolveTileVisual,
  type CanvasSelectionVisual,
} from "./canvas-visuals";
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
  selection: CanvasSelectionVisual;
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

  const drawTile = (point: { x: number; y: number }, visual: ReturnType<typeof resolveTileVisual>) => {
    const fill = visual === "fog"
      ? "#10262c"
      : visual === "blocked" ? "#273b48" : "#29483d";
    context.fillStyle = fill;
    context.fillRect(point.x, point.y, TILE_SIZE, TILE_SIZE);
    if (visual === "grass") {
      context.fillStyle = "#34584a";
      context.fillRect(point.x + 4, point.y + 7, 2, 2);
      context.fillRect(point.x + 17, point.y + 15, 2, 2);
      context.fillRect(point.x + 11, point.y + 20, 2, 2);
    } else if (visual === "blocked") {
      context.strokeStyle = "#3f6e88";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(point.x + 2, point.y + TILE_SIZE - 3);
      context.lineTo(point.x + TILE_SIZE - 2, point.y + 3);
      context.stroke();
    } else {
      context.fillStyle = "#1e3a42";
      context.fillRect(point.x + 5, point.y + 7, 8, 2);
      context.fillRect(point.x + 14, point.y + 18, 6, 2);
    }
    context.strokeStyle = visual === "fog" ? "#162f36" : "#34584a";
    context.lineWidth = 1;
    context.strokeRect(point.x + 0.5, point.y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  };

  const drawResource = (
    point: { x: number; y: number },
    resourceType: "wood" | "rock",
    availability: "AVAILABLE" | "DEPLETED",
  ) => {
    const visual = resolveResourceVisual({ resourceType, availability });
    const centerX = point.x + TILE_SIZE / 2;
    context.save();
    context.globalAlpha = visual.depleted ? 0.48 : 1;
    context.strokeStyle = "#1a2c31";
    context.lineWidth = 1.25;
    if (visual.resourceType === "wood") {
      context.fillStyle = visual.depleted ? "#6e4739" : "#8a5a44";
      context.fillRect(point.x + 5, point.y + 15, 14, 5);
      context.fillStyle = visual.depleted ? "#8a5a44" : "#a56e33";
      context.beginPath();
      context.moveTo(point.x + 7, point.y + 15);
      context.lineTo(point.x + 9, point.y + 7);
      context.lineTo(centerX, point.y + 11);
      context.lineTo(point.x + 17, point.y + 7);
      context.lineTo(point.x + 19, point.y + 15);
      context.closePath();
      context.fill();
      context.stroke();
      context.strokeStyle = "#6e4739";
      context.beginPath();
      context.moveTo(point.x + 11, point.y + 9);
      context.lineTo(point.x + 11, point.y + 15);
      context.moveTo(point.x + 17, point.y + 9);
      context.lineTo(point.x + 17, point.y + 15);
      context.stroke();
    } else {
      context.fillStyle = visual.depleted ? "#8f9c9a" : "#b8c4c2";
      context.beginPath();
      context.moveTo(point.x + 5, point.y + 18);
      context.lineTo(point.x + 9, point.y + 9);
      context.lineTo(point.x + 15, point.y + 6);
      context.lineTo(point.x + 21, point.y + 10);
      context.lineTo(point.x + 22, point.y + 18);
      context.lineTo(point.x + 17, point.y + 21);
      context.lineTo(point.x + 9, point.y + 21);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "#d8dfd8";
      context.beginPath();
      context.moveTo(point.x + 10, point.y + 10);
      context.lineTo(point.x + 15, point.y + 8);
      context.lineTo(point.x + 19, point.y + 11);
      context.lineTo(point.x + 15, point.y + 13);
      context.closePath();
      context.fill();
    }
    context.restore();
  };

  const drawShelter = (point: { x: number; y: number }, state: string) => {
    const damaged = state.toUpperCase().includes("DAMAGED");
    const left = point.x + 4;
    const top = point.y + 4;
    context.save();
    context.strokeStyle = "#1a2c31";
    context.lineWidth = 1.25;
    context.fillStyle = damaged ? "#645e50" : "#7b7761";
    context.beginPath();
    context.moveTo(left + 1, top + 10);
    context.lineTo(left + 12, top + 2);
    context.lineTo(left + 23, top + 10);
    context.lineTo(left + 23, top + 21);
    context.lineTo(left + 1, top + 21);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = damaged ? "#d89232" : "#f4b942";
    context.fillRect(left + 9, top + 12, 6, 9);
    context.fillStyle = damaged ? "#a9a39a" : "#f8e48b";
    context.fillRect(left + 11, top + 4, 2, 7);
    context.fillRect(left + 9, top + 6, 6, 2);
    context.fillStyle = damaged ? "#1a2c31" : "#b8c4c2";
    context.fillRect(left + 22, top + 8, 5, 2);
    context.fillRect(left + 25, top + 6, 2, 6);
    if (damaged) {
      context.strokeStyle = "#1a2c31";
      context.beginPath();
      context.moveTo(left + 4, top + 12);
      context.lineTo(left + 8, top + 16);
      context.moveTo(left + 19, top + 5);
      context.lineTo(left + 16, top + 10);
      context.stroke();
    }
    context.restore();
  };

  const drawActor = (command: Extract<ReturnType<typeof buildCanvasDrawCommands>[number], { kind: "actor" }>, point: { x: number; y: number }) => {
    const visual = resolveActorVisual(command);
    const centerX = point.x + TILE_SIZE / 2;
    const centerY = point.y + TILE_SIZE / 2;
    if (command.actorKind === "shelter") {
      drawShelter(point, command.state);
      return;
    }
    const bodyColor = visual.palette === "hostile"
      ? "#b978c6"
      : visual.palette === "neutral" ? "#85a7a1" : command.actorKind === "player" ? "#f4b942" : "#d89232";
    context.save();
    context.strokeStyle = visual.cargo ? "#f2d27d" : "#1a2c31";
    context.lineWidth = visual.cargo ? 2.5 : 1.25;
    context.fillStyle = bodyColor;
    if (command.actorKind === "monster") {
      context.beginPath();
      context.moveTo(centerX, centerY - 9);
      context.lineTo(centerX + 8, centerY - 4);
      context.lineTo(centerX + 7, centerY + 6);
      context.lineTo(centerX, centerY + 10);
      context.lineTo(centerX - 7, centerY + 6);
      context.lineTo(centerX - 8, centerY - 4);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "#f8f0d5";
      context.fillRect(centerX - 3, centerY - 2, 6, 4);
      context.fillStyle = "#1a2c31";
      context.fillRect(centerX - 1, centerY - 1, 2, 2);
    } else {
      context.beginPath();
      context.moveTo(centerX, centerY - 9);
      context.lineTo(centerX + 7, centerY - 4);
      context.lineTo(centerX + 6, centerY + 7);
      context.lineTo(centerX - 6, centerY + 7);
      context.lineTo(centerX - 7, centerY - 4);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "#f8f0d5";
      context.fillRect(centerX - 3, centerY - 5, 6, 4);
      context.fillStyle = "#1a2c31";
      context.fillRect(centerX - 6, centerY + 6, 4, 4);
      context.fillRect(centerX + 2, centerY + 6, 4, 4);
      if (visual.marker === "rune") {
        context.fillStyle = "#f8e48b";
        context.beginPath();
        context.moveTo(centerX, centerY - 11);
        context.lineTo(centerX + 3, centerY - 7);
        context.lineTo(centerX, centerY - 4);
        context.lineTo(centerX - 3, centerY - 7);
        context.closePath();
        context.fill();
      } else if (visual.marker === "pickaxe") {
        context.strokeStyle = "#8a5a44";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(centerX + 5, centerY + 5);
        context.lineTo(centerX + 10, centerY - 4);
        context.stroke();
        context.strokeStyle = "#b8c4c2";
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(centerX + 7, centerY - 5);
        context.quadraticCurveTo(centerX + 11, centerY - 8, centerX + 13, centerY - 5);
        context.stroke();
      } else if (visual.marker === "sword") {
        context.strokeStyle = "#b8c4c2";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(centerX + 4, centerY + 4);
        context.lineTo(centerX + 11, centerY - 6);
        context.stroke();
        context.strokeStyle = "#8a5a44";
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(centerX + 2, centerY + 4);
        context.lineTo(centerX + 7, centerY + 8);
        context.stroke();
      } else if (visual.marker === "body") {
        context.fillStyle = "#b8c4c2";
        context.fillRect(centerX - 2, centerY - 11, 4, 3);
      }
      if (visual.cargo) {
        context.fillStyle = "#8a5a44";
        context.fillRect(centerX - 9, centerY - 1, 4, 8);
      }
    }
    if (visual.defeated) {
      context.strokeStyle = "#f8e48b";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(centerX - 6, centerY - 6);
      context.lineTo(centerX + 6, centerY + 6);
      context.moveTo(centerX + 6, centerY - 6);
      context.lineTo(centerX - 6, centerY + 6);
      context.stroke();
    }
    context.restore();
  };

  const drawSelectionRing = (position: { x: number; y: number }, color: string, dashed: boolean) => {
    const point = toCanvas(position.x, position.y);
    if (point.x < 0 || point.y < 0 || point.x >= width || point.y >= height) {
      return;
    }
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.setLineDash(dashed ? [4, 3] : []);
    context.beginPath();
    context.arc(
      point.x + TILE_SIZE / 2,
      point.y + TILE_SIZE / 2,
      TILE_SIZE * 0.45,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.restore();
  };

  for (const command of props.commands) {
    if (command.kind === "clear") {
      context.fillStyle = command.color;
      context.fillRect(0, 0, width, height);
      continue;
    }
    if (command.kind === "tile") {
      const point = toCanvas(command.x, command.y);
      drawTile(point, resolveTileVisual(command));
      continue;
    }
    if (command.kind === "resource") {
      const point = toCanvas(command.x, command.y);
      drawResource(point, command.resourceType, command.availability);
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
    drawActor(command, toCanvas(command.x, command.y));
  }
  if (props.selection.soldierPosition) {
    drawSelectionRing(props.selection.soldierPosition, "#f8e48b", false);
  }
  if (props.selection.targetPosition) {
    drawSelectionRing(props.selection.targetPosition, "#f4b942", true);
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
  const missionCards = useMemo(() => buildMissionStatusCards(view.missions), [view.missions]);
  const rowBySoldier = useMemo(() => new Map(rows.map((row) => [row.soldierId, row.text])), [rows]);
  const selection = useMemo(() => resolveSelectionVisual({
    selectedSoldierId,
    selectedTargetId,
    actors: view.actors,
    resourceNodes: view.resourceNodes,
  }), [selectedSoldierId, selectedTargetId, view.actors, view.resourceNodes]);
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
      drawFrame(canvasRef.current, { view, commands, selection });
    }
  }, [view, commands, selection]);

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
                {missionCards.map((card, index) => {
                  const canonicalRow = rowBySoldier.get(card.soldierId);
                  const canonicalRowId = `mission-row-${index}`;
                  return (
                    <li
                      key={card.soldierId}
                      className={styles.missionCard}
                      data-phase={card.phase}
                      data-cargo-risk={card.cargoRisk}
                      aria-describedby={canonicalRow ? canonicalRowId : undefined}
                    >
                      <div className={styles.missionCardHeader}>
                        <strong className={styles.missionSoldier}>{card.soldierId}</strong>
                        <span className={styles.missionPhase}>{card.phaseLabel}</span>
                      </div>
                      <div className={styles.missionMeta}>
                        <span className={styles.missionDatum}>
                          <span className={styles.missionLabel}>Role</span>
                          <span className={styles.missionValue}>{card.roleLabel}</span>
                        </span>
                        <span className={styles.missionDatum}>
                          <span className={styles.missionLabel}>Tool</span>
                          {card.toolIcon ? <VisualIcon name={card.toolIcon} className={styles.missionIcon} /> : null}
                          <span className={styles.missionValue}>{card.toolLabel}</span>
                        </span>
                        <span className={styles.missionDatum}>
                          <span className={styles.missionLabel}>Target</span>
                          <span className={styles.missionValue}>{card.targetLabel}</span>
                        </span>
                        <span className={styles.missionDatum}>
                          <VisualIcon name="icon_cargo" className={styles.missionIcon} />
                          <span className={styles.missionLabel}>Cargo</span>
                          <span className={styles.missionValue}>{card.cargoLabel}</span>
                        </span>
                      </div>
                      <div className={styles.missionFooter}>
                        <span className={styles.missionNext}>
                          <span className={styles.missionLabel}>Next</span>
                          <span className={styles.missionValue}>{card.nextActionLabel}</span>
                        </span>
                        <span className={styles.missionRisk}>
                          <span className={styles.missionLabel}>Risk</span>
                          <span className={styles.missionValue}>{card.cargoRiskLabel}</span>
                        </span>
                      </div>
                      {card.context ? <p className={styles.missionContext}>{card.context}</p> : null}
                      {canonicalRow ? (
                        <span id={canonicalRowId} className={styles.visuallyHidden}>{canonicalRow}</span>
                      ) : null}
                    </li>
                  );
                })}
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
