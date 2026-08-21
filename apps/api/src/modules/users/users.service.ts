import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserStatus, UserRole } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            department: true,
            batch: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.studentProfile || user.facultyProfile,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role === "STUDENT") {
      return this.prisma.studentProfile.update({
        where: { userId },
        data: dto,
        include: {
          department: true,
          batch: true,
        },
      });
    }

    if (user.role === "FACULTY") {
      return this.prisma.facultyProfile.update({
        where: { userId },
        data: dto,
        include: {
          department: true,
        },
      });
    }

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: {
          include: {
            department: true,
            batch: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findAll(params: {
    role?: string;
    status?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, status, departmentId, page = 1, limit = 20 } = params;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const where: Record<string, unknown> = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (departmentId) {
      where.OR = [
        { studentProfile: { departmentId } },
        { facultyProfile: { departmentId } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          studentProfile: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              batchId: true,
            },
          },
          facultyProfile: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
            },
          },
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async updateUser(
    id: string,
    data: { status?: UserStatus; role?: UserRole }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updateData: {
      status?: UserStatus;
      role?: UserRole;
    } = {};
    if (data.status) updateData.status = data.status;
    if (data.role) updateData.role = data.role;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async getReports(params: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true } },
          resource: { select: { id: true, title: true } },
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async updateReport(id: string, data: { status?: string; notes?: string }) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Report not found");
    return this.prisma.report.update({
      where: { id },
      data: { status: data.status as any, resolution: data.notes },
    });
  }

  async getAnalytics() {
    const [totalUsers, totalResources, totalDownloads, totalViews, usersByRole, resourcesByType] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.resource.count(),
        this.prisma.resource.aggregate({ _sum: { downloadCount: true } }),
        this.prisma.resource.aggregate({ _sum: { viewCount: true } }),
        this.prisma.user.groupBy({ by: ["role"], _count: true }),
        this.prisma.resource.groupBy({ by: ["resourceType"], _count: true }),
      ]);

    return {
      totalUsers,
      totalResources,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      totalViews: totalViews._sum.viewCount || 0,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
      resourcesByType: resourcesByType.map((r) => ({ type: r.resourceType, count: r._count })),
    };
  }
}
