import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";

// get all tweets
router.get("/", async (req, res) => {
  try {
    const tweets = await prisma.tweet.findMany({});
    res.json({ tweets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get user's tweets
router.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    const tweets = await prisma.tweet.findMany({
      where: {
        userId: user.id,
      },
    });
    res.json({ tweets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all following tweets

router.get("/following", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      include: {
        following: true, // Include the following relation
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    // User's tweets ordered by created_at with aggregated fields
    const userTweets = await prisma.tweet.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        like_count: true,
        retweet_count: true,
        comments_count: true,
        originalTweetId: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Get the followingIds from the Follows table
    const followingIds = user.following.map((follow) => follow.followingId);

    // Tweets of the users the current user is following ordered by created_at with aggregated fields
    const followingTweets = await prisma.tweet.findMany({
      where: {
        user_id: {
          in: followingIds,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        like_count: true,
        retweet_count: true,
        comments_count: true,
        originalTweetId: true,
        user: {
          select: {
            id: true, // Include the 'id' field of the user
            name: true,
            username: true,
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        retweets: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Combine the user's tweets and following users' tweets into a single array
    const allTweets = [
      ...userTweets.map((tweet) => ({
        id: tweet.id,
        user_id: user.id, // Include the 'user_id' field
        name: user.name,
        username: user.username,
        tweet,
      })),
      ...followingTweets.map((tweet) => ({
        id: tweet.id, // Include tweet's ID here
        user_id: tweet.user.id, // Include the 'user_id' field
        name: tweet.user.id === user.id ? user.name : tweet.user.name,
        username:
          tweet.user.id === user.id ? user.username : tweet.user.username,
        tweet,
      })),
    ];

    // Fetch likes for each tweet in the combined array
    for (const tweet of allTweets) {
      const likes = await prisma.tweet_likes.findMany({
        where: {
          tweet_id: tweet.id,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
      tweet.likes = likes;
    }

    // Sort the combined array by created_at in descending order
    allTweets.sort(
      (a, b) => new Date(b.tweet.created_at) - new Date(a.tweet.created_at)
    );

    const result =
      allTweets.length > 0
        ? allTweets.map((tweet) => ({
            id: tweet.id,
            user_id: tweet.user_id, // Include the 'user_id' field
            name: tweet.name,
            username: tweet.username,
            content: tweet.tweet.content,
            created_at: tweet.tweet.created_at,
            like_count: tweet.tweet.like_count,
            retweet_count: tweet.tweet.retweet_count,
            comments_count: tweet.tweet.comments_count,
            originalTweetId: tweet.tweet.originalTweetId,
            likes: tweet.likes,
            retweets: tweet.retweets,
          }))
        : [];

    res.json({
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// create a tweet
router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    const post = await prisma.tweet.create({
      data: {
        content: req.body.content,
        user: { connect: { id: user.id } },
      },
      select: {
        id: true,
        content: true,
        like_count: true,
        retweet_count: true,
        comments_count: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profile_photo: true,
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const likes = post.likes.map((like) => ({
      id: like.id,
      user: {
        id: like.user.id,
        name: like.user.name,
        username: like.user.username,
      },
    }));

    const tweet = {
      id: post.id,
      content: post.content,
      like_count: post.like_count,
      retweet_count: post.retweet_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_id: post.user.id,
      originalTweetId: post.originalTweetId,
      username: post.user.username,
      name: post.user.name,
      profile_photo: post.user.profile_photo,
      likes: likes,
    };

    res.json({ tweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update a tweet
router.put("/:id", async (req, res) => {
  try {
    const tweetId = req.params.id;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    // check if the tweet belongs to the user
    const checkTweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
    });
    if (!checkTweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }
    if (checkTweet.userId !== user.id) {
      return res.status(401).json({ error: "Not authorized!" });
    }

    const tweet = await prisma.tweet.update({
      where: {
        id: Number(tweetId),
      },
      data: {
        content: req.body.content,
      },
    });
    res.json({ tweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// delete a tweet
router.delete("/:id", async (req, res) => {
  try {
    const tweetId = req.params.id;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
      include: {
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }

    // Check if the tweet has any associated likes
    const likes = await prisma.tweet_likes.findMany({
      where: {
        tweet_id: Number(tweetId),
      },
    });

    // If there are likes, delete them first
    if (likes.length > 0) {
      await prisma.tweet_likes.deleteMany({
        where: {
          tweet_id: Number(tweetId),
        },
      });
    }

    // check if the tweet id in the retweet table
    const retweet = await prisma.tweet_retweet.findFirst({
      where: {
        tweet_id: Number(tweetId),
      },
    });

    // If there are retweets, delete them first
    if (retweet) {
      await prisma.tweet_retweet.deleteMany({
        where: {
          tweet_id: Number(tweetId),
        },
      });
    }

    // Delete the tweet
    await prisma.tweet.delete({
      where: {
        id: Number(tweetId),
      },
    });

    res.json({ deletedTweet: tweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// like a tweet
router.post("/like/:id", async (req, res) => {
  try {
    const tweetId = req.params.id;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
    });

    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }

    const like = await prisma.tweet_likes.findFirst({
      where: {
        tweet_id: Number(tweetId),
        user_id: user.id,
      },
    });

    if (like) {
      return res.status(401).json({ error: "Tweet already liked!" });
    }

    await prisma.tweet_likes.create({
      data: {
        tweet_id: Number(tweetId),
        user_id: user.id,
      },
    });
    // update like count
    await prisma.tweet.update({
      where: {
        id: Number(tweetId),
      },
      data: {
        like_count: tweet.like_count + 1,
      },
    });

    //liked  tweet
    const likedTweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
      include: {
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    res.json({ likedTweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// unlike a tweet
router.delete("/like/:id", async (req, res) => {
  try {
    const tweetId = req.params.id;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
    });

    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }

    const like = await prisma.tweet_likes.findFirst({
      where: {
        tweet_id: Number(tweetId),
        user_id: user.id,
      },
    });

    if (!like) {
      return res.status(401).json({ error: "Tweet not liked!" });
    }

    await prisma.tweet_likes.delete({
      where: {
        id: like.id,
      },
    });

    await prisma.tweet.update({
      where: {
        id: Number(tweetId),
      },
      data: {
        like_count: tweet.like_count - 1,
      },
    });

    // Fetch the updated tweet with likes after unliking
    const unlikedTweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
      include: {
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    res.json({ unlikedTweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get tweet with likes
router.get("/like/:id", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    const tweetId = req.params.id;
    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
      include: {
        likes: true,
      },
    });
    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }
    res.json({ tweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//get single tweet with comments
router.get("/comment/:id", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorizated" });
    }
    const tweetId = req.params.id;
    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
    });
    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }

    const comments = await prisma.comment.findMany({
      where: {
        tweetId: Number(tweetId),
      },
      include: {
        user: true,
      },
    });
    res.json({ tweet, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// create a comment
router.post("/reply/:id", async (req, res) => {
  try {
    const tweetId = req.params.id;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
    });
    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }
    const comment = await prisma.tweet.create({
      data: {
        content: req.body.content,
        user_id: user.id,
        originalTweetId: Number(tweet.id),
      },
    });

    // update comment count
    await prisma.tweet.update({
      where: {
        id: Number(tweetId),
      },
      data: {
        comments_count: tweet.comments_count + 1,
      },
    });

    res.json({ comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get single tweet with comments
router.get("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorizated" });
    }
    const tweetId = req.params.id;
    const tweet = await prisma.tweet.findUnique({
      where: {
        id: Number(tweetId),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile_photo: true,
          },
        },
      },
    });

    const replies = await prisma.tweet.findMany({
      where: {
        originalTweetId: Number(tweetId),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile_photo: true,
          },
        },
      },
    });

    tweet.replies = replies;

    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }
    res.json({ tweet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// reweet a tweet
router.post("/retweet/:id", async (req, res) => {
  try {
    const tweetId = parseInt(req.params.id); // Convert the tweetId to an integer
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!currentUser) {
      return res.status(401).json({ error: "User not found!" });
    }
    const tweet = await prisma.tweet.findUnique({
      where: {
        id: tweetId,
      },
      include: {
        retweets: {
          where: {
            user_id: currentUser.id,
          },
        },
      },
    });

    if (!tweet) {
      return res.status(401).json({ error: "Tweet not found!" });
    }

    if (tweet.retweets.length > 0) {
      return res.status(401).json({ error: "Tweet already retweeted!" });
    }

    // Create a new retweet entry in the tweet_retweet table
    await prisma.tweet_retweet.create({
      data: {
        tweet_id: tweetId,
        user_id: currentUser.id,
      },
    });

    // Increment the retweet_count in the original tweet
    await prisma.tweet.update({
      where: {
        id: tweetId,
      },
      data: {
        retweet_count: tweet.retweet_count + 1,
      },
    });

    // Get the updated tweet with retweets and likes information
    const updatedTweet = await prisma.tweet.findUnique({
      where: {
        id: tweetId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile_photo: true,
            name: true,
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        retweets: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Create the desired response object
    const response = {
      id: updatedTweet.id,
      user_id: updatedTweet.user.id,
      name: updatedTweet.user.name,
      username: updatedTweet.user.username,
      content: updatedTweet.content,
      created_at: updatedTweet.created_at,
      like_count: updatedTweet.like_count,
      retweet_count: updatedTweet.retweet_count,
      comments_count: updatedTweet.comments_count,
      originalTweetId: updatedTweet.originalTweetId,
      likes: updatedTweet.likes,
      retweets: updatedTweet.retweets,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
