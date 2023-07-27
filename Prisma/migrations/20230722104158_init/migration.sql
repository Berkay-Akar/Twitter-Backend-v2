-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tweet_count" INTEGER NOT NULL DEFAULT 0,
    "following_count" INTEGER NOT NULL DEFAULT 0,
    "followers_count" INTEGER NOT NULL DEFAULT 0,
    "birthday" TIMESTAMP(3),
    "description" TEXT,
    "profile_photo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tweet" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "retweet_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "is_comment" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tweet_likes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tweet_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tweet_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tweet_retweet" (
    "id" SERIAL NOT NULL,
    "tweet_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tweet_retweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_followers" (
    "id" SERIAL NOT NULL,
    "followers_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_followings" (
    "id" SERIAL NOT NULL,
    "following_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_followings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "tweet" ADD CONSTRAINT "tweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_likes" ADD CONSTRAINT "tweet_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_likes" ADD CONSTRAINT "tweet_likes_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_retweet" ADD CONSTRAINT "tweet_retweet_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweet_retweet" ADD CONSTRAINT "tweet_retweet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_followers" ADD CONSTRAINT "user_followers_followers_id_fkey" FOREIGN KEY ("followers_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_followings" ADD CONSTRAINT "user_followings_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
