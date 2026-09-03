import type { SessionActor } from "./session-api";

type LifecycleEventTarget = {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

type LifecycleDocumentTarget = LifecycleEventTarget & {
  readonly visibilityState: string;
};

export function sameSessionActor(
  left: SessionActor | null,
  right: SessionActor | null,
): boolean {
  if (left === null || right === null) return left === right;
  return left.id === right.id && left.role === right.role;
}

export function sessionActorKey(actor: SessionActor): string {
  return `${actor.role}:${actor.id}`;
}

export function createRoleSessionLifecycleMonitor({
  windowTarget,
  documentTarget,
  initialActor,
  readSession,
  onActorChange,
  onError,
  onSuccess,
}: {
  windowTarget: LifecycleEventTarget;
  documentTarget: LifecycleDocumentTarget;
  initialActor: SessionActor | null;
  readSession: () => Promise<SessionActor | null>;
  onActorChange: (actor: SessionActor | null) => void;
  onError: (error: unknown) => void;
  onSuccess?: () => void;
}): () => void {
  let active = true;
  let inFlight = false;
  let acceptedActor = initialActor;

  const revalidate = () => {
    if (!active || inFlight) return;
    inFlight = true;

    void readSession()
      .then((resolvedActor) => {
        if (!active) return;
        onSuccess?.();
        if (sameSessionActor(acceptedActor, resolvedActor)) return;
        acceptedActor = resolvedActor;
        onActorChange(resolvedActor);
      })
      .catch((error: unknown) => {
        if (active) onError(error);
      })
      .finally(() => {
        inFlight = false;
      });
  };

  const onFocus = () => revalidate();
  const onVisibilityChange = () => {
    if (documentTarget.visibilityState === "visible") revalidate();
  };

  windowTarget.addEventListener("focus", onFocus);
  documentTarget.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    active = false;
    windowTarget.removeEventListener("focus", onFocus);
    documentTarget.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
