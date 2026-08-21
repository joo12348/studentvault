import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl =
      process.env.DATABASE_URL ||
      "postgresql://studentvault_user:studentvault_pass@localhost:5432/studentvault";
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase") || databaseUrl.includes("sslmode")
        ? { rejectUnauthorized: false }
        : undefined,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
