require("dotenv").config();
const express = require("express");
const cors = require('cors')

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
  credentials: true, 
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions)) 
app.use(express.json()) 

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat")
const playlistRoutes = require("./routes/playlists")
const videoRoutes = require("./routes/videos")
const actionRoutes = require("./routes/actions")
// const youtubeRoutes = require("./routes/youtube");

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes)
app.use("/playlists", playlistRoutes)
app.use("/videos", videoRoutes)
app.use("/actions", actionRoutes)

app.get('/', (req, res) => {
  res.status(200).send('YoutuBro Backend is running and CORS is configured!');
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin set to: ${process.env.FRONTEND_URL}`);
  console.log("OAuth login endpoint: /auth/login");
});