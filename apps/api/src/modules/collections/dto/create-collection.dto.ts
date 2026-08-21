import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}