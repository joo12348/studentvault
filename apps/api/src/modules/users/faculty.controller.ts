import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("faculty")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FACULTY, UserRole.ADMIN)
export class FacultyController {
  constructor(private readonly usersService: UsersService) {}

  @Get("students")
  async getStudents(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("departmentId") departmentId?: string,
  ) {
    return this.usersService.findAll({
      role: "STUDENT",
      departmentId,
      page,
      limit,
    });
  }
}