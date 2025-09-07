const express = require("express");
const { google } = require("googleapis");
const authMiddleware = require("../middleware/auth");
const YouTubeService = require("../services/youtubeService");
const supabase = require("../services/supabase");

const router = express.Router();

router.get("/details", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, error: "Video IDs are required." });
    }
    const videoIds = ids.split(',');

    const { data: tokens, error } = await supabase.from("tokens").select("access_token, refresh_token").eq("id", userId).single();
    if (error || !tokens) return res.status(401).json({ error: "Could not retrieve user tokens." });
    
    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oAuth2Client.setCredentials(tokens);
    const youtubeService = new YouTubeService(oAuth2Client);

    const videoDetails = await youtubeService.getVideoDetails(videoIds);
    res.json({ success: true, videos: videoDetails });
  } catch (error) {
    console.error("Get video details error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch video details." });
  }
});

module.exports = router;