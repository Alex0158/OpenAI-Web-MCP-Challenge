export class StageToolRegistry {
  constructor(modelContext) {
    this.modelContext = modelContext;
    this.stage = null;
    this.controller = null;
  }

  get available() {
    return Boolean(this.modelContext?.registerTool);
  }

  async replace(stage, tools) {
    if (!this.available) return false;
    this.controller?.abort();
    this.controller = new AbortController();
    for (const specification of tools) {
      await this.modelContext.registerTool(specification, {
        signal: this.controller.signal,
      });
    }
    this.stage = stage;
    return true;
  }

  clear() {
    this.controller?.abort();
    this.controller = null;
    this.stage = null;
  }
}
