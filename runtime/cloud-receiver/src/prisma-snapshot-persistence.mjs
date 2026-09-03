/**
 * @deprecated Compatibility exports for the retired hosted Cloud Receiver persistence adapter.
 * Preserve for historical callers only.
 */
// Compatibility import for callers of the previous hosted preview adapter.
export {
  CloudReceiverPersistenceBusyError,
  createPrismaRelationalPersistence,
  createPrismaSnapshotPersistence,
} from "./prisma-relational-persistence.mjs";
