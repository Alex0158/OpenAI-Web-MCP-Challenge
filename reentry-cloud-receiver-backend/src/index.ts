import { createApp } from "./app";
import { appConfig } from "./config/config";
import { prisma } from "./db";

const SHUTDOWN_TIMEOUT_MS = 10 * 1000;

const app = createApp();

const server = app.listen(appConfig.port, () => {
  console.log(`Backend listening on http://localhost:${appConfig.port}`);
});

/**
 * Graceful shutdown.
 *
 * Docker sends SIGTERM and waits about ten seconds before SIGKILL. Without a
 * handler the default is to die instantly, cutting off in-flight requests and
 * leaving the database to clean up abandoned connections.
 *
 * server.close() stops accepting new connections but lets running requests
 * finish, then Prisma disconnects its adapter pool. The timer is the backstop
 * for a request that never completes, so shutdown cannot hang forever.
 */
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`${signal} received, shutting down...`);

  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out, forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Shutdown complete.");
    } catch (error) {
      console.error("Error closing the database connection:", error);
    }
    clearTimeout(forceExit);
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
