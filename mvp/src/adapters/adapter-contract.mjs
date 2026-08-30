export class AgentContinuationAdapter {
  constructor() {
    if (new.target === AgentContinuationAdapter) {
      throw new TypeError("AgentContinuationAdapter is an interface");
    }
  }

  ensureTestContext() {
    throw new Error("ensureTestContext is not implemented");
  }

  captureCurrentContext() {
    throw new Error("captureCurrentContext is not implemented");
  }

  persistContinuationReceipt() {
    throw new Error("persistContinuationReceipt is not implemented");
  }

  resumeContext() {
    throw new Error("resumeContext is not implemented");
  }
}

export function assertAdapterResult(result) {
  if (!result || typeof result !== "object") throw new Error("Adapter returned no result");
  if (typeof result.adapter !== "string") throw new Error("Adapter result has no adapter identity");
  if (typeof result.managed_context_id !== "string") throw new Error("Adapter result has no context identity");
  return result;
}
