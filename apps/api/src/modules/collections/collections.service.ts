import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { AddItemDto } from "./dto/add-item.dto";

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            resource: {
              select: {
                id: true,
                title: true,
                resourceType: true,
                fileName: true,
                fileSize: true,
                ratingSum: true,
                ratingCount: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic || false,
      },
    });
  }

  async update(id: string, userId: string, dto: Partial<CreateCollectionDto>) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException("Collection not found");
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException("Not authorized to update this collection");
    }

    return this.prisma.collection.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException("Collection not found");
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException("Not authorized to delete this collection");
    }

    await this.prisma.collection.delete({
      where: { id },
    });

    return { message: "Collection deleted successfully" };
  }

  async addItem(collectionId: string, userId: string, dto: AddItemDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException("Collection not found");
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException("Not authorized to modify this collection");
    }

    // Check if item already exists
    const existingItem = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_resourceId: {
          collectionId,
          resourceId: dto.resourceId,
        },
      },
    });

    if (existingItem) {
      throw new ForbiddenException("Resource already in collection");
    }

    // Get next sort order
    const lastItem = await this.prisma.collectionItem.findFirst({
      where: { collectionId },
      orderBy: { sortOrder: "desc" },
    });

    const nextSortOrder = (lastItem?.sortOrder || 0) + 1;

    return this.prisma.collectionItem.create({
      data: {
        collectionId,
        resourceId: dto.resourceId,
        note: dto.note,
        sortOrder: nextSortOrder,
      },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            resourceType: true,
            fileName: true,
          },
        },
      },
    });
  }

  async removeItem(collectionId: string, resourceId: string, userId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException("Collection not found");
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException("Not authorized to modify this collection");
    }

    await this.prisma.collectionItem.deleteMany({
      where: {
        collectionId,
        resourceId,
      },
    });

    return { message: "Item removed from collection" };
  }
}
