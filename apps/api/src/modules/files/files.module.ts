import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { MinioClientService } from "./minio-client.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { ResourcesModule } from "../resources/resources.module";

@Module({
  imports: [PrismaModule, ResourcesModule],
  controllers: [FilesController],
  providers: [FilesService, MinioClientService],
  exports: [FilesService, MinioClientService],
})
export class FilesModule {}