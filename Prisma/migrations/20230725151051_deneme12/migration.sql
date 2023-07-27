-- DropForeignKey
ALTER TABLE "tweet" DROP CONSTRAINT "tweet_originalTweetId_fkey";

-- AlterTable
ALTER TABLE "tweet" ALTER COLUMN "originalTweetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tweet" ADD CONSTRAINT "tweet_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
