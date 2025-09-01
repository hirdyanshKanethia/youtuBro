// backend/models/actionHandlers.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
// const OpenAI = require("openai");

class ActionHandlers {
  constructor(geminiApiKey) {
    // Re-initialize the Google Generative AI client.
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async _callModel(prompt) {
    let responseText;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text();

      // Find and clean the JSON block from the model's response.
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

  /**
   * Simplified handler to identify a playlist for removal in a single step.
   * @param {string} userPrompt - The user's natural language request.
   * @param {Array<Object>} userPlaylists - An array of the user's playlists.
   * @returns {Promise<Object>}
   */
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

  async handleManagePlaylist(userPrompt) {
    const prompt = `
You are a playlist management assistant. Extract the required parameters from the user's message.

Required parameters:
- playlist_identifier: The playlist name or ID to modify
- management_action: "add_songs", "remove_songs", "rename", or "change_description"

Conditional parameters (based on management_action):
- If add_songs: songs_to_add (array of song names/artists)
- If remove_songs: songs_to_remove (array of song names/artists)
- If rename: new_name (string)
- If change_description: new_description (string)

User message: "${userPrompt}"

Respond with JSON in this format:
{
  "parameters": {
    "playlist_identifier": "extracted playlist name/id or null",
    "management_action": "add_songs|remove_songs|rename|change_description or null",
    "songs_to_add": ["array of songs"] or null,
    "songs_to_remove": ["array of songs"] or null,
    "new_name": "new playlist name or null",
    "new_description": "new description or null"
  },
  "missing_required": ["list of missing required parameters"],
  "ready_to_execute": boolean,
  "follow_up_question": "question to ask user if parameters are missing"
}
`;

    try {
      return await this._callModel(prompt);
    } catch (error) {
      console.error("Manage playlist handler error:", error);
      return { error: error.message, ready_to_execute: false };
    }
  }

  /**
   * UPDATED: Extracts raw parameters for a video to be played.
   * This function's only job is to understand the user's intent.
   * @param {string} userPrompt - The user's natural language request.
   * @returns {Promise<Object>}
   */
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
}

module.exports = ActionHandlers;
