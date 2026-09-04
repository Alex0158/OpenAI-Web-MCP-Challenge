import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { requireSession } from "../authentication/session";
import { developerCredentialsSchema } from "../authentication/schemas";
import {
  getCurrentDeveloper,
  loginDeveloper,
  logoutDeveloper,
  registerDeveloper,
} from "./developer-auth.controller";

export const developerAuthRouter = Router();

developerAuthRouter.post(
  "/register",
  authRateLimiter,
  validateBody(developerCredentialsSchema),
  registerDeveloper
);
developerAuthRouter.post(
  "/login",
  authRateLimiter,
  validateBody(developerCredentialsSchema),
  loginDeveloper
);
developerAuthRouter.get("/me", requireSession("developer"), getCurrentDeveloper);
developerAuthRouter.post("/logout", logoutDeveloper);
