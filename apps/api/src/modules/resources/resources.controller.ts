import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ResourcesService } from "./resources.service";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("resources")
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { sub: string; role: string },
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("subjectId") subjectId?: string,
    @Query("semesterId") semesterId?: string,
    @Query("resourceType") resourceType?: string,
    @Query("departmentId") departmentId?: string,
    @Query("year") year?: number,
    @Query("topic") topic?: string,
    @Query("sortBy") sortBy?: string
  ) {
    return this.resourcesService.findAll(user.sub, user.role, {
      page,
      limit,
      search,
      subjectId,
      semesterId,
      resourceType,
      departmentId,
      year,
      topic,
      sortBy,
    });
  }

  @Get("my")
  async getMyResources(
    @CurrentUser() user: { sub: string },
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.resourcesService.getMyResources(user.sub, { page, limit });
  }

  @Get("faculty")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  async getFacultyResources(
    @CurrentUser() user: { sub: string; role: UserRole },
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.resourcesService.getMyResources(user.sub, { page, limit });
  }

  @Get("moderation")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getModeration(
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.resourcesService.getPendingResources({ page, limit });
  }

  @Get("bookmarks")
  async getBookmarks(@CurrentUser() user: { sub: string }) {
    return this.resourcesService.getBookmarks(user.sub);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.resourcesService.findById(id);
  }

  @Post(":id/bookmark")
  async addBookmark(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.resourcesService.addBookmark(user.sub, id);
  }

  @Delete(":id/bookmark")
  async removeBookmark(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.resourcesService.removeBookmark(user.sub, id);
  }

  @Post(":id/rating")
  async rateResource(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { score: number; comment?: string }
  ) {
    return this.resourcesService.rateResource(user.sub, id, body.score, body.comment);
  }

  @Delete(":id/rating")
  async deleteRating(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.resourcesService.deleteRating(user.sub, id);
  }

  @Post(":id/report")
  async reportResource(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { reason: string; description?: string }
  ) {
    return this.resourcesService.reportResource(user.sub, id, body.reason, body.description);
  }

  @Post()
  async create(
    @CurrentUser() user: { sub: string; role: string },
    @Body() dto: CreateResourceDto
  ) {
    return this.resourcesService.create(user.sub, user.role, dto);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string; role: string },
    @Body() dto: UpdateResourceDto
  ) {
    return this.resourcesService.update(id, user.sub, user.role, dto);
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string; role: string }
  ) {
    return this.resourcesService.delete(id, user.sub, user.role);
  }

  @Get(":id/download")
  async download(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.resourcesService.getDownloadUrl(id, user.sub);
  }

  @Get(":id/engagement")
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  async getEngagement(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.resourcesService.getEngagement(id, user.sub);
  }

  @Post(":id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveResource(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    await this.resourcesService.approveResource(id, user.sub);
    return { message: "Resource approved successfully" };
  }

  @Post(":id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectResource(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { reason: string }
  ) {
    await this.resourcesService.rejectResource(id, user.sub, body.reason);
    return { message: "Resource rejected successfully" };
  }
}
