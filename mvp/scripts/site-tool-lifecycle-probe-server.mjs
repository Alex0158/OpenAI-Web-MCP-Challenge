import http from "node:http";

const host = "127.0.0.1";
const port = Number.parseInt(process.env.WEBMCP_LIFECYCLE_PROBE_PORT ?? "4319", 10);

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>WebMCP Site Tool Lifecycle Probe</title>
  </head>
  <body>
    <h1>WebMCP Site Tool Lifecycle Probe</h1>
    <p id="status">Registering probe tools.</p>
    <button id="abort" type="button">Abort scoped registration</button>
    <script type="module">
      const status = document.querySelector("#status");
      const controller = new AbortController();

      if (typeof document.modelContext?.registerTool !== "function") {
        status.textContent = "WebMCP is unavailable.";
      } else {
        try {
          await document.modelContext.registerTool({
            name: "lifecycle_persistent_probe",
            description: "Return the persistent control result for the Site Tool lifecycle probe.",
            inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
            annotations: { readOnlyHint: true },
            execute: async () => ({ registration: "persistent" }),
          });
          await document.modelContext.registerTool({
            name: "lifecycle_scoped_probe",
            description: "Return the scoped result until its registration AbortSignal is aborted.",
            inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
            annotations: { readOnlyHint: true },
            execute: async () => ({ registration: "scoped" }),
          }, { signal: controller.signal });
          status.textContent = "Both probe tools are registered.";
        } catch (error) {
          status.textContent = \`Registration failed: \${error.name}: \${error.message}\`;
        }
      }

      document.querySelector("#abort").addEventListener("click", () => {
        controller.abort();
        status.textContent = "The scoped registration AbortSignal was aborted.";
      });
    </script>
  </body>
</html>`;

const server = http.createServer((request, response) => {
  if (request.method !== "GET" || request.url !== "/") {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(page);
});

server.listen(port, host, () => {
  process.stdout.write(`Site Tool lifecycle probe listening at http://${host}:${port}/\n`);
});
