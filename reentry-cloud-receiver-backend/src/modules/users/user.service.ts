import { prisma } from "../../db";
import type { UserAccount } from "@prisma/client";
import type { PublicUser } from "@saas/shared";

class UserService {
  async findById(id: string): Promise<UserAccount | null> {
    return prisma.userAccount.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return prisma.userAccount.findUnique({ where: { email } });
  }

  async create(email: string, passwordHash: string): Promise<UserAccount> {
    return prisma.userAccount.create({
      data: { email, passwordHash },
    });
  }

  toPublic(user: UserAccount): PublicUser {
    return {
      id: user.id,
      email: user.email,
    };
  }
}

export const userService = new UserService();
