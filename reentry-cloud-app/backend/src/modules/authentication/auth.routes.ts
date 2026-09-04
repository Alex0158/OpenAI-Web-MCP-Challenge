import { Router } from "express";
import { developerAuthRouter } from "../developers/developer-auth.routes";
import { userAuthRouter } from "../users/user-auth.routes";

export const authRouter = Router();

authRouter.use("/users", userAuthRouter);
authRouter.use("/developers", developerAuthRouter);
