import { PrismaClient, type Prisma } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const env = process.env as {
  DATABASE_URL: string;
  [key: string]: string | undefined;
};

const prisma = new PrismaClient({
  datasource: {
    url: env.DATABASE_URL,
  },
});

export default prisma;