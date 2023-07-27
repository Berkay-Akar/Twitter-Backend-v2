/*
  Warnings:

  - You are about to drop the `user_followers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_followings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_followers" DROP CONSTRAINT "user_followers_followers_id_fkey";

-- DropForeignKey
ALTER TABLE "user_followings" DROP CONSTRAINT "user_followings_following_id_fkey";

-- DropTable
DROP TABLE "user_followers";

-- DropTable
DROP TABLE "user_followings";

-- CreateTable
CREATE TABLE "Follows" (
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,

    CONSTRAINT "Follows_pkey" PRIMARY KEY ("followerId","followingId")
);

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
