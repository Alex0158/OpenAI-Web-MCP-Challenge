import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export function validateProtocolBody(schema: ZodType) {
  return function validateProtocolBodyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: { code: "http_body_invalid" } });
    }
    req.body = result.data;
    next();
  };
}
