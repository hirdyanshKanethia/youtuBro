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
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch playlists." });
  }
});

// GET /api/playlists/:playlistId/items
// Fetches all video IDs for a specific playlist.
router.get("/:playlistId/items", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { playlistId } = req.params; // Get playlistId from the URL parameter

    // ... (same logic as the other route to create an authenticated youtubeService)
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("...")
      .eq("id", userId)
      .single();
    if (error || !tokens)
      return res.status(401).json({ error: "Could not retrieve user tokens." });

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const youtubeService = new YouTubeService(oAuth2Client);
    // ...

    // Call the new service method with the playlistId from the request
    const videoIds = await youtubeService.getPlaylistItems(playlistId);

    res.json({ success: true, videoIds: videoIds });
  } catch (error) {
    console.error("Get playlist items route error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch playlist items." });
  }
});

router.delete("/:playlistId", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { playlistId } = req.params; // Get playlistId from the URL parameter

    if (!playlistId) {
      return res
        .status(400)
        .json({ success: false, error: "Playlist ID is required." });
    }

    // Create an authenticated youtubeService instance (same as in other routes)
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("...")
      .eq("id", userId)
      .single();
    if (error || !tokens)
      return res.status(401).json({ error: "Could not retrieve user tokens." });

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const youtubeService = new YouTubeService(oAuth2Client);

    // Call the service to delete the playlist
    const deleteResult = await youtubeService.deletePlaylist(playlistId);

    if (deleteResult.success) {
      res.json({ success: true, message: "Playlist deleted successfully." });
    } else {
      res.status(500).json({ success: false, message: deleteResult.message });
    }
  } catch (error) {
    console.error("Delete playlist route error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete playlist." });
  }
});

router.post("/:playlistId/items", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { playlistId } = req.params;
    const { videoId } = req.body; // Get videoId from the request body

    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, error: "Video ID is required." });
    }

    // Create an authenticated youtubeService instance
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("...")
      .eq("id", userId)
      .single();
    if (error || !tokens)
      return res.status(401).json({ error: "Could not retrieve user tokens." });

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const youtubeService = new YouTubeService(oAuth2Client);

    const result = await youtubeService.addVideoToPlaylist(playlistId, videoId);
    res.json(result);
  } catch (error) {
    console.error("Add video to playlist route error:", error);
    res.status(500).json({ success: false, error: "Failed to add video." });
  }
});

router.delete(
  "/:playlistId/items/:videoId",
  authMiddleware,
  async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { playlistId, videoId } = req.params;

      // Create an authenticated youtubeService instance
      const { data: tokens, error } = await supabase
        .from("tokens")
        .select("...")
        .eq("id", userId)
        .single();
      if (error || !tokens)
        return res
          .status(401)
          .json({ error: "Could not retrieve user tokens." });

      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oAuth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      const youtubeService = new YouTubeService(oAuth2Client);

      const result = await youtubeService.removeVideoFromPlaylist(
        playlistId,
        videoId
      );
      res.json(result);
    } catch (error) {
      console.error("Remove video from playlist route error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to remove video." });
    }
  }
);

module.exports = router;
