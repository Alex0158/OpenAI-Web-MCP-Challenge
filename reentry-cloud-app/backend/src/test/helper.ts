import { prisma } from "../db";

export async function clearTestAccounts(email: string): Promise<void> {
  await prisma.$transaction([
    prisma.userAccount.deleteMany({ where: { email } }),
    prisma.developerAccount.deleteMany({ where: { email } }),
  ]);
}
