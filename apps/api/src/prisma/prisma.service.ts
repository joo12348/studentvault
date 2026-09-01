import * as dns from "dns";
// Force IPv4 — Render free has no IPv6 egress (ENETUNREACH 2406:da12:...:5432)
try { dns.setDefaultResultOrder("ipv4first"); } catch {}
// Monkey-patch dns.lookup to always use family 4 (pg/PrismaPg ignores defaultResultOrder in some Node versions)
const _origLookup = dns.lookup;
(dns as any).lookup = (hostname: string, opts: any, cb: any) => {
  if (typeof opts === "function") { cb = opts; opts = {}; }
  if (typeof opts === "number") opts = { family: opts };
  // Force IPv4 unless explicitly requested otherwise
  const family = opts?.family ? opts.family : 4;
  return _origLookup(hostname, { ...opts, family }, cb);
};
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
