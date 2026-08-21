import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { FacultyController } from "./faculty.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, FacultyController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
