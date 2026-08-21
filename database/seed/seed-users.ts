import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const url = process.env.DATABASE_URL!;

async function main() {
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter });

  const csDept = await prisma.department.findUnique({ where: { code: "CS" } });
  const csBatch = await prisma.batch.findFirst({ where: { departmentId: csDept!.id } });
  const hash = await bcrypt.hash("AdminPass123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@studentvault.com" },
    update: {},
    create: {
      email: "admin@studentvault.com",
      passwordHash: hash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      facultyProfile: {
        create: { firstName: "Admin", lastName: "User", departmentId: csDept!.id },
      },
    },
  });
  console.log("Admin:", admin.email);

  const test = await prisma.user.upsert({
    where: { email: "test@apple.com" },
    update: {},
    create: {
      email: "test@apple.com",
      passwordHash: hash,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      studentProfile: {
        create: {
          firstName: "Test",
          lastName: "Student",
          departmentId: csDept!.id,
          batchId: csBatch!.id,
          semester: 1,
          enrollmentNumber: "CS2025001",
        },
      },
    },
  });
  console.log("Student:", test.email);

  const fHash = await bcrypt.hash("FacultyPass123!", 10);
  const faculty = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      passwordHash: fHash,
      role: "FACULTY",
      status: "ACTIVE",
      emailVerified: true,
      facultyProfile: {
        create: {
          firstName: "Dr. Sarah",
          lastName: "Johnson",
          departmentId: csDept!.id,
          designation: "Associate Professor",
        },
      },
    },
  });
  console.log("Faculty:", faculty.email);

  await prisma.$disconnect();
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
