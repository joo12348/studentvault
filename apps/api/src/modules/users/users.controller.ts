import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, UserStatus } from "@prisma/client";

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser() user: { sub: string }) {
    return this.usersService.getMe(user.sub);
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get("students/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  async getStudent(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Get("admin/users")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listUsers(
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("departmentId") departmentId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.usersService.findAll({
      role,
      status,
      departmentId,
      page,
      limit,
    });
  }

  @Patch("admin/users/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param("id") id: string,
    @Body() body: { status?: UserStatus; role?: UserRole }
  ) {
    return this.usersService.updateUser(id, body);
  }

  @Post("admin/users/:id/activate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async activateUser(@Param("id") id: string) {
    return this.usersService.updateUser(id, { status: UserStatus.ACTIVE });
  }

  @Post("admin/users/:id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivateUser(@Param("id") id: string) {
    return this.usersService.updateUser(id, { status: UserStatus.INACTIVE });
  }

  @Get("admin/reports")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listReports(
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.usersService.getReports({ status, page, limit });
  }

  @Patch("admin/reports/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateReport(
    @Param("id") id: string,
    @Body() body: { status?: string; notes?: string }
  ) {
    return this.usersService.updateReport(id, body);
  }

  @Get("admin/analytics")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnalytics() {
    return this.usersService.getAnalytics();
  }
}
