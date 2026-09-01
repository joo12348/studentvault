import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", timestamp: new Date().toISOString(), db: "up" };
    } catch (e) {
      return { status: "error", timestamp: new Date().toISOString(), db: "down", error: String(e) };
    }
  }
}
