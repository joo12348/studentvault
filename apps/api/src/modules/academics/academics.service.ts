import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  async getDepartments(params: { page?: number; limit?: number }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;
    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { name: "asc" },
      }),
      this.prisma.department.count(),
    ]);
    return {
      data: departments,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createDepartment(name: string, code: string, description?: string) {
    return this.prisma.department.create({
      data: { name, code, description },
    });
  }

  async getBatches(params: {
    departmentId?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;
    const { departmentId } = params;
    const where = departmentId ? { departmentId } : {};
    const [batches, total] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { name: "asc" },
      }),
      this.prisma.batch.count({ where }),
    ]);
    return {
      data: batches,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createBatch(name: string, departmentId: string, startYear: number, endYear: number) {
    return this.prisma.batch.create({
      data: { name, departmentId, startYear, endYear },
    });
  }

  async getSubjects(params: {
    departmentId?: string;
    batchId?: string;
    semesterId?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;
    const { departmentId, batchId, semesterId } = params;
    const where: Record<string, unknown> = {};
    if (departmentId) where.departmentId = departmentId;
    if (batchId) where.batchSubjects = { some: { batchId } };
    if (semesterId) where.semesterSubjects = { some: { semesterId } };

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        include: {
          department: true,
          semesterSubjects: {
            take: 1,
            select: { semester: true },
          },
          batchSubjects: {
            take: 1,
            select: { batch: true },
          },
        },
      }),
      this.prisma.subject.count({ where }),
    ]);
    return {
      data: subjects,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createSubject(name: string, code: string, departmentId: string) {
    return this.prisma.subject.create({
      data: { name, code, departmentId },
    });
  }

  async getSemesters(params: { batchId?: string; page?: number; limit?: number }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;
    const where = params.batchId ? { batchId: params.batchId } : {};
    const [semesters, total] = await Promise.all([
      this.prisma.semester.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { number: "asc" },
      }),
      this.prisma.semester.count({ where }),
    ]);
    return {
      data: semesters,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createSemester(batchId: string, number: number) {
    return this.prisma.semester.create({
      data: { batchId, number },
    });
  }
}