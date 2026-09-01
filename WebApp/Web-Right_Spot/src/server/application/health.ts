import {
  DEFAULT_DATABASE_PATH,
  openFoundationDatabase,
} from "../persistence/sqlite";

export type HealthPayload = {
  ok: boolean;
  service: "rightspot";
};

export type HealthResult = {
  status: 200 | 503;
  payload: HealthPayload;
};

const READY_PAYLOAD: HealthPayload = { ok: true, service: "rightspot" };
const NOT_READY_PAYLOAD: HealthPayload = { ok: false, service: "rightspot" };

export function checkHealth(databasePath: string = DEFAULT_DATABASE_PATH): HealthResult {
  let database: ReturnType<typeof openFoundationDatabase> | undefined;

  try {
    database = openFoundationDatabase(databasePath);
    return { status: 200, payload: READY_PAYLOAD };
  } catch {
    return { status: 503, payload: NOT_READY_PAYLOAD };
  } finally {
    database?.database.close();
  }
}
