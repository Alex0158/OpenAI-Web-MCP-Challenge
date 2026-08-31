import { LocalConnectorClient } from "../../src/local-connector-client.mjs";
import { serveChildRpc } from "./child-rpc.mjs";

let connector;

serveChildRpc({
  start({ baseUrl, connectorToken }) {
    if (connector) throw fixtureError("fixture_connector_already_started");
    connector = new LocalConnectorClient({
      baseUrl,
      connectorToken,
      requestTimeoutMs: 1_000,
    });
    return {
      pid: process.pid,
      sqliteLoaded: process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite")),
    };
  },

  claim({ claimToken }) {
    return connector.claimDelivery({ claimToken });
  },

  acknowledge({ deliveryId, leaseToken, effectToken }) {
    return connector.acknowledgeDelivery({ deliveryId, leaseToken, effectToken });
  },

  stop() {
    connector = undefined;
    return { stopped: true };
  },
});

function fixtureError(code) {
  return Object.assign(new Error(code), { code });
}
