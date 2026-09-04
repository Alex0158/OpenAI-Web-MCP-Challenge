/**
 * Re-exported from the shared package so backend code keeps importing from its
 * usual location, while the single definition lives in shared/index.d.ts and
 * the frontend consumes exactly the same one.
 */
export type { PublicDeveloper, PublicUser } from "@saas/shared";
