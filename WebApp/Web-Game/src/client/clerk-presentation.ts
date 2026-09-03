export type ClerkPresentationMode = "clerk" | "local" | "missing-production-config";

export function resolveClerkPresentationMode(input: {
  readonly nodeEnv: string | undefined;
  readonly publishableKey: string | undefined;
}): ClerkPresentationMode {
  if (typeof input.publishableKey === "string" && input.publishableKey.trim() !== "") {
    return "clerk";
  }
  return input.nodeEnv === "production" ? "missing-production-config" : "local";
}
