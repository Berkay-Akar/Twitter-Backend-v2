/*
  Warnings:

  - You are about to drop the column `userId` on the `tweet` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `tweet` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tweet" DROP CONSTRAINT "tweet_userId_fkey";

-- AlterTable
ALTER TABLE "tweet" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "tweet" ADD CONSTRAINT "tweet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
