import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";

// add a follower
router.post("/:followId", async (req, res) => {
  const followId = req.params.followId;
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

  if (user.id === Number(followId)) {
    return res.status(401).json({ error: "You cannot follow yourself!" });
  }

  try {
    // Check if the follow entry already exists
    const existingFollow = await prisma.follows.findFirst({
      where: {
        followerId: user.id,
        followingId: Number(followId),
      },
    });

    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user!" });
    }

    const follower = await prisma.follows.create({
      data: {
        followerId: user.id,
        followingId: Number(followId),
      },
    });
    console.log(follower);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        following_count: user.following_count + 1,
      },
    });

    await prisma.user.update({
      where: {
        id: Number(followId),
      },
      data: {
        followers_count: user.followers_count + 1,
      },
    });

    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// remove a follower
router.delete("/:followId", async (req, res) => {
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

  try {
    const followId = parseInt(req.params.followId);

    // Check if the user is actually following the specified followId
    const existingFollow = await prisma.Follows.findFirst({
      where: {
        followerId: user.id,
        followingId: followId,
      },
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ error: "You are not following this user!" });
    }

    const follower = await prisma.Follows.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: followId,
        },
      },
    });
    res.json({ follower });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all followers for a logged in user
router.get("/", async (req, res) => {
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

    const followers = await prisma.follows.findMany({
      where: {
        followerId: user.id,
      },
      include: {
        following: {
          select: {
            username: true,
            name: true,
            following_count: true,
            followers_count: true,
          },
        },
      },
    });
    res.json({ followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
