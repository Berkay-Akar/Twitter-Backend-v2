import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth.js";
import tweetRouter from "./routes/tweets.js";
import profileRouter from "./routes/profile.js";
import followersRouter from "./routes/followers.js";

import cors from "cors";

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());
app.use("/auth", authRouter);
app.use("/tweets", tweetRouter);
app.use("/profile", profileRouter);
app.use("/followers", followersRouter);

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
