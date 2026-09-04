/**
 * Small, client-safe descriptions for the playground's simulated mini-apps.
 * No credential, binding, or private workflow data belongs in this module.
 */
export const DEFAULT_SCENARIO_ID = "invoice";

export const PLAYGROUND_SCENARIOS = Object.freeze([
  Object.freeze({
    id: "invoice",
    brand: "Ledgerly",
    category: "Finance demo",
    mark: "$",
    title: "Approve a supplier invoice",
    description: "A finance team reviews an invoice before payment is prepared.",
    recordLabel: "Invoice #1042",
    recordValue: "$2,480.00",
    recordMeta: "Northstar Studio · Due in 14 days",
    userAction: "Review invoice",
    developerAction: "Mark invoice approved",
    developerResult: "Invoice approved",
    consentTitle: "Approve this invoice demo?",
    consentReason: "Allow Ledgerly to return when this invoice is ready for the next review.",
  }),
  Object.freeze({
    id: "pickup",
    brand: "Parcelly",
    category: "Commerce demo",
    mark: "P",
    title: "Prepare an order for pickup",
    description: "A store updates an order when it is ready for the customer.",
    recordLabel: "Order #7819",
    recordValue: "Ready soon",
    recordMeta: "Wireless keyboard · Store 04",
    userAction: "View order",
    developerAction: "Mark order ready",
    developerResult: "Order ready for pickup",
    consentTitle: "Approve this order demo?",
    consentReason: "Allow Parcelly to return when this order is ready for pickup.",
  }),
  Object.freeze({
    id: "support",
    brand: "Kindline",
    category: "Support demo",
    mark: "K",
    title: "Resolve a support ticket",
    description: "A support team closes a ticket after the requested fix is ready.",
    recordLabel: "Ticket #3308",
    recordValue: "In progress",
    recordMeta: "Login issue · Priority normal",
    userAction: "Open ticket",
    developerAction: "Mark ticket resolved",
    developerResult: "Ticket resolved",
    consentTitle: "Approve this support demo?",
    consentReason: "Allow Kindline to return when this support ticket is resolved.",
  }),
  Object.freeze({
    id: "proposal",
    brand: "Morrow",
    category: "Freelance demo",
    mark: "M",
    title: "Review a client proposal",
    description: "A creative studio moves a proposal forward after client approval.",
    recordLabel: "Proposal #208",
    recordValue: "Awaiting reply",
    recordMeta: "Brand refresh · Morrow Studio",
    userAction: "Review proposal",
    developerAction: "Mark proposal accepted",
    developerResult: "Proposal accepted",
    consentTitle: "Approve this proposal demo?",
    consentReason: "Allow Morrow to return when this proposal is accepted.",
  }),
]);

export function getPlaygroundScenario(id) {
  return PLAYGROUND_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}

export function scenarioCanonicalPath(id) {
  return `/?scenario=${encodeURIComponent(id)}`;
}
