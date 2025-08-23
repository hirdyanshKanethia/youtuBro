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
const actionHandlers = new ActionHandlers(process.env.GEMINI_API_KEY);

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

    // 1. Fetch user's tokens from Supabase to create an authenticated client
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("access_token, refresh_token")
      .eq("id", userId)
      .single();

    if (error || !tokens) {
      console.error("Supabase error (chat.js):", error);
      return res
        .status(401)
        .json({
          error: "Could not retrieve user tokens. Please re-authenticate.",
        });
    }

    // 2. Create authenticated YouTube service for this specific user
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const youtubeService = new YouTubeService(oAuth2Client);

    // 3. Get parameters from the prompt using the appropriate handler
    let handlerResult;
    switch (classification.action) {
      case "make_playlist":
        handlerResult = await actionHandlers.handleMakePlaylist(prompt);
        break;

      case "remove_playlist":
        // For removal, we must first fetch the user's playlists to provide context to the AI
        const userPlaylists = await youtubeService.getUsersPlaylists();
        handlerResult = await actionHandlers.handleRemovePlaylist(
          prompt,
          userPlaylists
        );
        break;

      default:
        return res.json({ success: false, message: "Unsupported action." });
    }

    // 4. If the handler is ready, execute the action. Otherwise, return its message.
    if (handlerResult.ready_to_execute) {
      const executionResult = await executeAction(
        classification.action,
        handlerResult,
        youtubeService
      );

      if (executionResult.success && executionResult.action_message) {
        await logActionToDB(userId, executionResult.action_message);
      }

      return res.json(executionResult);
    } else {
      // This handles cases where the AI couldn't figure out what to do
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

    default:
      return {
        success: false,
        message: `Execution failed: Unknown action type "${action}".`,
      };
  }
}

module.exports = router;
