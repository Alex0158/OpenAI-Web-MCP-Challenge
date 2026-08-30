// Public entrypoint for the modular continuation infrastructure.
export * from "./infrastructure/agent-adapter.mjs";
export * from "./infrastructure/continuation-application.mjs";
export * from "./infrastructure/host-sdk.mjs";
export * from "./infrastructure/protocol.mjs";
export * from "./infrastructure/receiver-core.mjs";
export * from "./infrastructure/state-store.mjs";

// TenderRelay is one replaceable Host Adapter, not part of Receiver Core.
export * from "./apps/tenderrelay/domain.mjs";
export * from "./apps/tenderrelay/host-adapter.mjs";

// The local Codex queue path is one replaceable Agent Adapter.
export * from "./adapters/codex-desktop-demo.mjs";
