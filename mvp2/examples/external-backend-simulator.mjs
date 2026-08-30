// Run after a human has attached a Grant and submitted the synthetic bid.
// This separate process imports no Receiver code: it obtains the Host-issued event
// and sends that signed event through the public Receiver protocol endpoint.

const baseUrl =
  process.env.CONTINUATION_BASE_URL ??
  process.argv[2] ??
  "http://127.0.0.1:43118";

const state = await request("/api/state");
if (state.status !== "UNDER_REVIEW") {
  throw new Error(
    `Expected UNDER_REVIEW, received ${state.status}. Attach the Grant and submit the bid in the applicant UI first.`,
  );
}

const prepared = await request(
  "/api/reviewer/request-clarification?dispatch=external",
  {
    method: "POST",
    body: JSON.stringify({
      feedback:
        "Please confirm the proposed payment terms and identify the supporting incident-response evidence.",
      expectedStateVersion: state.stateVersion,
    }),
  },
);

const received = await request("/api/continuations/events", {
  method: "POST",
  body: JSON.stringify(prepared.event),
});

console.log(
  JSON.stringify(
    {
      externalProcess: true,
      eventId: prepared.event.eventId,
      eventType: prepared.event.eventType,
      gateway: received.gateway,
      delivery: received.delivery,
    },
    null,
    2,
  ),
);

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? `Request failed with ${response.status}`);
  }
  return result;
}
