import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
//import { requireAuth } from "../passport-config.js";
import functions from "../functions/index.js";
import jwt from "jsonwebtoken";

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!loginUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await functions.comparePassword(
      password,
      loginUser.password
    );
    if (isMatch) {
      const token = jwt.sign(
        { id: loginUser.id, email: loginUser.email },
        process.env.JWT_SECRET
      );
      res.json({ token, user: loginUser });
    } else {
      res.status(401).json({ message: "Password is incorrect" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authenticated
router.get("/authenticated", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Authorization error!" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });
    if (user) {
      res.status(400).json({ message: "User already exists" });
    }

    if (req.body.username.length < 4 || req.body.username.length > 20) {
      return res
        .status(401)
        .json({ error: "Username must be between 4 and 20 characters" });
    }
    if (req.body.password.length < 8 || req.body.password.length > 20) {
      return res
        .status(401)
        .json({ error: "Password must be between 8 and 20 characters" });
    }

    const hashedPassword = await functions.hashPassword(req.body.password);
    user = await prisma.user.create({
      data: {
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      },
    });
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
