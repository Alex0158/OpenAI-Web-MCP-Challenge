import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { hashPassword, verifyPassword } from "../../lib/password";
import { isUniqueConstraintError } from "../../lib/prisma-errors";
import { err, ok } from "../../lib/response-helpers";
import { clearSessionCookie, setSessionCookie } from "../authentication/session";
import type { DeveloperCredentials } from "../authentication/schemas";
import { developerService } from "./developer.service";

export const registerDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as DeveloperCredentials;

  try {
    const developer = await developerService.create(email, await hashPassword(password));
    setSessionCookie(res, "developer", developer.id);
    return res.status(201).json(ok(developerService.toPublic(developer), "Developer account created."));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json(err("EMAIL_IN_USE", "That email is already registered."));
    }
    throw error;
  }
});

export const loginDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as DeveloperCredentials;
  const developer = await developerService.findByEmail(email);

  if (!developer || !(await verifyPassword(password, developer.passwordHash))) {
    return res.status(401).json(err("INVALID_CREDENTIALS", "Email or password is incorrect."));
  }

  setSessionCookie(res, "developer", developer.id);
  return res.json(ok(developerService.toPublic(developer), "Signed in."));
});

export const getCurrentDeveloper = asyncHandler(async (req: Request, res: Response) => {
  const accountId = req.auth?.accountId;
  const developer = accountId ? await developerService.findById(accountId) : null;

  if (!developer) {
    clearSessionCookie(res, "developer");
    return res.status(401).json(err("UNAUTHORIZED", "Sign in required"));
  }

  return res.json(ok(developerService.toPublic(developer)));
});

export const logoutDeveloper = asyncHandler(async (_req: Request, res: Response) => {
  clearSessionCookie(res, "developer");
  return res.json(ok(null, "Signed out."));
});
