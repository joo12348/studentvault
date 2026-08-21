import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as crypto from "crypto";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { MinioClientService } from "./minio-client.service";
import { ResourcesService } from "../resources/resources.service";

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly minio: MinioClientService,
    @Inject(forwardRef(() => ResourcesService))
    private readonly resourcesService: ResourcesService,
  ) {}

  async initiateUpload(
    fileName: string,
    fileSize: number,
    mimeType: string,
    uploaderId: string,
  ) {
    const uploadId = uuidv4();
    const extension = path.extname(fileName);
    const objectKey = `uploads/${uploadId}${extension}`;

    // Create upload record in database
    const upload = await this.prisma.upload.create({
      data: {
        id: uploadId,
        fileName,
        fileSize,
        mimeType,
        objectKey,
        uploaderId,
        status: "PENDING",
      },
    });

    // Generate presigned URL for upload
    const uploadUrl = await this.minio.getPresignedPutUrl(objectKey, 3600); // 1 hour

    return {
      uploadId: upload.id,
      uploadUrl,
      objectKey,
      expiresIn: 3600,
    };
  }

  async completeUpload(uploadId: string, checksum: string) {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      throw new NotFoundException("Upload not found");
    }

    // Verify file exists in MinIO
    const exists = await this.minio.objectExists(upload.objectKey);
    if (!exists) {
      throw new InternalServerErrorException("File not found in storage");
    }

    // Verify checksum if provided
    if (checksum) {
      const actualChecksum = await this.minio.getObjectChecksum(upload.objectKey);
      if (actualChecksum !== checksum) {
        throw new InternalServerErrorException("Checksum mismatch");
      }
    }

    // Update upload status
    await this.prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: "COMPLETED",
        checksum,
        completedAt: new Date(),
      },
    });

    return {
      uploadId: upload.id,
      objectKey: upload.objectKey,
      status: "COMPLETED",
    };
  }

  async getUpload(id: string) {
    const upload = await this.prisma.upload.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, email: true },
        },
      },
    });

    if (!upload) {
      throw new NotFoundException("Upload not found");
    }

    return upload;
  }

  async getPresignedGetUrl(objectKey: string, expiresIn = 3600) {
    return this.minio.getPresignedGetUrl(objectKey, expiresIn);
  }

  isLocalFs(): boolean {
    return this.minio.isLocalFs();
  }
}