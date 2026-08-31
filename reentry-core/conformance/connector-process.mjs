import {
  AGENT_ACTIVATION_RESULT_TYPE,
  dispatchAgentActivation,
} from "../src/agent-adapter.mjs";
import { LocalConnectorClient } from "../src/local-connector-client.mjs";
import { serveProfileProcess } from "./process-rpc.mjs";

let connector;
let activationCalls = 0;

serveProfileProcess({
  start({ baseUrl, connectorToken }) {
    if (connector) throw profileError("profile_connector_already_started");
    connector = new LocalConnectorClient({
      baseUrl,
      connectorToken,
      requestTimeoutMs: 1_000,
    });
    return {
      pid: process.pid,
      sqliteLoaded: sqliteLoaded(),
    };
  },

  claim({ claimToken }) {
    requireConnector();
    return connector.claimDelivery({ claimToken });
  },

  async activate({ lease }) {
    requireConnector();
    const result = await dispatchAgentActivation({
      adapter: {
        activate(activation) {
          activationCalls += 1;
          return {
            type: AGENT_ACTIVATION_RESULT_TYPE,
            protocol_version: "0.1",
            delivery_id: activation.delivery_id,
            event_id: activation.event_id,
            attempt: activation.attempt,
            outcome: "accepted",
            code: "activation_dispatch_accepted",
            unavailable_capability: null,
          };
        },
      },
      lease,
      now: new Date(),
      timeoutMs: 1_000,
    });
    return { result, calls: activationCalls };
  },

  acknowledge({ deliveryId, leaseToken, effectToken }) {
    requireConnector();
    return connector.acknowledgeDelivery({ deliveryId, leaseToken, effectToken });
  },

  stop() {
    connector = undefined;
    return { stopped: true };
  },
});

function requireConnector() {
  if (!connector) throw profileError("profile_connector_not_started");
}

function sqliteLoaded() {
  return process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite"));
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}
