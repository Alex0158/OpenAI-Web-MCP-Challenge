import type {
  FavouriteErrorCode,
  FavouriteListingDto,
  FavouriteMutationResultDto,
  RemoveFavouriteBody,
  SaveFavouriteBody,
  TenantFavouriteDto,
  TenantFavouriteMutationResponse,
  TenantFavouritesResponse,
} from "../../shared/contracts/favourites-api";
import { FAVOURITE_ERROR_CODES } from "../../shared/contracts/favourites-api";
import { createCommandId } from "./tenant-api";

export class FavouriteApiError extends Error {
  readonly status: number;
  readonly code: FavouriteErrorCode | "INVALID_RESPONSE" | "NETWORK_ERROR" | `HTTP_${number}`;

  constructor(status: number, code: FavouriteApiError["code"], message: string) {
    super(message);
    this.name = "FavouriteApiError";
    this.status = status;
    this.code = code;
  }
}

export type SaveFavouriteInput = {
  commandId?: string;
  fixtureGeneration: number;
  listingId: string;
  expectedListingVersion: number;
  expectedFavouriteVersion: number;
};

export type RemoveFavouriteInput = {
  commandId?: string;
  fixtureGeneration: number;
  expectedFavouriteVersion: number;
};

export function buildSaveFavouritePayload(input: SaveFavouriteInput): SaveFavouriteBody {
  return {
    commandId: input.commandId ?? createCommandId("save-favourite"),
    fixtureGeneration: input.fixtureGeneration,
    listingId: input.listingId,
    expectedListingVersion: input.expectedListingVersion,
    expectedFavouriteVersion: input.expectedFavouriteVersion,
  };
}

export function buildRemoveFavouritePayload(input: RemoveFavouriteInput): RemoveFavouriteBody {
  return {
    commandId: input.commandId ?? createCommandId("remove-favourite"),
    fixtureGeneration: input.fixtureGeneration,
    expectedFavouriteVersion: input.expectedFavouriteVersion,
  };
}

export async function readTenantFavourites(): Promise<TenantFavouritesResponse> {
  return parseTenantFavouritesResponse(await requestJson("/api/tenant/favourites", { method: "GET" }));
}

export async function saveTenantFavourite(
  input: SaveFavouriteInput,
): Promise<TenantFavouriteMutationResponse> {
  const payload = buildSaveFavouritePayload(input);
  const response = parseTenantFavouriteMutationResponse(
    await requestJson("/api/tenant/favourites", jsonOptions("POST", payload)),
  );
  assertMutationProjection(response, input.listingId);
  return response;
}

export async function removeTenantFavourite(
  listingId: string,
  input: RemoveFavouriteInput,
): Promise<TenantFavouriteMutationResponse> {
  const payload = buildRemoveFavouritePayload(input);
  const response = parseTenantFavouriteMutationResponse(
    await requestJson(
      `/api/tenant/favourites/${encodeURIComponent(listingId)}`,
      jsonOptions("DELETE", payload),
    ),
  );
  assertMutationProjection(response, listingId);
  return response;
}

export function activeFavouriteFor(
  response: TenantFavouritesResponse,
  listingId: string,
): TenantFavouriteDto | undefined {
  return response.favourites.find((favourite) => favourite.listingId === listingId);
}

export function favouriteVersionFor(response: TenantFavouritesResponse, listingId: string): number {
  return Object.hasOwn(response.favouriteVersions, listingId)
    ? response.favouriteVersions[listingId]!
    : 0;
}

export function isFavouriteConflict(error: unknown): error is FavouriteApiError {
  return error instanceof FavouriteApiError && error.status === 409;
}

export function favouriteErrorMessage(error: unknown, action: string): string {
  if (!(error instanceof FavouriteApiError)) {
    return `Could not ${action}. Please try again.`;
  }

  switch (error.status) {
    case 400:
      return `The ${action} request was invalid. Refresh the saved state before trying again.`;
    case 401:
      return "Your demo session is no longer active. Return to the sign-in surface and start again.";
    case 403:
      return "This tenant workspace cannot access saved listings.";
    case 404:
      return "This listing is no longer available to the tenant workspace.";
    case 409:
      return "The saved state changed on the server. Refresh the authoritative Favourite view before trying again.";
    case 503:
      return "RightSpot could not reach the local Favourite service. Please try again.";
    default:
      return `Could not ${action}. Please try again.`;
  }
}

export function parseTenantFavouritesResponse(value: unknown): TenantFavouritesResponse {
  if (!isRecord(value)
    || !isPositiveInteger(value.fixtureGeneration)
    || !Array.isArray(value.favourites)
    || !isRecord(value.favouriteVersions)) {
    throw invalidResponse();
  }

  const favourites = value.favourites.map(parseTenantFavourite);
  const favouriteVersions = parseFavouriteVersions(value.favouriteVersions);
  const listingIds = new Set<string>();
  for (const favourite of favourites) {
    if (listingIds.has(favourite.listingId)
      || favouriteVersions[favourite.listingId] !== favourite.version) {
      throw invalidResponse();
    }
    listingIds.add(favourite.listingId);
  }

  return {
    fixtureGeneration: value.fixtureGeneration,
    favourites,
    favouriteVersions,
  };
}

export function parseTenantFavouriteMutationResponse(
  value: unknown,
): TenantFavouriteMutationResponse {
  const projection = parseTenantFavouritesResponse(value);
  if (!isRecord(value) || !isRecord(value.result)) throw invalidResponse();
  return { ...projection, result: parseMutationResult(value.result) };
}

function jsonOptions(method: "POST" | "DELETE", body: object): RequestInit {
  return {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

async function requestJson(path: string, options: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json", ...(options.headers ?? {}) },
      ...options,
    });
  } catch {
    throw new FavouriteApiError(503, "NETWORK_ERROR", "The Favourite service could not be reached");
  }

  let payload: unknown;
  try {
    payload = await response.json() as unknown;
  } catch {
    throw invalidResponse(response.status);
  }

  if (!response.ok) {
    const code = isRecord(payload)
      && isRecord(payload.error)
      && isFavouriteErrorCode(payload.error.code)
      ? payload.error.code
      : `HTTP_${response.status}` as const;
    throw new FavouriteApiError(response.status, code, "The Favourite request could not be completed");
  }

  return payload;
}

function parseTenantFavourite(value: unknown): TenantFavouriteDto {
  if (!isRecord(value)
    || typeof value.listingId !== "string"
    || value.state !== "ACTIVE"
    || !isPositiveInteger(value.version)
    || !isNonEmptyString(value.createdAt)
    || !isNonEmptyString(value.updatedAt)
    || !isPositiveInteger(value.savedListingVersion)
    || !isNonNegativeInteger(value.savedMonthlyRentGbp)
    || typeof value.changedSinceSaved !== "boolean"
    || !isRecord(value.listing)) {
    throw invalidResponse();
  }

  const listing = parseFavouriteListing(value.listing);
  if (listing.id !== value.listingId) throw invalidResponse();
  return {
    listingId: value.listingId,
    state: "ACTIVE",
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    savedListingVersion: value.savedListingVersion,
    savedMonthlyRentGbp: value.savedMonthlyRentGbp,
    changedSinceSaved: value.changedSinceSaved,
    listing,
  };
}

function parseFavouriteListing(value: Record<string, unknown>): FavouriteListingDto {
  if (!isNonEmptyString(value.id)
    || !isPositiveInteger(value.version)
    || !isNonEmptyString(value.title)
    || !isNonEmptyString(value.address)
    || !isNonEmptyString(value.area)
    || !isNonNegativeInteger(value.monthlyRentGbp)
    || !isNonNegativeInteger(value.bedrooms)
    || !isNonNegativeInteger(value.sizeSqM)
    || !isNonEmptyString(value.availableFrom)
    || !isNonEmptyString(value.description)
    || !isNonEmptyString(value.imageKey)
    || (value.status !== "PUBLISHED" && value.status !== "UNPUBLISHED")) {
    throw invalidResponse();
  }
  return {
    id: value.id,
    version: value.version,
    title: value.title,
    address: value.address,
    area: value.area,
    monthlyRentGbp: value.monthlyRentGbp,
    bedrooms: value.bedrooms,
    sizeSqM: value.sizeSqM,
    availableFrom: value.availableFrom,
    description: value.description,
    imageKey: value.imageKey,
    status: value.status,
  };
}

function parseFavouriteVersions(value: Record<string, unknown>): Record<string, number> {
  const versions: Record<string, number> = {};
  for (const [listingId, version] of Object.entries(value)) {
    if (!isSafeMapKey(listingId) || !isPositiveInteger(version)) throw invalidResponse();
    versions[listingId] = version;
  }
  return versions;
}

function parseMutationResult(value: Record<string, unknown>): FavouriteMutationResultDto {
  if ((value.state !== "ACTIVE" && value.state !== "REMOVED")
    || !isPositiveInteger(value.version)
    || (value.idempotent !== undefined && typeof value.idempotent !== "boolean")) {
    throw invalidResponse();
  }
  return {
    state: value.state,
    version: value.version,
    ...(value.idempotent === true ? { idempotent: true } : {}),
  };
}

function assertMutationProjection(
  response: TenantFavouriteMutationResponse,
  listingId: string,
): void {
  const activeFavourite = activeFavouriteFor(response, listingId);
  if (response.favouriteVersions[listingId] !== response.result.version
    || (response.result.state === "ACTIVE" && activeFavourite?.version !== response.result.version)
    || (response.result.state === "REMOVED" && activeFavourite !== undefined)) {
    throw invalidResponse();
  }
}

function invalidResponse(status = 200): FavouriteApiError {
  return new FavouriteApiError(status, "INVALID_RESPONSE", "The Favourite service returned invalid data");
}

function isFavouriteErrorCode(value: unknown): value is FavouriteErrorCode {
  return typeof value === "string"
    && (FAVOURITE_ERROR_CODES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSafeMapKey(value: string): boolean {
  return value.length > 0
    && value !== "__proto__"
    && value !== "constructor"
    && value !== "prototype";
}
