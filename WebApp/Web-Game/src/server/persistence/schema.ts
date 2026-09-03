export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS world (
  world_id TEXT PRIMARY KEY,
  world_time INTEGER NOT NULL,
  in_progress_world_time INTEGER,
  server_time_anchor_ms INTEGER,
  world_event_cursor INTEGER NOT NULL DEFAULT 0,
  world_seed TEXT,
  generation_version TEXT,
  map_fingerprint TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player (
  world_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  binding TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  explored_cells_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, player_id),
  UNIQUE (world_id, binding),
  FOREIGN KEY (world_id) REFERENCES world(world_id)
);

CREATE TABLE IF NOT EXISTS shelter (
  world_id TEXT NOT NULL,
  shelter_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, shelter_id),
  FOREIGN KEY (world_id, player_id) REFERENCES player(world_id, player_id)
);

CREATE TABLE IF NOT EXISTS soldier (
  world_id TEXT NOT NULL,
  soldier_id TEXT NOT NULL,
  shelter_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'resident',
  role TEXT,
  tool TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  work_id TEXT,
  next_due_world_time INTEGER,
  claim_id TEXT,
  claim_attempt INTEGER NOT NULL DEFAULT 0,
  lease_expires_at_wall_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, soldier_id),
  FOREIGN KEY (world_id, shelter_id) REFERENCES shelter(world_id, shelter_id)
);

CREATE TABLE IF NOT EXISTS mission (
  world_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  soldier_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active',
  phase TEXT NOT NULL DEFAULT 'AT_SHELTER',
  role TEXT,
  tool TEXT,
  target_id TEXT,
  return_policy TEXT,
  active_attempt_id TEXT,
  encounter_id TEXT,
  encounter_status TEXT,
  monster_reissue_budget INTEGER NOT NULL DEFAULT 1,
  danger_cell_json TEXT,
  waiting_review_reason TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  work_id TEXT,
  next_due_world_time INTEGER,
  claim_id TEXT,
  claim_attempt INTEGER NOT NULL DEFAULT 0,
  lease_expires_at_wall_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, mission_id),
  FOREIGN KEY (world_id, soldier_id) REFERENCES soldier(world_id, soldier_id)
);

CREATE TABLE IF NOT EXISTS mission_attempt (
  world_id TEXT NOT NULL,
  mission_attempt_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active',
  phase TEXT NOT NULL DEFAULT 'TERMINAL',
  role TEXT,
  tool TEXT,
  equipment_tier INTEGER NOT NULL DEFAULT 1,
  target_id TEXT,
  route_json TEXT,
  home_anchor_json TEXT,
  return_policy TEXT,
  encounter_id TEXT,
  encounter_status TEXT,
  terminal_cause TEXT,
  start_world_time INTEGER NOT NULL DEFAULT 0,
  last_transition_world_time INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 0,
  work_id TEXT,
  next_due_world_time INTEGER,
  claim_id TEXT,
  claim_attempt INTEGER NOT NULL DEFAULT 0,
  lease_expires_at_wall_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, mission_attempt_id),
  FOREIGN KEY (world_id, mission_id) REFERENCES mission(world_id, mission_id)
);

CREATE TABLE IF NOT EXISTS cargo (
  world_id TEXT NOT NULL,
  cargo_id TEXT NOT NULL,
  soldier_id TEXT NOT NULL,
  mission_attempt_id TEXT,
  source_node_id TEXT,
  resource_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  acquired_world_time INTEGER,
  capacity_used INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, cargo_id),
  FOREIGN KEY (world_id, soldier_id) REFERENCES soldier(world_id, soldier_id),
  FOREIGN KEY (world_id, mission_attempt_id) REFERENCES mission_attempt(world_id, mission_attempt_id),
  FOREIGN KEY (world_id, source_node_id) REFERENCES resource_node(world_id, resource_node_id)
);

CREATE TABLE IF NOT EXISTS resource_node (
  world_id TEXT NOT NULL,
  resource_node_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 0,
  work_id TEXT,
  next_due_world_time INTEGER,
  claim_id TEXT,
  claim_attempt INTEGER NOT NULL DEFAULT 0,
  lease_expires_at_wall_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, resource_node_id),
  FOREIGN KEY (world_id) REFERENCES world(world_id)
);

CREATE TABLE IF NOT EXISTS monster (
  world_id TEXT NOT NULL,
  monster_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'patrol',
  revision INTEGER NOT NULL DEFAULT 0,
  work_id TEXT,
  next_due_world_time INTEGER,
  claim_id TEXT,
  claim_attempt INTEGER NOT NULL DEFAULT 0,
  lease_expires_at_wall_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, monster_id),
  FOREIGN KEY (world_id) REFERENCES world(world_id)
);

CREATE TABLE IF NOT EXISTS encounter (
  world_id TEXT NOT NULL,
  encounter_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'LOCKED',
  mission_id TEXT NOT NULL,
  mission_attempt_id TEXT NOT NULL,
  soldier_id TEXT NOT NULL,
  monster_id TEXT NOT NULL,
  soldier_hp INTEGER NOT NULL DEFAULT 100,
  monster_hp INTEGER NOT NULL DEFAULT 80,
  round_number INTEGER NOT NULL DEFAULT 0,
  contact_world_time INTEGER NOT NULL DEFAULT 0,
  engagement_x REAL NOT NULL,
  engagement_y REAL NOT NULL,
  terminal_cause TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  work_id TEXT,
  next_due_world_time INTEGER,
  claim_id TEXT,
  claim_attempt INTEGER NOT NULL DEFAULT 0,
  lease_expires_at_wall_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, encounter_id),
  UNIQUE (world_id, mission_attempt_id, monster_id),
  FOREIGN KEY (world_id, mission_id) REFERENCES mission(world_id, mission_id),
  FOREIGN KEY (world_id, mission_attempt_id) REFERENCES mission_attempt(world_id, mission_attempt_id),
  FOREIGN KEY (world_id, soldier_id) REFERENCES soldier(world_id, soldier_id),
  FOREIGN KEY (world_id, monster_id) REFERENCES monster(world_id, monster_id),
  CHECK (state IN ('LOCKED', 'RESOLVING', 'RESOLVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS encounter_active_soldier_idx
  ON encounter(world_id, soldier_id)
  WHERE state IN ('LOCKED', 'RESOLVING');
CREATE UNIQUE INDEX IF NOT EXISTS encounter_active_monster_idx
  ON encounter(world_id, monster_id)
  WHERE state IN ('LOCKED', 'RESOLVING');

CREATE TABLE IF NOT EXISTS world_snapshot (
  world_snapshot_id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  snapshot_version INTEGER NOT NULL,
  contract_version TEXT NOT NULL,
  world_time INTEGER NOT NULL,
  last_world_event_cursor INTEGER NOT NULL,
  entity_revisions_json TEXT NOT NULL,
  state_json TEXT NOT NULL,
  state_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (world_id) REFERENCES world(world_id)
);

CREATE TABLE IF NOT EXISTS domain_event (
  event_id TEXT PRIMARY KEY,
  event_version INTEGER NOT NULL,
  contract_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  world_id TEXT NOT NULL,
  world_event_cursor INTEGER NOT NULL,
  world_time INTEGER NOT NULL,
  causation_id TEXT,
  idempotency_key TEXT,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_revision INTEGER,
  visibility_scope_json TEXT NOT NULL,
  typed_payload_json TEXT NOT NULL,
  affected_entity_revisions_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (world_id, world_event_cursor),
  FOREIGN KEY (world_id) REFERENCES world(world_id)
);

CREATE TABLE IF NOT EXISTS idempotency_record (
  world_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  binding TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  outcome TEXT NOT NULL,
  result_json TEXT NOT NULL,
  event_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, idempotency_key),
  FOREIGN KEY (world_id) REFERENCES world(world_id)
);

CREATE TABLE IF NOT EXISTS agent_signal_slot (
  world_id TEXT NOT NULL,
  shelter_id TEXT NOT NULL,
  opaque_binding TEXT NOT NULL,
  signal_id TEXT NOT NULL,
  grant_id TEXT NOT NULL,
  bounded_action TEXT NOT NULL,
  status TEXT NOT NULL,
  cursor_start INTEGER NOT NULL,
  cursor_end INTEGER NOT NULL,
  eligible_event_count INTEGER NOT NULL,
  event_types_json TEXT NOT NULL,
  severity TEXT NOT NULL,
  latest_event_id TEXT NOT NULL,
  latest_event_type TEXT NOT NULL,
  latest_world_time INTEGER NOT NULL,
  deferred_cursor_start INTEGER,
  deferred_cursor_end INTEGER,
  deferred_eligible_event_count INTEGER NOT NULL DEFAULT 0,
  deferred_event_types_json TEXT NOT NULL DEFAULT '[]',
  deferred_severity TEXT NOT NULL DEFAULT 'info',
  deferred_latest_event_id TEXT,
  deferred_latest_event_type TEXT,
  deferred_latest_world_time INTEGER,
  cooldown_until_world_time INTEGER NOT NULL,
  lease_id TEXT,
  lease_expires_at_wall_ms INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (world_id, shelter_id, opaque_binding),
  UNIQUE (world_id, signal_id),
  FOREIGN KEY (world_id, shelter_id) REFERENCES shelter(world_id, shelter_id)
);

CREATE TABLE IF NOT EXISTS outbox_delivery (
  delivery_id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  shelter_id TEXT NOT NULL,
  opaque_binding TEXT NOT NULL,
  signal_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  lease_id TEXT,
  lease_expires_at_wall_ms INTEGER,
  last_outcome TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (world_id, signal_id),
  FOREIGN KEY (world_id, shelter_id, opaque_binding)
    REFERENCES agent_signal_slot(world_id, shelter_id, opaque_binding)
);

CREATE TABLE IF NOT EXISTS schema_meta (
  schema_meta_id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  contract_version TEXT NOT NULL,
  supported_event_version INTEGER NOT NULL,
  supported_snapshot_version INTEGER NOT NULL,
  migration_id TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS domain_event_world_cursor_idx
  ON domain_event(world_id, world_event_cursor);
CREATE INDEX IF NOT EXISTS world_snapshot_world_created_idx
  ON world_snapshot(world_id, created_at, world_snapshot_id);
CREATE INDEX IF NOT EXISTS outbox_status_lease_idx
  ON outbox_delivery(status, lease_expires_at_wall_ms);
`;
