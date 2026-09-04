"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiBookOpen,
  FiCheck,
  FiClipboard,
  FiCode,
  FiExternalLink,
  FiGrid,
  FiKey,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTerminal,
  FiTrash2,
  FiZap,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SdkDocumentation from "./SdkDocumentation";
import {
  createApiKey,
  createOrganization,
  listApiKeys,
  listEventHistory,
  listOrganizations,
  revokeApiKey,
  type DeveloperApiKey,
  type DeveloperApiKeyReveal,
  type DeveloperEvent,
  type DeveloperOrganization,
} from "@/lib/api/developer-portal";
import { formatDateTime } from "@/lib/utils/format";
import type { Developer } from "@/lib/api/developer-auth";

type TabId = "overview" | "api-keys" | "sdk-guide" | "events";

type DeveloperPortalProps = {
  developer: Developer;
  onLogout: () => void;
};

const TABS: Array<{ id: TabId; label: string; icon: typeof FiGrid }> = [
  { id: "overview", label: "Overview", icon: FiGrid },
  { id: "api-keys", label: "API Keys", icon: FiKey },
  { id: "sdk-guide", label: "SDK Guide", icon: FiBookOpen },
  { id: "events", label: "Events", icon: FiActivity },
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The developer portal request failed.";
}

function statusLabel(key: DeveloperApiKey): string {
  return key.revoked_at ? "Revoked" : "Active";
}

function statusClass(key: DeveloperApiKey): string {
  return key.revoked_at
    ? "border-[#e2b7b7] bg-[#fff0f0] text-[#a52c32]"
    : "border-[#9acb8f] bg-[#e2f6d5] text-[#286323]";
}

function deliveryStateLabel(state: string | null): string {
  if (state === "pending") return "Queued";
  if (!state) return "Not created";
  return state.replaceAll("_", " ");
}

export default function DeveloperPortal({ developer, onLogout }: DeveloperPortalProps) {
  const [organizations, setOrganizations] = useState<DeveloperOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>([]);
  const [events, setEvents] = useState<DeveloperEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [organizationName, setOrganizationName] = useState("");
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [revealedKey, setRevealedKey] = useState<DeveloperApiKeyReveal | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingOrganizationData, setLoadingOrganizationData] = useState(false);
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.organization_id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId]
  );

  useEffect(() => {
    let current = true;
    void listOrganizations()
      .then((response) => {
        if (!current) return;
        setOrganizations(response.data.organizations);
        setLoadingOrganizationData(Boolean(response.data.organizations[0]?.organization_id));
        setSelectedOrganizationId(response.data.organizations[0]?.organization_id ?? "");
      })
      .catch((requestError: unknown) => {
        if (current) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (current) setLoadingOrganizations(false);
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedOrganizationId) {
      return;
    }

    let current = true;
    void Promise.all([listApiKeys(selectedOrganizationId), listEventHistory(selectedOrganizationId)])
      .then(([keyResponse, eventResponse]) => {
        if (!current) return;
        setApiKeys(keyResponse.data.api_keys);
        setEvents(eventResponse.data.events);
      })
      .catch((requestError: unknown) => {
        if (current) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (current) setLoadingOrganizationData(false);
      });
    return () => {
      current = false;
    };
  }, [selectedOrganizationId]);

  async function handleCreateOrganization() {
    const name = organizationName.trim();
    if (!name) {
      setError("Organization name is required.");
      return;
    }

    setCreatingOrganization(true);
    setError(null);
    setLoadingOrganizationData(true);
    try {
      const response = await createOrganization(name);
      setOrganizations((current) => [...current, response.data.organization]);
      setSelectedOrganizationId(response.data.organization.organization_id);
      setRevealedKey(response.data.api_key);
      setOrganizationName("");
      setShowOrganizationForm(false);
      setActiveTab("api-keys");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setCreatingOrganization(false);
    }
  }

  async function handleCreateKey() {
    if (!selectedOrganizationId) return;
    setCreatingKey(true);
    setError(null);
    try {
      const response = await createApiKey(selectedOrganizationId);
      setApiKeys((current) => [response.data.api_key, ...current]);
      setRevealedKey(response.data.api_key);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeKey(apiKeyId: string) {
    if (!selectedOrganizationId) return;
    setError(null);
    try {
      const response = await revokeApiKey(selectedOrganizationId, apiKeyId);
      setApiKeys((current) =>
        current.map((key) => (key.api_key_id === apiKeyId ? response.data.api_key : key))
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  async function copyRevealedKey() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.api_key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      setCopied(false);
      setError("Clipboard access is unavailable. Copy the key manually before leaving this page.");
    }
  }

  const tabButtonClass = (tab: TabId) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
      activeTab === tab
        ? "bg-[#b9f57b] text-[#163300] shadow-[0_0_22px_rgba(185,245,123,0.16)]"
        : "text-white/58 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef7e8] text-[#0e0f0c]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08110b]/95 text-[#efffe7] shadow-[0_16px_45px_rgba(7,16,11,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center gap-4 px-5 sm:px-8">
          <a href="/developer-dashboard" className="flex shrink-0 items-center gap-3 whitespace-nowrap" aria-label="re-entry cloud developer dashboard">
            <Logo className="h-9 w-9" />
            <span className="text-[17px] font-bold tracking-[-0.04em] text-white">re-entry</span>
            <span className="-ml-2 mt-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#9fe870]">cloud</span>
            <span className="hidden border-l border-white/15 pl-4 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/42 sm:inline">Developer space</span>
          </a>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1" aria-label="Developer portal sections" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`developer-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`developer-panel-${id}`}
                className={tabButtonClass(id)}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b9f57b] shadow-[0_0_10px_#b9f57b]" aria-hidden="true" />
              <span className="max-w-[170px] truncate text-xs font-semibold text-white/65">{developer.email}</span>
            </div>
            <ThemeToggle className="text-white/65 hover:bg-white/10" iconClassName="text-[#b9f57b]" />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-semibold text-white/60 transition hover:bg-[#3a1515] hover:text-[#ffb4ad] sm:px-3"
              aria-label="Log out"
            >
              <FiLogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#9fe870]/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8fbd83] bg-[#dff3d7] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#286323]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4b9b42] shadow-[0_0_10px_rgba(75,155,66,0.45)]" />
              Developer space / active
            </div>
            <h1 className="mt-6 max-w-2xl text-[clamp(48px,7vw,86px)] font-semibold leading-[0.9] tracking-[-0.075em] text-[#163300]">Build the loop.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#587052]">Manage the server boundary that gives agents a clear, human-approved way back.</p>
          </div>

          <div className="flex min-w-[min(100%,340px)] flex-col gap-2 rounded-[24px] border border-[#cddfc8] bg-white/70 p-4 shadow-[0_12px_32px_rgba(22,51,0,0.06)]">
            <label htmlFor="organization-switcher" className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">Active organization</label>
            <div className="flex gap-2">
              <select
                id="organization-switcher"
                value={selectedOrganizationId}
                onChange={(event) => {
                  setLoadingOrganizationData(true);
                  setError(null);
                  setSelectedOrganizationId(event.target.value);
                  setRevealedKey(null);
                }}
                className="min-w-0 flex-1 rounded-full border border-[#b7d0b0] bg-white px-4 py-2.5 text-sm font-semibold text-[#163300] outline-none focus:border-[#4b9b42]"
                disabled={loadingOrganizations || organizations.length === 0}
              >
                {organizations.length === 0 ? <option value="">Create your first organization</option> : null}
                {organizations.map((organization) => (
                  <option key={organization.organization_id} value={organization.organization_id}>{organization.name}</option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void listOrganizations().then((response) => setOrganizations(response.data.organizations)).catch((requestError) => setError(errorMessage(requestError)))}
                aria-label="Refresh organizations"
              >
                <FiRefreshCw aria-hidden="true" />
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant={showOrganizationForm ? "primary" : "secondary"}
              onClick={() => {
                setShowOrganizationForm((current) => !current);
                setError(null);
              }}
              aria-expanded={showOrganizationForm}
            >
              <FiPlus aria-hidden="true" />
              {showOrganizationForm ? "Close" : "New organization"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="relative mt-6 flex items-start gap-3 rounded-2xl border border-[#e2b7b7] bg-[#fff0f0] px-4 py-3 text-sm text-[#8f252c]" role="alert">
            <FiShield className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {organizations.length === 0 && !loadingOrganizations ? (
          <Card padding="large" className="relative mt-8 bg-white/75">
            <EmptyState
              icon={<FiGrid aria-hidden="true" />}
              title="Start with an organization"
              description="An organization keeps your Host keys, integration setup, and redacted Event history in one developer-owned boundary."
              action={
                <OrganizationForm
                  organizationName={organizationName}
                  onNameChange={setOrganizationName}
                  onSubmit={() => void handleCreateOrganization()}
                  creating={creatingOrganization}
                />
              }
            />
          </Card>
        ) : null}

        {organizations.length > 0 && showOrganizationForm ? (
          <Card padding="normal" className="relative mt-8 bg-white/75" hover={false}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a8e3d]">Organization setup</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#163300]">New organization</h2>
                <p className="mt-2 text-sm leading-6 text-[#587052]">A new organization starts with one API key, revealed once.</p>
              </div>
              <OrganizationForm
                organizationName={organizationName}
                onNameChange={setOrganizationName}
                onSubmit={() => void handleCreateOrganization()}
                creating={creatingOrganization}
              />
            </div>
          </Card>
        ) : null}

        {selectedOrganization ? (
          <div className="relative mt-8" id={`developer-panel-${activeTab}`} role="tabpanel" aria-labelledby={`developer-tab-${activeTab}`}>
            {activeTab === "overview" ? (
              <OverviewPanel organization={selectedOrganization} apiKeys={apiKeys} events={events} onTabChange={setActiveTab} />
            ) : null}
            {activeTab === "api-keys" ? (
              <ApiKeysPanel
                keys={apiKeys}
                revealedKey={revealedKey}
                copied={copied}
                loading={loadingOrganizationData}
                creating={creatingKey}
                onCreate={() => void handleCreateKey()}
                onCopy={() => void copyRevealedKey()}
                onRevoke={(apiKeyId) => void handleRevokeKey(apiKeyId)}
              />
            ) : null}
            {activeTab === "sdk-guide" ? <SdkDocumentation /> : null}
            {activeTab === "events" ? <EventsPanel events={events} loading={loadingOrganizationData} /> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function OrganizationForm({
  organizationName,
  onNameChange,
  onSubmit,
  creating,
}: {
  organizationName: string;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  creating: boolean;
}) {
  return (
    <div className="flex w-full max-w-md gap-2">
      <Input
        value={organizationName}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Acme integrations"
        aria-label="Organization name"
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit();
        }}
      />
      <Button type="button" onClick={onSubmit} isLoading={creating}>
        <FiPlus aria-hidden="true" />
        Create
      </Button>
    </div>
  );
}

function OverviewPanel({
  organization,
  apiKeys,
  events,
  onTabChange,
}: {
  organization: DeveloperOrganization;
  apiKeys: DeveloperApiKey[];
  events: DeveloperEvent[];
  onTabChange: (tab: TabId) => void;
}) {
  const activeKeys = apiKeys.filter((key) => !key.revoked_at).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8e3d]">Organization workspace</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#163300]">{organization.name}</h2>
          <p className="mt-2 text-sm text-[#587052]">Server-side integration controls for this organization.</p>
        </div>
        <Button type="button" size="sm" onClick={() => onTabChange("sdk-guide")}>
          Open SDK guide
          <FiExternalLink aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Active API keys" value={activeKeys} icon={<FiKey aria-hidden="true" />} />
        <Metric label="Recorded Events" value={events.length} icon={<FiActivity aria-hidden="true" />} />
        <Metric label="Boundary" value="Server" icon={<FiShield aria-hidden="true" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <Card padding="large" className="bg-[#163300] text-[#efffe7]" hover={false}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b9f57b] text-[#163300]"><FiCode aria-hidden="true" /></div>
            <span className="rounded-full border border-[#b9f57b]/25 bg-[#b9f57b]/10 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#b9f57b]">Ready for Host setup</span>
          </div>
          <h3 className="mt-8 max-w-xl text-3xl font-semibold leading-none tracking-[-0.055em]">Keep authority in the Host server.</h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">Use an organization key only from trusted server code. The browser can guide setup, but it never signs Events or receives Connector credentials.</p>
          <div className="mt-7 grid gap-2 sm:grid-cols-3">
            {[
              ["01", "API key", "Server only"],
              ["02", "Consent", "Human decision"],
              ["03", "Event", "Queued only"],
            ].map(([number, title, detail]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
                <span className="font-mono text-[10px] text-[#b9f57b]">{number}</span>
                <strong className="mt-3 block text-sm">{title}</strong>
                <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/45">{detail}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="large" className="bg-white/70" hover={false}>
          <FiZap className="h-6 w-6 text-[#286323]" aria-hidden="true" />
          <h3 className="mt-7 text-2xl font-semibold tracking-[-0.05em] text-[#163300]">Next steps</h3>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-[#587052]">
            <li className="flex gap-3"><FiCheck className="mt-1 shrink-0 text-[#4b9b42]" aria-hidden="true" />Create a server-only API key.</li>
            <li className="flex gap-3"><FiCheck className="mt-1 shrink-0 text-[#4b9b42]" aria-hidden="true" />Register your Host public key.</li>
            <li className="flex gap-3"><FiCheck className="mt-1 shrink-0 text-[#4b9b42]" aria-hidden="true" />Follow the consent and Event guide.</li>
          </ul>
          <button type="button" onClick={() => onTabChange("api-keys")} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#dff3d7] px-4 py-2.5 text-sm font-bold text-[#286323] transition hover:bg-[#cceabf]">Manage keys <FiExternalLink aria-hidden="true" /></button>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card padding="normal" className="bg-white/75" hover={false}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff3d7] text-[#286323]">{icon}</span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#71876c]">{label}</span>
      </div>
      <strong className="mt-5 block text-3xl font-semibold tracking-[-0.06em] text-[#163300]">{value}</strong>
    </Card>
  );
}

function ApiKeysPanel({
  keys,
  revealedKey,
  copied,
  loading,
  creating,
  onCreate,
  onCopy,
  onRevoke,
}: {
  keys: DeveloperApiKey[];
  revealedKey: DeveloperApiKeyReveal | null;
  copied: boolean;
  loading: boolean;
  creating: boolean;
  onCreate: () => void;
  onCopy: () => void;
  onRevoke: (apiKeyId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8e3d]">Organization credentials</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#163300]">API keys</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#587052]">Keys authenticate Host server control calls. Only the digest and visible prefix are retained by the Receiver.</p>
        </div>
        <Button type="button" onClick={onCreate} isLoading={creating}>
          <FiPlus aria-hidden="true" />
          Create key
        </Button>
      </div>

      {revealedKey ? (
        <Card padding="large" className="border-[#9acb8f] bg-[#dff3d7]" hover={false}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#286323]">Copy this key now</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#163300]">It will not be shown again.</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#587052]">Place it in your Host server environment. Never commit it, send it to the browser bundle, or pass it to a Connector.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={onCopy}>
              {copied ? <FiCheck aria-hidden="true" /> : <FiClipboard aria-hidden="true" />}
              {copied ? "Copied" : "Copy key"}
            </Button>
          </div>
          <code className="mt-6 block overflow-x-auto rounded-2xl border border-[#a8c89e] bg-white/75 px-4 py-3 font-mono text-sm text-[#163300]">{revealedKey.api_key}</code>
        </Card>
      ) : null}

      <Card padding="none" className="bg-white/75" hover={false}>
        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
          <SectionHeader title="Issued keys" subtitle="Stored metadata only" />
          <FiKey className="h-5 w-5 text-[#4a8e3d]" aria-hidden="true" />
        </div>
        {loading ? <LoadingLine label="Loading key metadata" /> : keys.length === 0 ? <EmptyState icon={<FiKey aria-hidden="true" />} title="No API keys" description="Create one to connect a Host server to this organization." /> : (
          <Table>
            <Thead><Th>Prefix</Th><Th>Created</Th><Th>Status</Th><Th className="text-right">Action</Th></Thead>
            <Tbody>
              {keys.map((key) => (
                <Tr key={key.api_key_id}>
                  <Td><code className="rounded-lg bg-[#eef7e8] px-2 py-1 font-mono text-xs text-[#286323]">{key.key_prefix}…</code></Td>
                  <Td className="text-sm text-[#587052]">{formatDateTime(key.created_at)}</Td>
                  <Td><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(key)}`}>{statusLabel(key)}</span></Td>
                  <Td className="text-right">{key.revoked_at ? <span className="text-xs text-[#868685]">Unavailable</span> : <Button type="button" size="sm" variant="danger" onClick={() => onRevoke(key.api_key_id)}><FiTrash2 aria-hidden="true" /> Revoke</Button>}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function EventsPanel({ events, loading }: { events: DeveloperEvent[]; loading: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a8e3d]">Organization audit surface</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#163300]">Events</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#587052]">A redacted history of accepted Events and their Delivery state. Event bodies, bindings, tokens, Connector credentials, and private receipts stay outside this view.</p>
      </div>
      <Card padding="none" className="bg-white/75" hover={false}>
        {loading ? <LoadingLine label="Loading Event history" /> : events.length === 0 ? <EmptyState icon={<FiActivity aria-hidden="true" />} title="No Events recorded" description="Accepted Host Events will appear here with their redacted Delivery state." /> : (
          <Table className="overflow-x-auto">
            <Thead><Th>Event</Th><Th>Origin</Th><Th>Workflow</Th><Th>Received</Th><Th>Delivery</Th><Th>Attempt</Th><Th>Acknowledged</Th></Thead>
            <Tbody>
              {events.map((event) => (
                <Tr key={event.event_id}>
                  <Td><div className="min-w-[170px]"><strong className="block text-sm text-[#163300]">{event.event_type}</strong><code className="font-mono text-[10px] text-[#71876c]">{event.event_id}</code></div></Td>
                  <Td className="max-w-[190px] truncate text-xs text-[#587052]">{event.issuer_origin}</Td>
                  <Td><code className="font-mono text-xs text-[#286323]">{event.workflow_id}</code></Td>
                  <Td className="whitespace-nowrap text-xs text-[#587052]">{formatDateTime(event.received_at)}</Td>
                  <Td><span className="rounded-full border border-[#cddfc8] bg-[#eef7e8] px-2.5 py-1 text-xs font-semibold capitalize text-[#286323]">{deliveryStateLabel(event.delivery_state)}</span></Td>
                  <Td className="text-sm text-[#587052]">{event.delivery_attempt ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-xs text-[#587052]">{formatDateTime(event.acknowledged_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function LoadingLine({ label }: { label: string }) {
  return <div className="flex items-center gap-3 px-6 py-14 text-sm text-[#587052]"><FiTerminal className="animate-pulse text-[#4a8e3d]" aria-hidden="true" />{label}…</div>;
}
