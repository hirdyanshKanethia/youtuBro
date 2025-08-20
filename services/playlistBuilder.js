// playlistBuilder.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const YouTubeService = require('./youtubeService');

class PlaylistBuilder {
  constructor(geminiApiKey, youtubeApiKey) {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.youtubeService = new YouTubeService(youtubeApiKey);
  }

  /**
   * Uses Gemini to generate a list of YouTube search queries.
   * @param {object} playlistParams - The parameters object from your handleMakePlaylist function.
   * @returns {Promise<string[]>} An array of search query strings.
   */
  async generateSearchQueries(playlistParams) {
    const { content_creator, description, content_type, vid_count } = playlistParams;

    const prompt = `
      You are a YouTube search query expert. Your task is to generate a list of YouTube search queries to find videos for a playlist based on the following parameters.

      Playlist Parameters:
      - Content Type: "${content_type}"
      - Creator / Artist: "${content_creator}"
      - Description: "${description}"
      - Number of videos required: ${vid_count}

      Instructions:
      1. Generate exactly ${vid_count} distinct search queries.
      2. The queries should be diverse to find a good mix of relevant videos. For music, include specific song titles, "live performance", "official video", and artist collaborations. For educational content, include different sub-topics.
      3. Focus on creating queries that would yield high-quality, popular results on YouTube.
      4. Respond ONLY with a valid JSON array of strings, with no extra text or explanations.

      Example Response Format:
      [
        "query 1",
        "query 2",
        "query 3"
      ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not parse search queries from LLM response.");
      }
      
      const queries = JSON.parse(jsonMatch[0]);
      console.log(`Generated ${queries.length} search queries.`);
      return queries;

    } catch (error) {
      console.error("Error generating search queries:", error);
      throw new Error("Failed to generate search queries.");
    }
  }

  /**
   * The main orchestrator method to create the full playlist.
   * @param {object} playlistData - The full data object from your handleMakePlaylist function.
   * @returns {Promise<object>} A promise that resolves to the final result.
   */
  async execute(playlistData) {
    if (!playlistData.success || !playlistData.ready_to_execute) {
        throw new Error("Cannot execute playlist creation. Data is not ready.");
    }

    const params = playlistData.parameters;
    console.log('Starting playlist creation process...');

    // 1. Generate search queries using the LLM
    const queries = await this.generateSearchQueries(params);
    if (!queries || queries.length === 0) {
        return { success: false, message: "Could not generate any search queries." };
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

    // 3. Search for each video and collect their IDs
    const videoIdPromises = queries.map(q => this.youtubeService.searchForVideoId(q));
    const videoIds = (await Promise.all(videoIdPromises)).filter(id => id !== null); // Filter out any failed searches

    if (videoIds.length === 0) {
        return { success: false, message: "Could not find any videos for the generated queries.", playlistUrl: newPlaylist.url };
    }
    
    // 4. Add the collected videos to the new playlist
    await this.youtubeService.addVideosToPlaylist(newPlaylist.id, videoIds);

    console.log('Playlist creation process completed!');
    return {
        success: true,
        message: `Successfully created playlist and added ${videoIds.length} videos.`,
        playlistUrl: newPlaylist.url,
    };
  }
}

module.exports = PlaylistBuilder;