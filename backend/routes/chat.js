const express = require("express");
const { google } = require("googleapis");
const supabase = require("../services/supabase");
const authMiddleware = require("../middleware/auth");

const TaskClassifier = require("../models/taskClassifier");
const ActionHandlers = require("../models/actionHandlers");
const PlaylistBuilder = require("../services/playlistBuilder");
const YouTubeService = require("../services/youtubeService");
const { logActionToDB } = require("../utils/dbLogger");

const router = express.Router();

const classifier = new TaskClassifier(process.env.GEMINI_API_KEY);

// **************************************************************************************
// ROUTES
// **************************************************************************************

// Main router for handling all chat prompts
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    const { id: userId } = req.user;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const classification = await classifier.classifyTask(prompt);
    if (classification.action === "unknown") {
      return res.json({
        success: false,
        message: "Sorry, I couldn't understand that request.",
      });
    }

    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("access_token, refresh_token")
      .eq("id", userId)
      .single();

    if (error || !tokens) {
      console.error("Supabase error (chat.js):", error);
      return res.status(401).json({
        error: "Could not retrieve user tokens. Please re-authenticate.",
      });
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

    const actionHandlers = new ActionHandlers(
      process.env.GEMINI_API_KEY,
      youtubeService
    );

    let handlerResult;
    switch (classification.action) {
      case "make_playlist":
        handlerResult = await actionHandlers.handleMakePlaylist(prompt);
        break;

      case "remove_playlist": {
        const userPlaylists = await youtubeService.getUsersPlaylists();
        handlerResult = await actionHandlers.handleRemovePlaylist(
          prompt,
          userPlaylists
        );
        break;
      }

      case "manage_playlist": {
        const userPlaylists = await youtubeService.getUsersPlaylists();
        handlerResult = await actionHandlers.handleManagePlaylist(
          prompt,
          userPlaylists
        );
        break;
      }

      case "play_video":
        handlerResult = await actionHandlers.handlePlayVideo(prompt);
        break;

      default:
        return res.json({ success: false, message: "Unsupported action." });
    }

    if (handlerResult.ready_to_execute) {
      const executionResult = await executeAction(
        classification.action,
        handlerResult,
        youtubeService
      );

      if (
        executionResult.success &&
        executionResult.action_message &&
        classification.action !== "play_video"
      ) {
        await logActionToDB(userId, executionResult.action_message);
      }

      return res.json(executionResult);
    } else {
      return res.json({
        success: false,
        needs_more_info: true,
        message: handlerResult.message,
        current_parameters: handlerResult.parameters,
      });
    }
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// **************************************************************************************
// HELPER FUNCTION TO FINALLY EXECUTE THE USER DESIRED ACTION
// **************************************************************************************

/**
 * Executes the final action (e.g., creating or deleting a playlist)
 * after the AI has successfully extracted all necessary parameters.
 * @param {string} action - The action to perform (e.g., 'make_playlist').
 * @param {object} handlerResult - The result from the AI parameter extraction.
 * @param {YouTubeService} youtubeService - The authenticated YouTube service instance.
 */
async function executeAction(action, handlerResult, youtubeService) {
  console.log(`Executing action: ${action}`);

  switch (action) {
    case "make_playlist":
      const playlistBuilder = new PlaylistBuilder(
        process.env.GEMINI_API_KEY,
        youtubeService
      );
      return await playlistBuilder.execute(handlerResult);

    case "remove_playlist":
      const playlistToDelete = handlerResult.parameters.playlist_to_delete;
      if (!playlistToDelete || !playlistToDelete.id) {
        return {
          success: false,
          message: "No playlist was identified for deletion.",
        };
      }

      const deleteResult = await youtubeService.deletePlaylist(
        playlistToDelete.id
      );

      if (deleteResult.success) {
        return {
          success: true,
          message: `Successfully deleted the playlist "${playlistToDelete.name}".`,
          action_message: `Agent action: Deleted the YouTube playlist named "${playlistToDelete.name}" (ID: ${playlistToDelete.id}).`,
        };
      } else {
        return { success: false, message: deleteResult.message };
      }

    case "play_video": {
      const params = handlerResult.parameters;
      const playlistBuilder = new PlaylistBuilder(
        process.env.GEMINI_API_KEY,
        youtubeService
      );
      const searchQuery = await playlistBuilder.generateVideoSearchQuery(
        params
      );
      if (!searchQuery) {
        return {
          success: false,
          message: "Sorry, I couldn't formulate a search query for that.",
        };
      }
      const videoCountForQueue = params.video_count || 1;
      const videoIds = await youtubeService.searchForVideos(
        searchQuery,
        videoCountForQueue,
      );
      if (videoIds.length === 0) {
        return {
          success: false,
          message: `I couldn't find any videos for "${searchQuery}".`,
        };
      }

      const videos = await youtubeService.getVideoDetails(videoIds);

      console.log("[API] Videos returned");
      return {
        success: true,
        action: "play",
        message: `Now playing videos about ${searchQuery}.`,
        videos: videos,
        action_message: `Agent action: User requested to play videos. Synthesized query: "${searchQuery}". Found ${videos.length} videos.`,
      };
    }

    case "manage_playlist": {
      const params = handlerResult.parameters;
      const playlistBuilder = new PlaylistBuilder(
        process.env.GEMINI_API_KEY,
        youtubeService
      );

      switch (params.management_action) {
        case "add_videos":
          const videoIds = await youtubeService.searchForVideos(
            params.search_query,
            params.video_count
          );
          if (!videoIds || videoIds.length === 0) {
            return {
              success: false,
              message: `Could not find videos for "${params.search_query}"`,
            };
          }
          await youtubeService.addVideosToPlaylist(
            params.playlist_to_manage.id,
            videoIds
          );
          return {
            success: true,
            message: `Added ${videoIds.length} videos to "${params.playlist_to_manage.name}".`,
            action_message: `Agent action: Added ${videoIds.length} videos to playlist "${params.playlist_to_manage.name}".`,
          };

        case "remove_videos":
          await youtubeService.removeVideosFromPlaylist(
            params.playlist_to_manage.id,
            params.video_ids_to_remove
          );
          return {
            success: true,
            message: `Removed ${params.video_ids_to_remove.length} videos from "${params.playlist_to_manage.name}".`,
            action_message: `Agent action: Removed ${params.video_ids_to_remove.length} videos from playlist "${params.playlist_to_manage.name}".`,
          };

        case "rename_playlist":
          await youtubeService.renamePlaylist(
            params.playlist_to_manage.id,
            params.new_name
          );
          return {
            success: true,
            message: `Renamed playlist to "${params.new_name}".`,
            action_message: `Agent action: Renamed playlist "${params.playlist_to_manage.name}" to "${params.new_name}".`,
          };

        default:
          return { success: false, message: "Unsupported management action." };
      }
    }

    default:
      return {
        success: false,
        message: `Execution failed: Unknown action type "${action}".`,
      };
  }
}

module.exports = router;
