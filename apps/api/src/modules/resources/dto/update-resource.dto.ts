import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
} from "class-validator";
import { ResourceType } from "@prisma/client";

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  unit?: number;

  @IsOptional()
  @IsString()
  visibility?: string;
}
