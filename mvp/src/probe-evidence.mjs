export function hasBoundRawWebMcpCall(source, toolName) {
  if (typeof source !== "string" || typeof toolName !== "string") return false;
  if (/\.fetchTools\s*=|Object\.defineProperty\s*\([^)]*fetchTools/.test(source)) return false;

  const assignment = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.capabilities\.webmcp\.fetchTools\(\s*\)\s*;/.exec(
    source,
  );
  if (!assignment) return false;

  const variable = escapeRegExp(assignment[1]);
  const afterAssignment = source.slice(assignment.index + assignment[0].length);
  const callPattern = new RegExp(
    `nodeRepl\\.write\\(\\s*await\\s+${variable}\\.call\\(\\s*["']${escapeRegExp(toolName)}["']\\s*,\\s*\\{\\s*\\}\\s*\\)\\s*\\)\\s*;?`,
  );
  const call = callPattern.exec(afterAssignment);
  if (!call) return false;

  const between = afterAssignment.slice(0, call.index);
  const reassignment = new RegExp(
    `(?:\\b(?:const|let|var)\\s+${variable}\\b|\\b${variable}\\s*=|Object\\.(?:assign|defineProperty)\\s*\\(\\s*${variable}\\b)`,
  );
  return !reassignment.test(between);
}

export function hasBrowserWebMcpProvenance(
  call,
  {
    toolName,
    browserFamily = "iab",
    sourceHostname,
    expectedPath,
  },
) {
  const surface = call?.result?._meta?.["codex/toolSurface"];
  if (!surface || surface.kind !== "browserUse" || surface.backend !== browserFamily) {
    return false;
  }
  if (!Array.isArray(surface.webMcpCalls) || surface.webMcpCalls.length !== 1) return false;

  const entry = surface.webMcpCalls[0];
  if (entry?.kind !== "invokeTool" || entry?.name !== toolName) return false;
  if (entry?.readOnlyHint !== true || entry?.inputTruncated === true || entry?.outputTruncated === true) {
    return false;
  }
  if (sourceHostname && entry?.sourceHostname !== sourceHostname) return false;

  const input = parseExactJson(entry?.inputJson);
  if (!input || Array.isArray(input) || Object.keys(input).length !== 0) return false;
  const output = parseExactJson(entry?.outputJson);
  if (!output || output.ok !== true) return false;
  if (expectedPath) {
    const observedPath = output.current_path ?? output.currentPath;
    if (observedPath !== expectedPath) return false;
  }
  return true;
}

export function classifyBrowserFailure(text) {
  for (const code of ["missing-session-metadata", "no-iab-backends", "no-session-match"]) {
    if (String(text).includes(code)) return code;
  }
  if (/in-app browser.+(?:unavailable|not available)/i.test(String(text))) {
    return "iab-unavailable";
  }
  if (/browser is not available:\s*iab/i.test(String(text))) return "iab-unavailable";
  if (/browser setup.+(?:failed|unavailable)/i.test(String(text))) {
    return "browser-setup-failed";
  }
  return null;
}

export function isActiveWriterConflict(text) {
  return /already has an active writer/i.test(String(text));
}

export function shouldPersistProbeEvidence(evidence, allowInconclusive = false) {
  if (allowInconclusive) return true;
  if (evidence?.pass === true) return true;
  return /^FAIL(?:_|:)/.test(String(evidence?.verdict ?? ""));
}

export function sanitizeProbeError(error, { homeDir = "", secrets = [] } = {}) {
  let sanitized = String(error?.stack ?? error);
  if (homeDir) sanitized = sanitized.replaceAll(homeDir, "$HOME");
  for (const secret of secrets) {
    if (secret) sanitized = sanitized.replaceAll(String(secret), "[probe-secret-redacted]");
  }
  return sanitized
    .replace(/thr_[A-Za-z0-9_-]+/g, "thr_[redacted]")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "[uuid-redacted]");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseExactJson(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
