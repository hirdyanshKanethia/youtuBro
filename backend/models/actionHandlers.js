const { GoogleGenerativeAI } = require("@google/generative-ai");

class ActionHandlers {
  constructor(geminiApiKey, youtubeService) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.youtubeService = youtubeService;
  }

  // **************************************************************************************
  // Single helper function to call ai model with the provided prompt and return cleaned json
  // **************************************************************************************
  async _callModel(prompt) {
    let responseText;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in the model's response.");
      }

      const cleanedJson = jsonMatch[0].replace(/```json\n|\n```/g, "").trim();
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error("Failed to parse JSON. Raw model output:", responseText);
      console.error("Model call failed:", error);
      throw error;
    }
  }

  // **************************************************************************************
  // Handler function for make_playlist flow of the mcp server
  // **************************************************************************************
  async handleMakePlaylist(userPrompt) {
    const prompt = `
    You are a playlist creation assistant. Your job is to extract structured parameters from the user's request. If a parameter cannot be confidently determined, return null.

    Parameters to extract:
    - playlist_name: A suitable name for the playlist, or null.
    - content_type: One of [music, education, podcast, entertainment, information, comedy], or null if not inferable.
    - content_creator: The main creator that the user mentioned, if any (e.g., artist, teacher, streamer, celebrity), or null.
    - description: A short natural-language description of the playlist (max 30 words), or null.
    - privacy: "public" or "private". Default to "private" if not specified.
    - vid_count: An integer. If the user specifies a number, use it. If they use vague terms ("few", "many"), interpret reasonably (e.g., few=5, several=10, a lot=20). Set null only and only if a roadmap is needed. Default = 15
    - need_roadmap: answer in yes or no if the requirement of the user needs a roadmap in order to make a playlist (Ex- To learn a topic, we need a roadmap)

    Decision:
    - ready_to_execute: true if enough information is present to reasonably create a playlist (at least playlist_name OR description, and content_type), else false if no to very little information is present.

    User message: """${userPrompt}"""

    Respond ONLY with valid JSON in the following format (no extra text, no explanation):
    {
      "parameters": {
        "playlist_name": string or null,
        "content_type": string or null,
        "content_creator": string or null,
        "description": string or null,
        "privacy": "public" | "private",
        "vid_count": number, 
        "need_roadmap": yes or no
      },
      "ready_to_execute": boolean
    }
  `;

    try {
      const parsed = await this._callModel(prompt);
      parsed.userPrompt = userPrompt;

      if (!parsed.ready_to_execute) {
        return {
          success: false,
          message:
            "Not enough information to create playlist. Please provide more details.",
          missing: Object.entries(parsed.parameters)
            .filter(([_, value]) => value === null)
            .map(([key]) => key),
          parameters: parsed.parameters,
        };
      }
      return { success: true, ...parsed };
    } catch (error) {
      console.error("Make playlist handler error:", error);
      return { success: false, error: error.message, ready_to_execute: false };
    }
  }

  // **************************************************************************************
  // Handler function for the remove_playlist flow of the mcp server
  // **************************************************************************************
  async handleRemovePlaylist(userPrompt, userPlaylists) {
    if (!userPlaylists || userPlaylists.length === 0) {
      return {
        success: false,
        ready_to_execute: false,
        message: "You don't have any playlists to delete.",
      };
    }

    const prompt = `
    You are an intelligent playlist deletion assistant. Your job is to accurately identify which of the user's playlists they want to delete based on their message and a provided list.

    CONTEXT:
    The user has the following playlists. Your decision MUST be one of these playlists.
    Playlists List:
    ${JSON.stringify(userPlaylists, null, 2)}

    USER MESSAGE:
    """${userPrompt}"""

    YOUR TASK:
    1.  Analyze the user's message and identify the single playlist they want to delete from the 'Playlists List'.
    2.  If you can confidently identify a playlist, extract its "id" and "name".
    3.  If the request is ambiguous or you cannot find a match, return null for the playlist.

    DECISION:
    - ready_to_execute: Set to true ONLY if you successfully identified a playlist to delete, otherwise false.

    Respond ONLY with valid JSON in the following format:
    {
      "parameters": {
        "playlist_to_delete": {
          "id": "string, from the list provided",
          "name": "string, from the list provided"
        } or null
      },
      "ready_to_execute": boolean
    }
    `;

    try {
      const parsed = await this._callModel(prompt);
      if (!parsed.ready_to_execute || !parsed.parameters.playlist_to_delete) {
        return {
          success: false,
          ready_to_execute: false,
          message:
            "Sorry, I couldn't figure out which playlist you want to delete. Please be more specific.",
          parameters: parsed.parameters,
        };
      }
      return { success: true, ...parsed };
    } catch (error) {
      console.error("Remove playlist handler error:", error);
      return { success: false, error: error.message, ready_to_execute: false };
    }
  }

  // **************************************************************************************
  // Handler function for the manage_playlist flow of the mcp server
  // **************************************************************************************
  async handleManagePlaylist(userPrompt, userPlaylists) {
    const prompt = `
    You are a playlist management triage assistant. Your first job is to identify which of the user's playlists they want to manage and the specific action they want to take.

    CONTEXT:
    The user has the following playlists. Your decision MUST be one of these.
    Playlists List:
    ${JSON.stringify(userPlaylists, null, 2)}

    USER MESSAGE:
    """${userPrompt}"""

    TASK:
    Identify the target playlist and the primary management action.

    Actions: ["add_videos", "remove_videos", "rename_playlist"]

    Respond ONLY with valid JSON in the following format:
    {
      "playlist_to_manage": {
        "id": "string, from the list provided",
        "name": "string, from the list provided"
      } or null,
      "management_action": "add_videos|remove_videos|rename_playlist" or null
    }
    `;

    try {
      const triageResult = await this._callModel(prompt);

      if (!triageResult.playlist_to_manage || !triageResult.management_action) {
        return {
          success: false,
          ready_to_execute: false,
          message:
            "Sorry, I'm not sure which playlist you want to change or what you want to do.",
        };
      }

      // Based on the action, delegate to a specialized agent
      switch (triageResult.management_action) {
        case "add_videos":
          return this._handleAddVideos(
            userPrompt,
            triageResult.playlist_to_manage
          );
        case "remove_videos":
          // Removing videos requires knowing what's already in the playlist
          const items = await this.youtubeService.getPlaylistItems(
            triageResult.playlist_to_manage.id
          );
          const itemDetails = await this.youtubeService.getVideoDetails(items);
          return this._handleRemoveVideos(
            userPrompt,
            triageResult.playlist_to_manage,
            itemDetails
          );
        case "rename_playlist":
          return this._handleRenamePlaylist(
            userPrompt,
            triageResult.playlist_to_manage
          );
        // Add a case for update_description if needed
        default:
          return {
            success: false,
            ready_to_execute: false,
            message: "That action isn't supported yet.",
          };
      }
    } catch (error) {
      console.error("Manage playlist handler error:", error);
      return { error: error.message, ready_to_execute: false };
    }
  }

  // **************************************************************************************
  // Handler function for the play_video flow of the mcp server
  // **************************************************************************************
  async handlePlayVideo(userPrompt) {
    const prompt = `
    You are an expert at understanding user requests to watch YouTube videos. Your job is to extract raw, structured search parameters from the user's message. Do NOT create the final search query yourself.

    Parameters to extract:
    - topic: The main subject or title of the video (e.g., "latest iphone review", "how to cook pasta").
    - creator: The specific channel or creator mentioned (e.g., "MKBHD", "Gordon Ramsay").
    - genre: The genre of music or content if specified (e.g., "lofi", "jazz", "comedy special").
    - video_length: Infer the desired video length. Can be "short" (under 4 min), "medium" (4-20 min), or "long" (over 20 min). Default to "any".

    Decision:
    - ready_to_execute: Should be true if you can extract at least a 'topic', 'creator', or 'genre'.

    User message: """${userPrompt}"""

    Respond ONLY with valid JSON in the following format:
    {
      "parameters": {
        "topic": "string or null",
        "creator": "string or null",
        "genre": "string or null",
        "video_length": "short" | "medium" | "long" | "any"
      },
      "ready_to_execute": boolean
    }
    `;

    try {
      const parsed = await this._callModel(prompt);
      if (!parsed.ready_to_execute) {
        return {
          success: false,
          ready_to_execute: false,
          message:
            "I'm sorry, I couldn't understand what you want to watch. Could you be more specific?",
          parameters: parsed.parameters,
        };
      }
      return { success: true, ...parsed };
    } catch (error) {
      console.error("Play video handler error:", error);
      return { success: false, error: error.message, ready_to_execute: false };
    }
  }

  // **************************************************************************************
  // Helper functions for the above flows
  // **************************************************************************************
  
  async _handleAddVideos(userPrompt, playlist) {
    const prompt = `
    You are a YouTube search query expert. A user wants to add videos to their playlist.

    PLAYLIST CONTEXT:
    - Name: "${playlist.name}"
    - Description: "${playlist.description || "No description provided."}"

    USER MESSAGE (what to add):
    """${userPrompt}"""

    TASK:
    Based on the playlist's context and the user's message, generate a concise YouTube search query to find the videos they want to add. Also, determine how many videos to add (default to 5 if not specified).

    Respond ONLY with valid JSON:
    { "search_query": "string", "video_count": number }
    `;
    try {
      const result = await this._callModel(prompt);
      return {
        success: true,
        ready_to_execute: true,
        action: "manage_playlist",
        parameters: {
          management_action: "add_videos",
          playlist_to_manage: playlist,
          search_query: result.search_query,
          video_count: result.video_count,
        },
      };
    } catch (error) {
      console.error("Add videos handler error:", error);
      return { success: false, error: error.message, ready_to_execute: false };
    }
  }

  async _handleRemoveVideos(userPrompt, playlist, currentVideos) {
    const prompt = `
    You are a playlist curation assistant. A user wants to remove videos from their playlist "${
      playlist.name
    }".
    Analyze the user's message and identify which of the videos from the provided list should be removed.

    VIDEOS CURRENTLY IN THE PLAYLIST:
    ${JSON.stringify(
      currentVideos.map((v) => ({ id: v.id, title: v.title })),
      null,
      2
    )}

    USER MESSAGE:
    """${userPrompt}"""

    TASK:
    Return a list of the video IDs that should be removed.

    Respond ONLY with valid JSON:
    { "videos_to_remove": ["id1", "id2", ...] }
    `;
    try {
      const result = await this._callModel(prompt);
      return {
        success: true,
        ready_to_execute: true,
        action: "manage_playlist",
        parameters: {
          management_action: "remove_videos",
          playlist_to_manage: playlist,
          video_ids_to_remove: result.videos_to_remove,
        },
      };
    } catch (error) {
      console.error("Play video handler error:", error);
      return { success: false, error: error.message, ready_to_execute: false };
    }
  }

  async _handleRenamePlaylist(userPrompt, playlist) {
    const prompt = `
    A user wants to rename their playlist "${playlist.name}".
    Extract the new name from their message.

    USER MESSAGE:
    """${userPrompt}"""

    TASK:
    Return the new playlist name.

    Respond ONLY with valid JSON:
    { "new_name": "string" }
    `;
    try {
      const result = await this._callModel(prompt);
      return {
        success: true,
        ready_to_execute: true,
        action: "manage_playlist",
        parameters: {
          management_action: "rename_playlist",
          playlist_to_manage: playlist,
          new_name: result.new_name,
        },
      };
    } catch (error) {
      console.error("Play video handler error:", error);
      return { success: false, error: error.message, ready_to_execute: false };
    }
  }
}

module.exports = ActionHandlers;
