import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { appConfig } from "../config/config";

const adapter = new PrismaPg({ connectionString: appConfig.databaseUrl });

export const prisma = new PrismaClient({ adapter });
