import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  Req,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("uploads")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("initiate")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  async initiateUpload(
    @Body() body: { fileName: string; fileSize: number; mimeType: string },
    @CurrentUser() user: { sub: string },
  ) {
    return this.filesService.initiateUpload(
      body.fileName,
      body.fileSize,
      body.mimeType,
      user.sub,
    );
  }

  @Post("complete")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  async completeUpload(
    @Body() body: { uploadId: string; checksum: string },
  ) {
    return this.filesService.completeUpload(body.uploadId, body.checksum);
  }

  @Get(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  async getUpload(@Param("id", ParseUUIDPipe) id: string) {
    return this.filesService.getUpload(id);
  }

  @Put("local/:objectKey(*)")
  @HttpCode(HttpStatus.OK)
  @UseGuards()
  async uploadLocalFile(
    @Param("objectKey") objectKey: string,
    @Req() req: any,
  ) {
    if (!this.filesService.isLocalFs()) {
      throw new Error("Local file upload not available");
    }
    const uploadDir = require("path").join(
      require("os").tmpdir(),
      "studentvault-storage",
      "studentvault",
    );
    const filePath = require("path").join(require("os").tmpdir(), "studentvault-storage", "studentvault", objectKey);
    // req is already a readable stream in Express
    const nodeStream = req as any;
    const chunks = [];
    for await (const chunk of nodeStream) {
      chunks.push(chunk);
    }
    await require("fs").promises.mkdir(require("path").dirname(filePath), { recursive: true });
    await require("fs").promises.writeFile(filePath, Buffer.concat(chunks));
    return { success: true, objectKey };
  }

  @Get("local/:objectKey(*)")
  @UseGuards()
  async getLocalFile(
    @Param("objectKey") objectKey: string,
    @Res() res: any,
  ) {
    if (!this.filesService.isLocalFs()) {
      throw new Error("Local file upload not available");
    }
    const filePath = require("path").join(
      require("os").tmpdir(),
      "studentvault-storage",
      "studentvault",
      objectKey,
    );
    const fs = require("fs");
    try {
      await fs.promises.access(filePath);
    } catch {
      throw new NotFoundException("File not found");
    }
    res.sendFile(filePath);
  }
}