import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AcademicsService } from "./academics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller()
@UseGuards(JwtAuthGuard)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get("departments")
  async listDepartments(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.academicsService.getDepartments({ page, limit });
  }

  @Post("departments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createDepartment(
    @Body("name") name: string,
    @Body("code") code: string,
    @Body("description") description?: string
  ) {
    return this.academicsService.createDepartment(name, code, description);
  }

  @Get("batches")
  async listBatches(
    @Query("departmentId") departmentId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.academicsService.getBatches({ departmentId, page, limit });
  }

  @Post("batches")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createBatch(
    @Body("name") name: string,
    @Body("departmentId") departmentId: string,
    @Body("startYear") startYear: number,
    @Body("endYear") endYear: number
  ) {
    return this.academicsService.createBatch(name, departmentId, startYear, endYear);
  }

  @Get("subjects")
  async listSubjects(
    @Query("departmentId") departmentId?: string,
    @Query("batchId") batchId?: string,
    @Query("semesterId") semesterId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.academicsService.getSubjects({ departmentId, batchId, semesterId, page, limit });
  }

  @Post("subjects")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSubject(
    @Body("name") name: string,
    @Body("code") code: string,
    @Body("departmentId") departmentId: string
  ) {
    return this.academicsService.createSubject(name, code, departmentId);
  }

  @Get("semesters")
  async listSemesters(
    @Query("batchId") batchId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.academicsService.getSemesters({ batchId, page, limit });
  }

  @Post("semesters")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSemester(
    @Body("batchId") batchId: string,
    @Body("number") number: number
  ) {
    return this.academicsService.createSemester(batchId, number);
  }
}