import { Router } from "express";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { requireSession } from "../authentication/session";
import { userCredentialsSchema } from "../authentication/schemas";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "./user-auth.controller";

export const userAuthRouter = Router();

userAuthRouter.post("/register", authRateLimiter, validateBody(userCredentialsSchema), registerUser);
userAuthRouter.post("/login", authRateLimiter, validateBody(userCredentialsSchema), loginUser);
userAuthRouter.get("/me", requireSession("user"), getCurrentUser);
userAuthRouter.post("/logout", logoutUser);
