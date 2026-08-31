import { createReceiverRole } from "../../conformance/receiver-role.mjs";
import { GRANT_CONTROL_AUTHORIZATION_TYPE } from "../../src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../src/protocol.mjs";
import { SqliteReceiverStore } from "../../src/sqlite-receiver-store.mjs";
import { serveChildRpc } from "./child-rpc.mjs";

const GRANT_CONTROL_TOKEN = "grant_control_process_fixture_token";
const SUBJECT_ID = "subject_conformance_001";

let dropNextAcknowledgementResponse = false;
let exitAfterDeliveryWrite = false;
const handlers = createReceiverRole({
  beforeHandleRequest(request, response) {
    if (
      dropNextAcknowledgementResponse &&
      request.method === "POST" &&
      request.url === "/v0.1/delivery-acknowledgements"
    ) {
      dropNextAcknowledgementResponse = false;
      response.end = function dropResponse() {
        this.destroy();
        return this;
      };
    }
  },
  createStore: createFaultInjectableStore,
  grantControlAuthority: {
    verifyControl({ bindingId, action, controlToken }) {
      if (controlToken !== GRANT_CONTROL_TOKEN) {
        throw new Error("Unknown Grant control token");
      }
      const now = Date.now();
      return {
        type: GRANT_CONTROL_AUTHORIZATION_TYPE,
        protocol_version: PROTOCOL_VERSION,
        binding_id: bindingId,
        action,
        subject_id: SUBJECT_ID,
        authenticated_at: new Date(now - 1_000).toISOString(),
        expires_at: new Date(now + 60_000).toISOString(),
      };
    },
  },
});

serveChildRpc({
  ...handlers,
  dropNextAcknowledgementResponse() {
    dropNextAcknowledgementResponse = true;
    return { armed: true };
  },
  armExitAfterDeliveryWrite() {
    exitAfterDeliveryWrite = true;
    return { armed: true };
  },
});

function createFaultInjectableStore(options) {
  const store = new SqliteReceiverStore(options);
  let wrapper;
  wrapper = new Proxy(store, {
    get(target, property) {
      if (property === "transaction") {
        return (callback) => target.transaction(() => callback(wrapper));
      }
      if (property === "insertDelivery") {
        return (...args) => {
          const result = target.insertDelivery(...args);
          if (exitAfterDeliveryWrite) {
            exitAfterDeliveryWrite = false;
            process.kill(process.pid, "SIGKILL");
            throw new Error("SIGKILL did not terminate the Receiver process");
          }
          return result;
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return wrapper;
}
