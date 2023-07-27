import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";

// get all tweets for a user
router.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    const tweets = await prisma.tweet.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profile_photo: true,
          },
        },
      },
    });

    const modifiedTweets = tweets.map((tweet) => ({
      id: tweet.id,
      content: tweet.content,
      like_count: tweet.like_count,
      retweet_count: tweet.retweet_count,
      comments_count: tweet.comments_count,
      image: tweet.image,
      created_at: tweet.created_at,
      updated_at: tweet.updated_at,
      user_id: tweet.user_id,
      originalTweetId: tweet.originalTweetId,
      username: tweet.user.username,
      name: tweet.user.name,
      profile_photo: tweet.user.profile_photo,
    }));

    res.json({ tweets: modifiedTweets });

    //res.json({ tweets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//update a profile
router.put("/edit", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        username: decoded.username,
        name: decoded.name,
        email: decoded.email,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    const profile = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: req.body.name,
        description: req.body.description,
        profile_photo: req.body.profile_photo,
        birthday: req.body.birthday,
      },
    });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all tweets for a user by username
router.get("/user/:username", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    const tweets = await prisma.tweet.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
            following_count: true,
            followers_count: true,
            // Add other user properties you want to include
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
        retweets: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Modify the tweets to include username and name directly
    const modifiedTweets = tweets.map((tweet) => {
      return {
        ...tweet,
        username: tweet.user.username,
        name: tweet.user.name,
        user: undefined, // Remove the nested "user" property
      };
    });

    res.json({ currentUser: user, tweets: modifiedTweets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all tweets user liked
router.get("/user/likes/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    // Find the user with the specified username
    const likedUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!likedUser) {
      return res.status(404).json({ error: "Liked user not found!" });
    }

    // Fetch tweets that the likedUser has liked
    const likedTweets = await prisma.tweet_likes.findMany({
      where: {
        user_id: likedUser.id,
      },
      include: {
        tweet: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
              },
            },
            likes: {
              select: {
                id: true,
                user: {
                  select: {
                    username: true,
                    name: true,
                  },
                },
              },
            },
            retweets: {
              select: {
                id: true,
                user: {
                  select: {
                    username: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extract the tweets from the likedTweets result and format the response
    const tweets = likedTweets.map((likedTweet) => {
      const { tweet } = likedTweet;
      return {
        ...tweet,
        username: tweet.user.username,
        name: tweet.user.name,
      };
    });

    res.json({ tweets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/// Get all tweets user retweeted
router.get("/user/retweets/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    const retweets = await prisma.tweet_retweet.findMany({
      where: {
        user: {
          username: username,
        },
      },
    });

    if (!retweets || retweets.length === 0) {
      return res
        .status(401)
        .json({ error: "User has not retweeted any tweets!" });
    }

    const tweetIds = retweets.map((retweet) => retweet.tweet_id);

    const tweets = await prisma.tweet.findMany({
      where: {
        id: {
          in: tweetIds,
        },
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
        retweets: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const modifiedTweets = tweets.map((tweet) => {
      return {
        ...tweet,
        username: tweet.user.username,
        name: tweet.user.name,
      };
    });

    res.json({ tweets: modifiedTweets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tweets user replied to
router.get("/user/replies/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    // Fetch tweets where the user has replied (comments)
    const comments = await prisma.tweet.findMany({
      where: {
        user: {
          username: username,
        },
        originalTweetId: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
        likes: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
        retweets: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const modifiedComments = comments.map((comment) => {
      return {
        ...comment,
        username: comment.user.username,
        name: comment.user.name,
      };
    });

    res.json({ comments: modifiedComments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
