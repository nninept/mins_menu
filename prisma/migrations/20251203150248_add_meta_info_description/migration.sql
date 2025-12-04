/*
  Warnings:

  - You are about to drop the column `extraDescription` on the `MenuItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "extraDescription",
ADD COLUMN     "metaInfoDescription" TEXT,
ALTER COLUMN "stock" SET DEFAULT 0;
