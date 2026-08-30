import { createBearerToken, createId, digestBearerToken } from "../ids.mjs";
import { inTransaction } from "../database.mjs";
import {
  signDeliveryTicket,
  verifyEffectReceipt,
} from "../reentry-ticket.mjs";
import {
  DELIVERY_TICKET_SECRET,
  DELIVERY_TICKET_TTL_MS,
  EFFECT_RECEIPT_SECRET,
  WORKFLOW_ID,
} from "../config.mjs";

export class HeartbeatInbox {
  constructor({
    database,
    origin,
    trace,
    clock = () => new Date(),
    deliveryTicketSecret = DELIVERY_TICKET_SECRET,
    effectReceiptSecret = EFFECT_RECEIPT_SECRET,
  }) {
    this.database = database;
    this.origin = origin;
    this.trace = trace;
    this.clock = clock;
    this.deliveryTicketSecret = deliveryTicketSecret;
    this.effectReceiptSecret = effectReceiptSecret;
  }

  createForGrant(grantId) {
    requireText(grantId, "grant_id");
    const grant = this.database.prepare(`
      SELECT * FROM grants WHERE grant_id = ?
    `).get(grantId);
    if (!grant || grant.status !== "ACTIVE") {
      throw new HeartbeatInboxError("Heartbeat inbox requires an active Grant", 409);
    }
    if (grant.workflow_id !== WORKFLOW_ID) {
      throw new HeartbeatInboxError("Grant workflow is outside the H1 fixture scope", 422);
    }
    if (Date.parse(grant.expires_at) <= this.clock().getTime()) {
      throw new HeartbeatInboxError("Grant is expired", 409);
    }
    const existing = this.database.prepare(`
      SELECT inbox_id FROM heartbeat_inboxes WHERE grant_id = ?
    `).get(grantId);
    if (existing) {
      throw new HeartbeatInboxError("Heartbeat inbox already exists for the Grant", 409);
    }

    const inboxId = createId("inbox");
    const handle = createBearerToken("h1_inbox");
    this.database.prepare(`
      INSERT INTO heartbeat_inboxes (
        inbox_id, handle_digest, grant_id, workflow_id, status, created_at, expires_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      inboxId,
      digestBearerToken(handle),
      grantId,
      grant.workflow_id,
      this.clock().toISOString(),
      grant.expires_at,
    );
    this.record("create_heartbeat_inbox", grant.correlation_id, "completed", {
      grant_id: grantId,
      inbox_id: inboxId,
      raw_handle_stored: false,
    });
    return {
      receiver_inbox_url: `${this.origin}/receiver/inboxes/${encodeURIComponent(handle)}`,
      workflow_id: grant.workflow_id,
      grant_id: grantId,
      expires_at: grant.expires_at,
    };
  }

  getPending(handle) {
    const inbox = this.resolveHandle(handle);
    const now = this.clock();
    this.requireActive(inbox, now);
    const delivery = this.database.prepare(`
      SELECT
        d.delivery_id, d.event_id, d.run_id, d.grant_id, d.workflow_id,
        d.created_at, e.raw_body
      FROM heartbeat_deliveries d
      JOIN events e ON e.event_id = d.event_id
      WHERE d.inbox_id = ? AND d.status = 'PENDING'
      ORDER BY d.created_at, d.delivery_id
      LIMIT 1
    `).get(inbox.inbox_id);
    if (!delivery) {
      this.record("read_heartbeat_inbox", inbox.correlation_id, "completed", {
        inbox_id: inbox.inbox_id,
        pending: false,
      });
      return {
        pending: false,
        workflow_id: inbox.workflow_id,
        checked_at: now.toISOString(),
      };
    }

    const event = JSON.parse(delivery.raw_body);
    const ticketExpiresAt = new Date(Math.min(
      now.getTime() + DELIVERY_TICKET_TTL_MS,
      Date.parse(inbox.expires_at),
      Date.parse(inbox.grant_expires_at),
    )).toISOString();
    const deliveryTicket = signDeliveryTicket({
      event_id: delivery.event_id,
      run_id: delivery.run_id,
      delivery_id: delivery.delivery_id,
      grant_id: delivery.grant_id,
      workflow_id: delivery.workflow_id,
      event_type: event.event_type,
      canonical_url: event.canonical_url,
      state_version: event.state_version,
      expires_at: ticketExpiresAt,
    }, { secret: this.deliveryTicketSecret, now });
    this.record("read_heartbeat_inbox", inbox.correlation_id, "completed", {
      inbox_id: inbox.inbox_id,
      event_id: delivery.event_id,
      run_id: delivery.run_id,
      pending: true,
      ticket_expires_at: ticketExpiresAt,
    });
    return {
      pending: true,
      event: {
        event_id: event.event_id,
        event_type: event.event_type,
        workflow_id: event.workflow_id,
        event_sequence: event.event_sequence,
        state_version: event.state_version,
        canonical_url: event.canonical_url,
        occurred_at: event.occurred_at,
      },
      delivery: {
        delivery_id: delivery.delivery_id,
        run_id: delivery.run_id,
        ticket_expires_at: ticketExpiresAt,
      },
      delivery_ticket: deliveryTicket,
    };
  }

  acknowledge(handle, effectReceipt) {
    requireText(effectReceipt, "effect_receipt");
    const inbox = this.resolveHandle(handle);
    const claims = verifyEffectReceipt(effectReceipt, {
      secret: this.effectReceiptSecret,
    });
    if (claims.grant_id !== inbox.grant_id || claims.workflow_id !== inbox.workflow_id) {
      throw new HeartbeatInboxError("Effect receipt is outside the inbox scope", 422);
    }
    const delivery = this.database.prepare(`
      SELECT * FROM heartbeat_deliveries WHERE delivery_id = ? AND inbox_id = ?
    `).get(claims.delivery_id, inbox.inbox_id);
    if (!delivery) throw new HeartbeatInboxError("Effect receipt delivery was not found", 422);
    if (
      claims.event_id !== delivery.event_id ||
      claims.run_id !== delivery.run_id ||
      claims.grant_id !== delivery.grant_id ||
      claims.workflow_id !== delivery.workflow_id
    ) {
      throw new HeartbeatInboxError("Effect receipt does not match the pending delivery", 422);
    }
    const hostEffect = this.database.prepare(`
      SELECT request_hash, result_revision, effect_receipt
      FROM workflow_effects WHERE event_id = ? AND workflow_id = ?
    `).get(claims.event_id, claims.workflow_id);
    if (
      !hostEffect ||
      hostEffect.effect_receipt !== effectReceipt ||
      hostEffect.request_hash !== claims.request_hash ||
      hostEffect.result_revision !== claims.result_revision
    ) {
      throw new HeartbeatInboxError("Effect receipt does not resolve to a committed Host effect", 422);
    }
    const receiptDigest = digestBearerToken(effectReceipt);
    if (delivery.status === "COMPLETED") {
      if (delivery.effect_receipt_digest !== receiptDigest) {
        throw new HeartbeatInboxError("Delivery was completed with a different effect receipt", 409);
      }
      return this.ackResponse(delivery, true);
    }
    if (delivery.status !== "PENDING") {
      throw new HeartbeatInboxError("Delivery is not pending", 409);
    }

    const completedAt = this.clock().toISOString();
    inTransaction(this.database, () => {
      const completed = this.database.prepare(`
        UPDATE heartbeat_deliveries
        SET status = 'COMPLETED', effect_receipt_digest = ?, completed_at = ?
        WHERE delivery_id = ? AND status = 'PENDING'
      `).run(receiptDigest, completedAt, delivery.delivery_id);
      if (completed.changes !== 1) {
        throw new HeartbeatInboxError("Delivery completion claim was lost", 409);
      }
      this.database.prepare(`
        UPDATE runs SET status = 'COMPLETED', completed_at = ? WHERE run_id = ?
      `).run(completedAt, delivery.run_id);
      const response = this.ackResponse({ ...delivery, status: "COMPLETED" }, false);
      this.database.prepare(`
        UPDATE events SET status = 'COMPLETED', response_json = ? WHERE event_id = ?
      `).run(JSON.stringify({ accepted: true, duplicate: false, ...response }), delivery.event_id);
    });
    this.record("acknowledge_heartbeat_effect", inbox.correlation_id, "completed", {
      inbox_id: inbox.inbox_id,
      event_id: delivery.event_id,
      run_id: delivery.run_id,
      delivery_id: delivery.delivery_id,
    });
    return this.ackResponse({ ...delivery, status: "COMPLETED" }, false);
  }

  resolveHandle(handle) {
    requireText(handle, "inbox_handle");
    const inbox = this.database.prepare(`
      SELECT
        i.*, g.correlation_id, g.status AS grant_status,
        g.expires_at AS grant_expires_at
      FROM heartbeat_inboxes i
      JOIN grants g ON g.grant_id = i.grant_id
      WHERE i.handle_digest = ?
    `).get(digestBearerToken(handle));
    if (!inbox) throw new HeartbeatInboxError("Heartbeat inbox was not found", 404);
    return inbox;
  }

  requireActive(inbox, now) {
    if (inbox.status !== "ACTIVE" || inbox.grant_status !== "ACTIVE") {
      throw new HeartbeatInboxError("Heartbeat inbox is not active", 409);
    }
    if (Date.parse(inbox.expires_at) <= now.getTime() || Date.parse(inbox.grant_expires_at) <= now.getTime()) {
      throw new HeartbeatInboxError("Heartbeat inbox is expired", 409);
    }
  }

  ackResponse(delivery, duplicate) {
    return {
      acknowledged: true,
      duplicate,
      event_id: delivery.event_id,
      run_id: delivery.run_id,
      delivery_id: delivery.delivery_id,
      status: "COMPLETED",
    };
  }

  record(action, correlationId, outcome, details) {
    this.trace?.record({
      correlation_id: correlationId,
      component: "receiver_inbox",
      action,
      workflow_id: WORKFLOW_ID,
      ...(details.grant_id ? { grant_id: details.grant_id } : {}),
      ...(details.event_id ? { event_id: details.event_id } : {}),
      ...(details.run_id ? { run_id: details.run_id } : {}),
      outcome,
      details,
    });
  }
}

export class HeartbeatInboxError extends Error {
  constructor(message, statusCode = 422) {
    super(message);
    this.name = "HeartbeatInboxError";
    this.statusCode = statusCode;
  }
}

function requireText(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096) {
    throw new TypeError(`${field} must be a bounded non-empty string`);
  }
}
