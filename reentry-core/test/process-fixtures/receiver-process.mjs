import { createReceiverRole } from "../../conformance/receiver-role.mjs";
import { serveChildRpc } from "./child-rpc.mjs";

let dropNextAcknowledgementResponse = false;
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
});

serveChildRpc({
  ...handlers,
  dropNextAcknowledgementResponse() {
    dropNextAcknowledgementResponse = true;
    return { armed: true };
  },
});
