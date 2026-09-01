/*
  Warnings:

  - The `skills` column on the `student_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `interests` column on the `student_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[],
DROP COLUMN "interests",
ADD COLUMN     "interests" TEXT[];
