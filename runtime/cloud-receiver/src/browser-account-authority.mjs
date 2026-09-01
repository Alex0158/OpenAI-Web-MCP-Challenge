const SESSION_COOKIE = "reentry_session";

export function createBrowserAccountAuthority(options) {
  if (
    !options ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    !options.store ||
    typeof options.store.getSession !== "function"
  ) {
    throw new TypeError("Browser account authority requires an account store");
  }
  const clock = options.clock ?? (() => new Date());
  if (typeof clock !== "function") {
    throw new TypeError("Browser account authority clock must be a function");
  }

  return Object.freeze({
    readAccount(request) {
      const token = readCookie(request, SESSION_COOKIE);
      if (!token) return null;
      const now = clock();
      if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
        throw new TypeError("Browser account authority clock must return a valid Date");
      }
      return options.store.getSession(token, new Date(now.getTime()));
    },
  });
}

function readCookie(request, name) {
  const header = request?.headers?.cookie;
  if (typeof header !== "string") return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{16,256}$/.test(value) ? value : null;
  }
  return null;
}
