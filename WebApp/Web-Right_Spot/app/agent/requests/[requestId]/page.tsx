import AgentRequestPage from "../../../../src/ui/agent/agent-request-page";

type AgentRequestRouteProps = {
  params: Promise<{ requestId: string }>;
};

export default async function AgentRequestRoute({ params }: AgentRequestRouteProps) {
  const { requestId } = await params;
  return <AgentRequestPage requestId={requestId} />;
}
