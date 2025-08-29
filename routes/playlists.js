const express = require("express");
const { google } = require("googleapis");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");
const YouTubeService = require("../services/youtubeService");

const router = express.Router();

// GET /api/playlists/
// Fetches all playlists for the authenticated user.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;

    // 1. Fetch user's tokens from Supabase (same as in chat.js)
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("access_token, refresh_token")
      .eq("id", userId)
      .single();

    if (error || !tokens) {
      console.error("Supabase error (playlists.js):", error);
      return res.status(401).json({ error: "Could not retrieve user tokens." });
    }

    // 2. Create an authenticated YouTube service instance
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const youtubeService = new YouTubeService(oAuth2Client);

    // 3. Call the service to get the playlists
    const playlists = await youtubeService.getUsersPlaylists();

    // 4. Send the playlists back to the client
    res.json({ success: true, playlists: playlists });

  } catch (error) {
    console.error("Get playlists route error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch playlists." });
  }
});

// GET /api/playlists/:playlistId/items
// Fetches all video IDs for a specific playlist.
router.get("/:playlistId/items", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { playlistId } = req.params; // Get playlistId from the URL parameter

    // ... (same logic as the other route to create an authenticated youtubeService)
    const { data: tokens, error } = await supabase.from("tokens").select("...").eq("id", userId).single();
    if (error || !tokens) return res.status(401).json({ error: "Could not retrieve user tokens." });
    
    const oAuth2Client = new google.auth.OAuth2(/*...*/);
    oAuth2Client.setCredentials(tokens);
    const youtubeService = new YouTubeService(oAuth2Client);
    // ...

    // Call the new service method with the playlistId from the request
    const videoIds = await youtubeService.getPlaylistItems(playlistId);

    res.json({ success: true, videoIds: videoIds });

  } catch (error) {
    console.error("Get playlist items route error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch playlist items." });
  }
});

module.exports = router;