// backend/services/playlistBuilder.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
// const OpenAI = require("openai");

class PlaylistBuilder {
  constructor(geminiApiKey, youtubeService) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.youtubeService = youtubeService;
  }

  async _callModel(prompt) {
    let responseText;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text();

      console.log("Raw response: ", responseText);

      // Find and clean the JSON block from the model's text response.
      const jsonMatch = responseText.match(/\{[\s\S]*\}|"[^"]*"/);
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
  /**
   * Main execute method that acts as a dispatcher based on the 'need_roadmap' parameter.
   */
  async execute(playlistData) {
    if (!playlistData.success || !playlistData.ready_to_execute) {
      throw new Error("Cannot execute playlist creation. Data is not ready.");
    }
    const params = playlistData.parameters;
    if (params.need_roadmap === "yes") {
      return this._executeRoadmapPlaylist(playlistData);
    } else {
      return this._executeSimplePlaylist(playlistData);
    }
  }

  // --- Roadmap Playlist Methods ---

  /**
   * Orchestrates the creation of a playlist based on a generated roadmap.
   * @private
   */
  async _executeRoadmapPlaylist(playlistData) {
    const params = playlistData.parameters;

    // 1. Generate the roadmap and a specific query for each step
    const roadmapResult = await this._generateRoadmapAndQueries(params);
    if (!roadmapResult || roadmapResult.roadmap.length === 0) {
      return {
        success: false,
        message: "Could not generate a learning roadmap.",
      };
    }

    const queries = roadmapResult.roadmap.map((step) => step.query);

    // 2. Create the empty playlist on YouTube
    // We can format the roadmap as the playlist description for a nice touch.
    const playlistDescription = roadmapResult.roadmap
      .map((step) => `${step.step}. ${step.title}`)
      .join("\n");

    const newPlaylist = await this.youtubeService.createPlaylist(
      params.playlist_name,
      playlistDescription,
      params.privacy
    );
    if (!newPlaylist || !newPlaylist.id) {
      return { success: false, message: "Failed to create YouTube playlist." };
    }

    // 3. Search for ONE video for each query
    console.log(
      `Searching for ${queries.length} specific videos for the roadmap...`
    );
    const videoIdPromises = queries.map((q) =>
      this.youtubeService.searchForVideoId(q)
    );
    const videoIds = (await Promise.all(videoIdPromises)).filter(
      (id) => id !== null
    );

    if (videoIds.length === 0) {
      return {
        success: false,
        message: "Could not find any videos for the roadmap topics.",
        playlistUrl: newPlaylist.url,
      };
    }

    // 4. Add the collected videos to the new playlist
    await this.youtubeService.addVideosToPlaylist(newPlaylist.id, videoIds);

    console.log("Roadmap playlist creation completed!");

    const action_message = `Agent action: Created new roadmap-based playlist named "${params.playlist_name}" and added ${videoIds.length} videos. URL: ${newPlaylist.url}.`;

    return {
      success: true,
      message: `Successfully created playlist and added ${videoIds.length} videos based on the generated roadmap.`,
      playlistUrl: newPlaylist.url,
      action_message: action_message,
    };
  }

  /**
   * Uses Gemini to generate a curriculum/roadmap and corresponding search queries.
   * @private
   */
  async _generateRoadmapAndQueries(playlistParams) {
    const { playlist_name, description } = playlistParams; // vid_count is no longer needed here

    const prompt = `
      You are an expert curriculum and content strategist. Your task is to create a step-by-step learning roadmap for the given topic. For each step, you must also generate a concise, high-quality YouTube search query that would find a good introductory video for that topic.

      Playlist Parameters:
      - Topic / Name: "${playlist_name}"
      - Description: "${description}"

      Instructions:
      1. Create a logical, step-by-step learning roadmap.
      2. The number of steps should be comprehensive yet concise, covering the essential stages of learning the topic. A reasonable number is typically between 5 and 15 steps, but you should use your expert judgment.
      3. For each step, provide a clear "title" and a specific YouTube "query".
      4. The "query" should be optimized to find the best possible educational video for that step.
      5. Respond ONLY with a valid JSON object in the specified format.

      Example Response Format:
      {
        "roadmap": [
          { "step": 1, "title": "Introduction to Quantum Physics", "query": "quantum physics for beginners simplified" },
          { "step": 2, "title": "Wave-Particle Duality", "query": "wave-particle duality explained double slit experiment" }
        ]
      }
    `;

    try {
      console.log("Generating dynamic roadmap and queries");
      return await this._callModel(prompt);
    } catch (error) {
      console.error("Error generating roadmap:", error);
      return null;
    }
  }

  /**
   * UPDATED METHOD: Uses Gemini to generate a single, optimal search query.
   * @param {object} playlistParams
   * @returns {Promise<string>} A single search query string.
   */
  async _generateSingleSearchQuery(playlistParams) {
    const { content_creator, description, content_type } = playlistParams;

    const prompt = `
      You are a YouTube search query expert. Your task is to generate the single best search query to find a variety of videos for a playlist based on the following parameters.

      Playlist Parameters:
      - Content Type: "${content_type}"
      - Creator / Artist: "${content_creator}"
      - Description: "${description}"

      Instructions:
      1. Analyze the parameters to create one single, effective search query.
      2. The query should be broad enough to find multiple relevant videos but specific enough to be accurate. For music, focus on the artist and genre. For topics, focus on the core subject.
      3. Respond ONLY with a valid JSON string, with no extra text or explanations.

      Example Response Format:
      "best search query goes here"
    `;

    try {
      console.log("Generating single search query...");
      const parsed = await this._callModel(prompt);
      const query =
        typeof parsed === "object"
          ? parsed.query || Object.values(parsed)[0]
          : parsed;
      console.log(`Generated single search query: "${query}"`);
      return query;
    } catch (error) {
      console.error("Error generating single search query:", error);
      throw new Error("Failed to generate search query.");
    }
  }

  /**
   * UPDATED METHOD: The main orchestrator method with the new, simpler logic.
   * @param {object} playlistData
   * @returns {Promise<object>}
   */
  async _executeSimplePlaylist(playlistData) {
    if (!playlistData.success || !playlistData.ready_to_execute) {
      throw new Error("Cannot execute playlist creation. Data is not ready.");
    }

    const params = playlistData.parameters;
    console.log("Starting playlist creation process...");

    // 1. Generate ONE search query using the LLM
    const singleQuery = await this._generateSingleSearchQuery(params);
    if (!singleQuery) {
      return { success: false, message: "Could not generate a search query." };
    }

    // 2. Create the empty playlist on YouTube
    const newPlaylist = await this.youtubeService.createPlaylist(
      params.playlist_name,
      params.description,
      params.privacy
    );
    if (!newPlaylist || !newPlaylist.id) {
      return { success: false, message: "Failed to create YouTube playlist." };
    }

    // 3. Search for multiple videos using the single query
    const videoIds = await this.youtubeService.searchForVideos(
      singleQuery,
      params.vid_count
    );
    if (videoIds.length === 0) {
      return {
        success: false,
        message: "Could not find any videos for the generated query.",
        playlistUrl: newPlaylist.url,
      };
    }

    // 4. Add the collected videos to the new playlist
    await this.youtubeService.addVideosToPlaylist(newPlaylist.id, videoIds);

    console.log("Playlist creation process completed!");

    const action_message = `Agent action: Created new YouTube playlist named "${params.playlist_name}" and added ${videoIds.length} videos. Playlist is available at ${newPlaylist.url}.`;

    return {
      success: true,
      message: `Successfully created playlist and added ${videoIds.length} videos.`,
      playlistUrl: newPlaylist.url,
      action_message: action_message,
    };
  }

  /**
   * NEW: Takes structured parameters and synthesizes them into an optimal search query.
   * @param {object} videoParams - The parameters extracted by handlePlayVideo.
   * @returns {Promise<string|null>} The final search query string.
   */
  async generateVideoSearchQuery(videoParams) {
    const { topic, creator, genre } = videoParams;

    const prompt = `
      You are a YouTube search query synthesis expert. Your task is to take structured parameters and create the single best search query to find relevant videos.

      Structured Parameters:
      - Topic: "${topic || "not specified"}"
      - Creator/Channel: "${creator || "not specified"}"
      - Genre: "${genre || "not specified"}"

      Instructions:
      1. Combine the provided parameters into a single, effective search query.
      2. Prioritize the most specific information. If a creator is mentioned, they should be prominent in the query.
      3. If the parameters are vague, create a broader, more general query.
      4. Respond ONLY with a valid JSON object with a single key named "query".

      Example Input: { topic: "new song", creator: "Tame Impala" }
      Example Response: {"query": "Tame Impala new song"}

      Example Input: { genre: "80s rock music" }
      Example Response: {"query": "best 80s rock music"}
    `;

    try {
      const parsed = await this._callModel(prompt);

      // Now that the format is guaranteed, we can directly access .query
      const query = parsed.query;

      if (!query) {
        throw new Error("Model returned a JSON object without a 'query' key.");
      }

      console.log(`Synthesized search query: "${query}"`);
      return query;
    } catch (error) {
      console.error("Error synthesizing search query:", error);
      return null;
    }
  }
}

module.exports = PlaylistBuilder;
