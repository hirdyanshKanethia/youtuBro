require("dotenv").config();
const express = require("express");
const cors = require('cors')

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  optionsSuccessStatus: 200
}

app.use(express.json())
app.use(cors(corsOptions))

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat")
const playlistRoutes = require("./routes/playlists")
const videoRoutes = require("./routes/videos")
// const youtubeRoutes = require("./routes/youtube");

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes)
app.use("/playlists", playlistRoutes)
app.use("/videos", videoRoutes)
// app.use("/youtube", youtubeRoutes);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("Oauth running at http://localhost:3000/auth/login")
});
