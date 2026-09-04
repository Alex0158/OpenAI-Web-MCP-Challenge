import type { DeveloperAccount } from "@prisma/client";
import type { PublicDeveloper } from "@saas/shared";
import { prisma } from "../../db";

class DeveloperService {
  async findById(id: string): Promise<DeveloperAccount | null> {
    return prisma.developerAccount.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<DeveloperAccount | null> {
    return prisma.developerAccount.findUnique({ where: { email } });
  }

  async create(email: string, passwordHash: string): Promise<DeveloperAccount> {
    return prisma.developerAccount.create({
      data: { email, passwordHash },
    });
  }

  toPublic(developer: DeveloperAccount): PublicDeveloper {
    return {
      id: developer.id,
      email: developer.email,
    };
  }
}

export const developerService = new DeveloperService();
