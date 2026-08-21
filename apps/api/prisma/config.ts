// Prisma configuration for StudentVault API
// DATABASE_URL must be set in the environment

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasource: {
    url: "postgresql://studentvault_user:studentvault_pass@localhost:5432/studentvault",
  },
});

export default prisma;