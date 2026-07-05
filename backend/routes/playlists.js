// ROUTES TO HANDLE CRUD OPERATIONS ON USER'S PLAYLISTS

const express = require("express");
const { google } = require("googleapis");
const prisma = require("../services/prisma");
const authMiddleware = require("../middleware/auth");
const YouTubeService = require("../services/youtubeService");
const redisClient = require("../services/redis");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const cacheKey = `playlists:${userId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("[REDIS] Serving playlists from cache.");
      return res.json({ success: true, playlists: JSON.parse(cachedData) });
    }

    const tokens = await prisma.token.findUnique({
      where: { id: userId },
      select: { access_token: true, refresh_token: true }
    });

    if (!tokens) {
      console.error("Token error (playlists.js): User not found");
      return res.status(401).json({ error: "Could not retrieve user tokens." });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const youtubeService = new YouTubeService(oAuth2Client);

    const playlists = await youtubeService.getUsersPlaylists();

    await redisClient.setEx(cacheKey, 300, JSON.stringify(playlists));

    res.json({ success: true, playlists: playlists });
  } catch (error) {
    console.error("Get playlists route error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch playlists." });
  }
});

router.get("/:playlistId/items", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { playlistId } = req.params;

    const cacheKey = `playlists:${userId}/${playlistId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("[REDIS] Serving videos from cache for playlistId: ", playlistId);
      return res.json({ success: true, videoIds: JSON.parse(cachedData) });
    }

    const tokens = await prisma.token.findUnique({ where: { id: userId } });
    if (!tokens)
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

    const videoIds = await youtubeService.getPlaylistItems(playlistId);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(videoIds));

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
    const { playlistId } = req.params;

    if (!playlistId) {
      return res
        .status(400)
        .json({ success: false, error: "Playlist ID is required." });
    }

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

    const deleteResult = await youtubeService.deletePlaylist(playlistId);

    if (deleteResult.success) {
      console.log("[REDIS] Clearing Invalid Cache")
      await redisClient.del(`playlists:${userId}`)
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
    const { videoId } = req.body;

    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, error: "Video ID is required." });
    }

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

    if (result.success) {
      console.log("[REDIS] Clearing invalid cache");
      await redisClient.del(`playlists:${userId}/${playlistId}`);
      await redisClient.del(`playlists:${userId}`);
    }

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

      if (result.success) {
        console.log("[REDIS] Clearing invalid cache");
        await redisClient.del(`playlists:${userId}/${playlistId}`);
        await redisClient.del(`playlists:${userId}`);
      }

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
