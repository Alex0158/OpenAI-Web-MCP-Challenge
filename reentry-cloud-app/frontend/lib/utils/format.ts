// ISO string → "Apr 14, 2025, 10:30 AM"  (returns "Never" for null/undefined)
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Days since ISO date → "today" | "yesterday" | "X days ago"
export function formatAge(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
