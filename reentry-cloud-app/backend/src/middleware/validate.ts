import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { err } from "../lib/response-helpers";

/**
 * Validates req.body against a zod schema before the handler runs.
 *
 * On success the parsed value REPLACES req.body, so handlers receive data that
 * is already trimmed, lowercased, and correctly typed — they never re-check it.
 * On failure the request stops here with a 400 and never reaches the handler.
 */
export function validateBody(schema: ZodType) {
  return function validateBodyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const field = firstIssue.path.join(".");
      const message = field ? `${field}: ${firstIssue.message}` : firstIssue.message;
      return res.status(400).json(err("VALIDATION_ERROR", message));
    }

    req.body = result.data;
    next();
  };
}
