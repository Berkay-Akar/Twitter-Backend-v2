/*
  Warnings:

  - You are about to drop the `tweets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tweet_likes" DROP CONSTRAINT "tweet_likes_tweet_id_fkey";

-- DropForeignKey
ALTER TABLE "tweet_retweet" DROP CONSTRAINT "tweet_retweet_tweet_id_fkey";

-- DropForeignKey
ALTER TABLE "tweets" DROP CONSTRAINT "tweets_parentId_fkey";

-- DropForeignKey
ALTER TABLE "tweets" DROP CONSTRAINT "tweets_user_id_fkey";

-- DropTable
DROP TABLE "tweets";

-- CreateTable
CREATE TABLE "tweet" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "retweet_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "originalTweetId" INTEGER,

    CONSTRAINT "tweet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tweet" ADD CONSTRAINT "tweet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet" ADD CONSTRAINT "tweet_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_likes" ADD CONSTRAINT "tweet_likes_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_retweet" ADD CONSTRAINT "tweet_retweet_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
