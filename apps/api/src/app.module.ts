import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { CollectionsModule } from "./modules/collections/collections.module";
import { AcademicsModule } from "./modules/academics/academics.module";
import { ModerationModule } from "./modules/moderation/moderation.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { FilesModule } from "./modules/files/files.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ResourcesModule,
    CollectionsModule,
    AcademicsModule,
    ModerationModule,
    AnalyticsModule,
    FilesModule,
  ],
})
export class AppModule {}
