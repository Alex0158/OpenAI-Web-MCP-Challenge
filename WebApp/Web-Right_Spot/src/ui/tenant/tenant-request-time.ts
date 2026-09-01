const LONDON_TIME_ZONE = "Europe/London";
const WALL_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const londonPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  calendar: "gregory",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  numberingSystem: "latn",
  timeZone: LONDON_TIME_ZONE,
  year: "numeric",
});

const londonOffsetFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON_TIME_ZONE,
  timeZoneName: "longOffset",
});

export type TenantRequestTimeErrorCode =
  | "INVALID_INPUT"
  | "NON_EXISTENT_TIME"
  | "AMBIGUOUS_TIME"
  | "TIMEZONE_UNAVAILABLE";

export class TenantRequestTimeError extends Error {
  readonly code: TenantRequestTimeErrorCode;

  constructor(code: TenantRequestTimeErrorCode, message: string) {
    super(message);
    this.name = "TenantRequestTimeError";
    this.code = code;
  }
}

type WallTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/**
 * Convert a datetime-local value, which has no timezone by definition, from the
 * product's Europe/London wall-clock contract to a canonical UTC instant.
 *
 * DST gaps and overlaps fail closed. An overlap is not guessed because the
 * tenant cannot express which occurrence they intended in a datetime-local
 * control.
 */
export function londonWallTimeToUtcIso(value: string): string {
  const wallTime = parseWallTime(value);
  const naiveUtcMilliseconds = wallTimeToNaiveUtcMilliseconds(wallTime);
  const offsets = new Set<number>([
    londonOffsetMinutesAt(naiveUtcMilliseconds - 2 * DAY_IN_MILLISECONDS),
    londonOffsetMinutesAt(naiveUtcMilliseconds),
    londonOffsetMinutesAt(naiveUtcMilliseconds + 2 * DAY_IN_MILLISECONDS),
  ]);
  const candidates = [...offsets]
    .map((offsetMinutes) => naiveUtcMilliseconds - offsetMinutes * 60 * 1000)
    .filter((instantMilliseconds) => sameWallTime(londonPartsAt(instantMilliseconds), wallTime));

  if (candidates.length === 0) {
    throw new TenantRequestTimeError(
      "NON_EXISTENT_TIME",
      "That Europe/London time does not exist because the clocks change. Choose another time.",
    );
  }
  if (candidates.length > 1) {
    throw new TenantRequestTimeError(
      "AMBIGUOUS_TIME",
      "That Europe/London time occurs twice because the clocks change. Choose another time.",
    );
  }

  return new Date(candidates[0]!).toISOString();
}

/** Convert a stored UTC ISO instant into the value shown by the London editor. */
export function utcIsoToLondonInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "";
  const parts = londonPartsAt(date.valueOf());
  return formatWallTime(parts);
}

function parseWallTime(value: string): WallTimeParts {
  const match = WALL_TIME_PATTERN.exec(value);
  if (!match) {
    throw new TenantRequestTimeError("INVALID_INPUT", "Each preferred time must be a valid date and time.");
  }
  const wallTime: WallTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const naive = new Date(0);
  naive.setUTCFullYear(wallTime.year, wallTime.month - 1, wallTime.day);
  naive.setUTCHours(wallTime.hour, wallTime.minute, 0, 0);
  if (
    naive.getUTCFullYear() !== wallTime.year
    || naive.getUTCMonth() !== wallTime.month - 1
    || naive.getUTCDate() !== wallTime.day
    || naive.getUTCHours() !== wallTime.hour
    || naive.getUTCMinutes() !== wallTime.minute
  ) {
    throw new TenantRequestTimeError("INVALID_INPUT", "Each preferred time must be a valid date and time.");
  }
  return wallTime;
}

function wallTimeToNaiveUtcMilliseconds(wallTime: WallTimeParts): number {
  const date = new Date(0);
  date.setUTCFullYear(wallTime.year, wallTime.month - 1, wallTime.day);
  date.setUTCHours(wallTime.hour, wallTime.minute, 0, 0);
  return date.valueOf();
}

function londonPartsAt(milliseconds: number): WallTimeParts {
  const values = partsByName(londonPartsFormatter.formatToParts(new Date(milliseconds)));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function londonOffsetMinutesAt(milliseconds: number): number {
  const timeZoneName = londonOffsetFormatter
    .formatToParts(new Date(milliseconds))
    .find((part) => part.type === "timeZoneName")?.value;
  if (!timeZoneName) {
    throw new TenantRequestTimeError("TIMEZONE_UNAVAILABLE", "The Europe/London time boundary is unavailable.");
  }
  if (timeZoneName === "GMT") return 0;
  const match = /^GMT([+-])(\d{2})(?::?(\d{2}))?$/.exec(timeZoneName);
  if (!match) {
    throw new TenantRequestTimeError("TIMEZONE_UNAVAILABLE", "The Europe/London time boundary is unavailable.");
  }
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "+" ? minutes : -minutes;
}

function partsByName(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function sameWallTime(left: WallTimeParts, right: WallTimeParts): boolean {
  return left.year === right.year
    && left.month === right.month
    && left.day === right.day
    && left.hour === right.hour
    && left.minute === right.minute;
}

function formatWallTime(parts: WallTimeParts): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(parts.year).padStart(4, "0")}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}
