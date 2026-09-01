import * as dns from "dns";
try { dns.setDefaultResultOrder("ipv4first"); } catch {}
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
    try {
      await this.$connect();
      console.log("✅ Database connected");
    } catch (err) {
      console.error("❌ Database connection failed on init — API will stay up for health check:", (err as Error).message);
      // Don't crash — health endpoint will report db:down, and requests will fail gracefully
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
