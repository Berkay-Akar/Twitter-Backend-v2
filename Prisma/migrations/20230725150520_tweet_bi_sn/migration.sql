/*
  Warnings:

  - Made the column `originalTweetId` on table `tweet` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tweet" DROP CONSTRAINT "tweet_originalTweetId_fkey";

-- AlterTable
ALTER TABLE "tweet" ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "originalTweetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tweet" ADD CONSTRAINT "tweet_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
