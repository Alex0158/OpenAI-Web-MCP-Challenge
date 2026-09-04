import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so a rejected promise becomes next(error)
 * instead of an unhandled rejection (which terminates the Node process).
 *
 * Express 4 calls handlers inside a try/catch, but try/catch only catches
 * throws that happen while it is running. An async handler returns a pending
 * promise immediately, so by the time it rejects the try block has already
 * finished and nobody is watching. Attaching .catch to the promise itself
 * works no matter how much later the failure arrives.
 *
 * Usage:
 *   router.post("/", asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return function wrappedHandler(req: Request, res: Response, next: NextFunction) {
    // An async handler returns a promise. A normal one returns undefined,
    // which Promise.resolve turns into an already-resolved promise, so the
    // same wrapper is safe for both.
    const result = handler(req, res, next);
    Promise.resolve(result).catch(next);
  };
}
