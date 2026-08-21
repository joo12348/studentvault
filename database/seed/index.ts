import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://studentvault_user:studentvault_pass@localhost:5432/studentvault";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const departments = [
  { name: "Computer Science", code: "CS", description: "Computer Science & Engineering" },
  { name: "Electronics", code: "EC", description: "Electronics & Communication Engineering" },
  { name: "Mechanical", code: "ME", description: "Mechanical Engineering" },
  { name: "Civil", code: "CE", description: "Civil Engineering" },
  { name: "Electrical", code: "EE", description: "Electrical Engineering" },
];

const subjectsByDept: Record<string, string[]> = {
  CS: [
    "Data Structures",
    "Algorithms",
    "Operating Systems",
    "Database Systems",
    "Computer Networks",
    "Software Engineering",
  ],
  EC: [
    "Analog Circuits",
    "Digital Electronics",
    "Signals & Systems",
    "Microprocessors",
    "Communication Systems",
  ],
  ME: [
    "Thermodynamics",
    "Fluid Mechanics",
    "Machine Design",
    "Manufacturing Processes",
  ],
  CE: [
    "Structural Analysis",
    "Concrete Technology",
    "Geotechnical Engineering",
    "Surveying",
  ],
  EE: [
    "Circuit Theory",
    "Power Systems",
    "Control Systems",
    "Electrical Machines",
  ],
};

async function main() {
  const now = new Date();
  const startYear = now.getFullYear() - 1;

  console.log("Seeding departments...");
  const deptRecords: Record<string, string> = {};
  for (const dept of departments) {
    const existing = await prisma.department.findUnique({
      where: { code: dept.code },
    });
    if (existing) {
      deptRecords[dept.code] = existing.id;
      console.log(`  ${dept.code} already exists`);
      continue;
    }
    const created = await prisma.department.create({ data: dept });
    deptRecords[dept.code] = created.id;
    console.log(`  Created ${dept.code}`);
  }

  console.log("Seeding batches...");
  const batchRecords: Record<string, string> = {};
  for (const [code, id] of Object.entries(deptRecords)) {
    const batchName = `${code}-A ${startYear}-${startYear + 4}`;
    const existing = await prisma.batch.findFirst({
      where: { departmentId: id, name: batchName },
    });
    if (existing) {
      batchRecords[code] = existing.id;
      continue;
    }
    const created = await prisma.batch.create({
      data: {
        name: batchName,
        departmentId: id,
        startYear,
        endYear: startYear + 4,
      },
    });
    batchRecords[code] = created.id;
    console.log(`  Created ${batchName}`);
  }

  console.log("Seeding subjects...");
  const subjectRecords: Record<string, string> = {};
  for (const [code, subjects] of Object.entries(subjectsByDept)) {
    const deptId = deptRecords[code];
    for (const name of subjects) {
      const subjCode = `${code}${String(Object.keys(subjectRecords).length + 1).padStart(3, "0")}`;
      const existing = await prisma.subject.findUnique({
        where: { departmentId_code: { departmentId: deptId, code: subjCode } },
      });
      if (existing) continue;
      const created = await prisma.subject.create({
        data: { name, code: subjCode, departmentId: deptId },
      });
      subjectRecords[name] = created.id;
      console.log(`  ${name} (${subjCode})`);
    }
  }

  console.log("Seeding semesters...");
  for (const [code, batchId] of Object.entries(batchRecords)) {
    for (let n = 1; n <= 8; n++) {
      const existing = await prisma.semester.findUnique({
        where: { batchId_number: { batchId, number: n } },
      });
      if (existing) continue;
      await prisma.semester.create({
        data: {
          batchId,
          number: n,
          isActive: n === 1,
          startDate: new Date(startYear + Math.floor((n - 1) / 2), (n - 1) % 2 === 0 ? 6 : 0, 1),
        },
      });
      console.log(`  ${code} Semester ${n}`);
    }
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });