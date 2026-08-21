import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class AddItemDto {
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @IsOptional()
  @IsString()
  note?: string;
}