/*
  Warnings:

  - You are about to drop the `tweet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tweet" DROP CONSTRAINT "tweet_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tweet_likes" DROP CONSTRAINT "tweet_likes_tweet_id_fkey";

-- DropForeignKey
ALTER TABLE "tweet_retweet" DROP CONSTRAINT "tweet_retweet_tweet_id_fkey";

-- DropTable
DROP TABLE "tweet";

-- CreateTable
CREATE TABLE "tweets" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "retweet_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "parentId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tweets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_likes" ADD CONSTRAINT "tweet_likes_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_retweet" ADD CONSTRAINT "tweet_retweet_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
