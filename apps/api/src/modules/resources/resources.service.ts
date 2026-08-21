import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { ResourceStatus, UserRole } from "@prisma/client";

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    userRole: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      subjectId?: string;
      semesterId?: string;
      resourceType?: string;
      departmentId?: string;
      year?: number;
      topic?: string;
      sortBy?: string;
    }
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      subjectId,
      semesterId,
      resourceType,
      departmentId,
      year,
      topic,
      sortBy = "newest",
    } = params;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const where: Record<string, unknown> = {
      status: ResourceStatus.APPROVED,
    };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } },
      ];
    }

    if (subjectId) where.subjectId = subjectId;
    if (semesterId) where.semesterId = semesterId;
    if (resourceType) where.resourceType = resourceType;
    if (departmentId) where.departmentId = departmentId;
    if (year) where.year = year;
    if (topic) where.topic = { contains: topic, mode: "insensitive" };

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        include: {
          subject: true,
          semester: true,
          department: true,
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: resources,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async create(userId: string, userRole: string, dto: CreateResourceDto) {
    // Always set PENDING_REVIEW for moderation workflow
    // Faculty uploads wait for admin approval before students can download
    const initialStatus = ResourceStatus.PENDING_REVIEW;

    const resource = await this.prisma.resource.create({
      data: {
        title: dto.title,
        description: dto.description,
        resourceType: dto.resourceType,
        uploaderId: userId,
        departmentId: dto.departmentId,
        batchId: dto.batchId,
        semesterId: dto.semesterId,
        subjectId: dto.subjectId,
        topic: dto.topic,
        year: dto.year,
        unit: dto.unit,
        fileUrl: dto.storageKey,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        checksum: dto.checksum,
        status: initialStatus,
        visibility: dto.visibility || "batch",
      },
      include: {
        subject: true,
        semester: true,
        department: true,
      },
    });

    // Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "UPLOAD",
        entity: "resource",
        entityId: resource.id,
        details: { title: dto.title, resourceType: dto.resourceType },
      },
    });

    return resource;
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateResourceDto
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    // Check ownership or admin
    if (resource.uploaderId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Not authorized to update this resource");
    }

    return this.prisma.resource.update({
      where: { id },
      data: dto,
      include: {
        subject: true,
        semester: true,
        department: true,
      },
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    if (resource.uploaderId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Not authorized to delete this resource");
    }

    // Soft delete (archive)
    await this.prisma.resource.update({
      where: { id },
      data: { status: ResourceStatus.ARCHIVED },
    });

    // Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        entity: "resource",
        entityId: id,
      },
    });

    return { message: "Resource archived successfully" };
  }

  async getDownloadUrl(id: string, userId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    if (resource.status !== ResourceStatus.APPROVED) {
      throw new ForbiddenException("Resource is not approved");
    }

    // Record download event
    await this.prisma.resourceDownload.create({
      data: {
        userId,
        resourceId: id,
      },
    });

    // Increment download count
    await this.prisma.resource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // TODO: Generate signed URL from object storage
    return {
      downloadUrl: `http://localhost:3001/api/v1/uploads/local/${resource.fileUrl}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  async getMyResources(userId: string, params: { page?: number; limit?: number }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where: { uploaderId: userId },
        include: {
          subject: true,
          semester: true,
          department: true,
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.resource.count({
        where: { uploaderId: userId },
      }),
    ]);

    return {
      data: resources,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async getEngagement(resourceId: string, userId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    if (resource.uploaderId !== userId) {
      throw new ForbiddenException("Not authorized to view engagement");
    }

    const [uniqueViewers, uniqueDownloaders, bookmarks, ratings] =
      await Promise.all([
        this.prisma.resourceView.findMany({
          where: { resourceId },
          select: { userId: true },
          distinct: ["userId"],
        }),
        this.prisma.resourceDownload.findMany({
          where: { resourceId },
          select: { userId: true },
          distinct: ["userId"],
        }),
        this.prisma.bookmark.count({
          where: { resourceId },
        }),
        this.prisma.rating.aggregate({
          where: { resourceId },
          _avg: { score: true },
          _count: { score: true },
        }),
      ]);

    return {
      resourceId,
      totalViews: resource.viewCount,
      uniqueViewers: uniqueViewers.length,
      totalDownloads: resource.downloadCount,
      uniqueDownloaders: uniqueDownloaders.length,
      bookmarks,
      ratingAverage: ratings._avg.score || 0,
      ratingCount: ratings._count.score || 0,
    };
  }

  async findById(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    return resource;
  }

  async approveResource(resourceId: string, adminId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    if (resource.status !== ResourceStatus.PENDING_REVIEW) {
      throw new BadRequestException("Resource is not in pending review state");
    }

    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: ResourceStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    return { message: "Resource approved successfully" };
  }

  async getPendingResources(params: { page?: number; limit?: number }) {
    const pageNumber = params.page ? Number(params.page) : 1;
    const limitNumber = params.limit ? Number(params.limit) : 20;

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where: { status: ResourceStatus.PENDING_REVIEW },
        include: {
          subject: true,
          semester: true,
          department: true,
          uploader: true,
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.resource.count({
        where: { status: ResourceStatus.PENDING_REVIEW },
      }),
    ]);

    return {
      data: resources,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async rejectResource(
    resourceId: string,
    adminId: string,
    reason: string
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException("Resource not found");
    }

    if (resource.status !== ResourceStatus.PENDING_REVIEW) {
      throw new BadRequestException("Resource is not in pending review state");
    }

    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: ResourceStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    return { message: "Resource rejected successfully" };
  }

  async addBookmark(userId: string, resourceId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) throw new NotFoundException("Resource not found");

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    });
    if (existing) return existing;

    return this.prisma.bookmark.create({
      data: { userId, resourceId },
    });
  }

  async removeBookmark(userId: string, resourceId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    });
    if (!existing) throw new NotFoundException("Bookmark not found");

    await this.prisma.bookmark.delete({
      where: { id: existing.id },
    });
    return { message: "Bookmark removed" };
  }

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        resource: {
          include: {
            subject: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      data: bookmarks.map((b) => ({ ...b.resource, bookmarkedAt: b.createdAt })),
    };
  }

  async rateResource(
    userId: string,
    resourceId: string,
    score: number,
    comment?: string
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) throw new NotFoundException("Resource not found");
    if (score < 1 || score > 5) {
      throw new BadRequestException("Score must be between 1 and 5");
    }

    const existing = await this.prisma.rating.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    });

    const rating = await this.prisma.rating.upsert({
      where: { userId_resourceId: { userId, resourceId } },
      create: { userId, resourceId, score, comment },
      update: { score, comment },
    });

    // Adjust aggregate counters on the resource
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: existing
        ? {
            ratingSum: { increment: score - existing.score },
          }
        : {
            ratingSum: { increment: score },
            ratingCount: { increment: 1 },
          },
    });

    return rating;
  }

  async deleteRating(userId: string, resourceId: string) {
    const existing = await this.prisma.rating.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    });
    if (!existing) throw new NotFoundException("Rating not found");

    await this.prisma.rating.delete({ where: { id: existing.id } });
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        ratingSum: { decrement: existing.score },
        ratingCount: { decrement: 1 },
      },
    });
    return { message: "Rating removed" };
  }

  async reportResource(
    userId: string,
    resourceId: string,
    reason: string,
    description?: string
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) throw new NotFoundException("Resource not found");

    return this.prisma.report.create({
      data: {
        reporterId: userId,
        resourceId,
        reason,
        description,
      },
    });
  }
}
