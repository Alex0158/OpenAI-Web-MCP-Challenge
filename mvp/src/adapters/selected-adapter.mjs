import { FixtureAdapter } from "./fixture-adapter.mjs";
import { AppServerAdapter } from "./app-server-adapter.mjs";
import { DesktopTaskAdapter } from "./desktop-task-adapter.mjs";

export function createSelectedAdapter(dependencies) {
  const mode = dependencies.adapterMode ?? process.env.WEBMCP_P0_ADAPTER ?? "fixture";
  if (mode === "app-server") return new AppServerAdapter(dependencies);
  if (mode === "desktop-task") return new DesktopTaskAdapter(dependencies);
  if (mode !== "fixture") throw new Error(`Unknown P0 adapter mode: ${mode}`);
  return new FixtureAdapter(dependencies);
}
