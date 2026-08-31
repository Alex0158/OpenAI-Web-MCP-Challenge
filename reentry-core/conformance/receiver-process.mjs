import { serveProfileProcess } from "./process-rpc.mjs";
import { createReceiverRole } from "./receiver-role.mjs";

serveProfileProcess(createReceiverRole());
