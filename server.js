require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json())

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat")
// const youtubeRoutes = require("./routes/youtube");

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes)
// app.use("/youtube", youtubeRoutes);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("Oauth running at http://localhost:3000/auth/login")
});
