import { domainError, DomainError } from "./errors";
import {
  evaluateExpiry,
  MAX_IDENTIFIER_LENGTH,
  validateWorkflowState,
} from "./workflow";
import type {
  Actor,
  Favourite,
  FavouriteCommand,
  FavouriteCommandOutcome,
  FavouriteCommandResult,
  WorkflowState,
} from "./types";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;

export function executeFavouriteCommand(
  state: WorkflowState,
  command: FavouriteCommand,
  now: string,
): FavouriteCommandOutcome {
  const source = clone(state);

  try {
    validateNow(now);
    validateFavouriteCommand(command);
    validateWorkflowState(source);
  } catch (error) {
    return failure(source, asDomainError(error, "VALIDATION_FAILED", "Invalid Favourite command"));
  }

  const evaluated = evaluateExpiry(source, now);
  const fingerprint = fingerprintCommand(command);
  const processed = evaluated.state.processedCommands.find(
    (entry) => entry.commandId === command.commandId,
  );
  if (processed) {
    if (processed.fingerprint !== fingerprint) {
      return failure(
        evaluated.state,
        domainError("COMMAND_CONFLICT", "Command identifier was already used with different input"),
      );
    }
    if (!("favouriteState" in processed.result)) {
      return failure(
        evaluated.state,
        domainError("COMMAND_CONFLICT", "Command identifier was already used by another operation"),
      );
    }
    return {
      ok: true,
      state: evaluated.state,
      result: { ...processed.result, idempotent: true },
    };
  }

  try {
    const next = command.type === "SAVE_FAVOURITE"
      ? saveFavourite(evaluated.state, command, now)
      : removeFavourite(evaluated.state, command, now);
    validateWorkflowState(next.state);
    return next;
  } catch (error) {
    return failure(
      evaluated.state,
      asDomainError(error, "VALIDATION_FAILED", "Favourite command was rejected"),
    );
  }
}

function saveFavourite(
  state: WorkflowState,
  command: Extract<FavouriteCommand, { type: "SAVE_FAVOURITE" }>,
  now: string,
): { ok: true; state: WorkflowState; result: FavouriteCommandResult } {
  assertTenant(command.actor, state);
  assertFixtureGeneration(state, command.fixtureGeneration);
  const listing = getListing(state, command.listingId);
  assertExpectedVersion(listing.version, command.expectedListingVersion);

  const existing = findFavourite(state, command.listingId);
  assertExpectedVersion(existing?.version ?? 0, command.expectedFavouriteVersion);
  if (existing?.state === "ACTIVE") {
    return success(state, command, existing);
  }
  if (listing.status !== "PUBLISHED") {
    throw domainError("VALIDATION_FAILED", "Listing is not published");
  }

  const favourite: Favourite = existing
    ? {
        ...existing,
        state: "ACTIVE",
        version: existing.version + 1,
        updatedAt: now,
        savedListingVersion: listing.version,
        savedMonthlyRentGbp: listing.monthlyRentGbp,
      }
    : {
        tenantId: state.tenantId,
        listingId: listing.id,
        state: "ACTIVE",
        version: 1,
        createdAt: now,
        updatedAt: now,
        savedListingVersion: listing.version,
        savedMonthlyRentGbp: listing.monthlyRentGbp,
      };

  if (existing) {
    const index = state.favourites.indexOf(existing);
    state.favourites[index] = favourite;
  } else {
    state.favourites.push(favourite);
  }
  return success(state, command, favourite);
}

function removeFavourite(
  state: WorkflowState,
  command: Extract<FavouriteCommand, { type: "REMOVE_FAVOURITE" }>,
  now: string,
): { ok: true; state: WorkflowState; result: FavouriteCommandResult } {
  assertTenant(command.actor, state);
  assertFixtureGeneration(state, command.fixtureGeneration);
  const favourite = findFavourite(state, command.listingId);
  if (!favourite) {
    throw domainError("NOT_FOUND", "Favourite was not found");
  }
  assertExpectedVersion(favourite.version, command.expectedFavouriteVersion);
  if (favourite.state === "ACTIVE") {
    favourite.state = "REMOVED";
    favourite.version += 1;
    favourite.updatedAt = now;
  }
  return success(state, command, favourite);
}

function success(
  state: WorkflowState,
  command: FavouriteCommand,
  favourite: Favourite,
): { ok: true; state: WorkflowState; result: FavouriteCommandResult } {
  const result: FavouriteCommandResult = {
    commandId: command.commandId,
    listingId: favourite.listingId,
    favouriteState: favourite.state,
    favouriteVersion: favourite.version,
  };
  state.processedCommands.push({
    commandId: command.commandId,
    fingerprint: fingerprintCommand(command),
    result,
  });
  return { ok: true, state, result };
}

function failure(state: WorkflowState, error: DomainError): FavouriteCommandOutcome {
  return { ok: false, state, error };
}

function findFavourite(state: WorkflowState, listingId: string): Favourite | undefined {
  return state.favourites.find((favourite) => favourite.listingId === listingId);
}

function getListing(
  state: WorkflowState,
  listingId: string,
): WorkflowState["listings"][number] {
  const listing = state.listings.find((candidate) => candidate.id === listingId);
  if (!listing) {
    throw domainError("NOT_FOUND", "Listing was not found");
  }
  return listing;
}

function assertTenant(actor: Actor, state: WorkflowState): void {
  if (actor.role !== "tenant" || actor.id !== state.tenantId) {
    throw domainError("FORBIDDEN", "Actor is not the assigned tenant");
  }
}

function assertFixtureGeneration(state: WorkflowState, expected: number): void {
  if (state.fixtureGeneration !== expected) {
    throw domainError("FIXTURE_GENERATION_CONFLICT", "Fixture generation is stale");
  }
}

function assertExpectedVersion(actual: number, expected: number): void {
  if (actual !== expected) {
    throw domainError("STALE_VERSION", "Expected version is stale");
  }
}

function validateFavouriteCommand(command: FavouriteCommand): void {
  if (!command || typeof command !== "object") {
    throw domainError("VALIDATION_FAILED", "Favourite command is invalid");
  }
  validateIdentifier(command.commandId, "Command identifier");
  validateIdentifier(command.listingId, "Listing identifier");
  if (
    !command.actor
    || typeof command.actor !== "object"
    || (command.actor.role !== "tenant" && command.actor.role !== "agent")
  ) {
    throw domainError("VALIDATION_FAILED", "Actor is invalid");
  }
  validateIdentifier(command.actor.id, "Actor identifier");
  if (!Number.isInteger(command.fixtureGeneration) || command.fixtureGeneration < 1) {
    throw domainError("VALIDATION_FAILED", "Fixture generation must be a positive integer");
  }
  if (!Number.isInteger(command.expectedFavouriteVersion) || command.expectedFavouriteVersion < 0) {
    throw domainError("VALIDATION_FAILED", "Expected Favourite version must be a non-negative integer");
  }
  if (command.type === "SAVE_FAVOURITE") {
    if (!Number.isInteger(command.expectedListingVersion) || command.expectedListingVersion < 1) {
      throw domainError("VALIDATION_FAILED", "Expected listing version must be a positive integer");
    }
    return;
  }
  if (command.type !== "REMOVE_FAVOURITE") {
    throw domainError("VALIDATION_FAILED", "Favourite command type is invalid");
  }
}

function validateIdentifier(value: string, label: string): void {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > MAX_IDENTIFIER_LENGTH
    || !IDENTIFIER_PATTERN.test(value)
  ) {
    throw domainError("VALIDATION_FAILED", `${label} is outside its bounds`);
  }
}

function validateNow(now: string): void {
  if (typeof now !== "string" || !Number.isFinite(Date.parse(now))) {
    throw domainError("VALIDATION_FAILED", "Injected time must be a valid timestamp");
  }
}

function fingerprintCommand(command: FavouriteCommand): string {
  return JSON.stringify(sortKeys(command));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortKeys(entry)]),
    );
  }
  return value;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asDomainError(
  error: unknown,
  fallbackCode: "VALIDATION_FAILED",
  fallbackMessage: string,
): DomainError {
  return error instanceof DomainError ? error : domainError(fallbackCode, fallbackMessage);
}
