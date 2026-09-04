import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { hashPassword, verifyPassword } from "../../lib/password";
import { isUniqueConstraintError } from "../../lib/prisma-errors";
import { err, ok } from "../../lib/response-helpers";
import { clearSessionCookie, setSessionCookie } from "../authentication/session";
import type { UserCredentials } from "../authentication/schemas";
import { userService } from "./user.service";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as UserCredentials;

  try {
    const user = await userService.create(email, await hashPassword(password));
    setSessionCookie(res, "user", user.id);
    return res.status(201).json(ok(userService.toPublic(user), "User account created."));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json(err("EMAIL_IN_USE", "That email is already registered."));
    }
    throw error;
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as UserCredentials;
  const user = await userService.findByEmail(email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json(err("INVALID_CREDENTIALS", "Email or password is incorrect."));
  }

  setSessionCookie(res, "user", user.id);
  return res.json(ok(userService.toPublic(user), "Signed in."));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const accountId = req.auth?.accountId;
  const user = accountId ? await userService.findById(accountId) : null;

  if (!user) {
    clearSessionCookie(res, "user");
    return res.status(401).json(err("UNAUTHORIZED", "Sign in required"));
  }

  return res.json(ok(userService.toPublic(user)));
});

export const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
  clearSessionCookie(res, "user");
  return res.json(ok(null, "Signed out."));
});
