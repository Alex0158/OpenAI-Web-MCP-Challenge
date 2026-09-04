import { afterAll } from "@jest/globals";
import { prisma } from "../db";

afterAll(async () => {
  await prisma.$disconnect();
});
