import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CollectionsService } from "./collections.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { AddItemDto } from "./dto/add-item.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("collections")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async findAll(@CurrentUser() user: { sub: string }) {
    return this.collectionsService.findAll(user.sub);
  }

  @Post()
  async create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateCollectionDto
  ) {
    return this.collectionsService.create(user.sub, dto);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: Partial<CreateCollectionDto>
  ) {
    return this.collectionsService.update(id, user.sub, dto);
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.collectionsService.delete(id, user.sub);
  }

  @Post(":id/items")
  async addItem(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: AddItemDto
  ) {
    return this.collectionsService.addItem(id, user.sub, dto);
  }

  @Delete(":id/items/:resourceId")
  async removeItem(
    @Param("id") id: string,
    @Param("resourceId") resourceId: string,
    @CurrentUser() user: { sub: string }
  ) {
    return this.collectionsService.removeItem(id, resourceId, user.sub);
  }
}
