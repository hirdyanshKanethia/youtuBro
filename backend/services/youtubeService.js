// backend/services/youtubeService.js

const { google } = require("googleapis");

class YouTubeService {
  /**
   * The constructor now accepts an authenticated oAuth2Client.
   * @param {OAuth2Client} oAuth2Client - A pre-authenticated Google OAuth2 client.
   */
  constructor(oAuth2Client) {
    if (!oAuth2Client) {
      throw new Error(
        "YouTubeService requires an authenticated OAuth2 client."
      );
    }
    // Create a new YouTube API client with the user's authentication
    this.youtube = google.youtube({ version: "v3", auth: oAuth2Client });
  }

  /**
   * METHOD: Searches for multiple videos and returns their IDs.
   * @param {string} query - The search query.
   * @param {number} count - The number of results to return.
   * @returns {Promise<string[]>} A promise that resolves to an array of video IDs.
   */
  async searchForVideos(query, count) {
    console.log(
      `[API] Searching for ${count} videos with query: "${query}"...`
    );
    try {
      const response = await this.youtube.search.list({
        part: "snippet",
        q: query,
        type: "video",
        // videoDuration: 'medium',
        videoDefinition: "high",
        maxResults: count, // Fetch multiple results
      });

      const items = response.data.items;
      if (items && items.length > 0) {
        const videoIds = items.map((item) => item.id.videoId);
        console.log(`[API] Found ${videoIds.length} video IDs.`);
        return videoIds;
      }
      console.log(`[API] No videos found for query: "${query}"`);
      return [];
    } catch (error) {
      console.error(
        `[API ERROR] Failed during video search for query: "${query}"`,
        error.message
      );
      throw new Error("Video search failed in YouTubeService.");
    }
  }

  /**
   * REAL: Creates a new playlist.
   */
  async createPlaylist(name, description, privacy) {
    console.log(`[API] Creating playlist: "${name}"...`);
    try {
      const response = await this.youtube.playlists.insert({
        part: "snippet,status",
        requestBody: {
          snippet: {
            title: name,
            description: description,
          },
          status: {
            privacyStatus: privacy,
          },
        },
      });

      const playlist = response.data;
      console.log(
        `[API] Successfully created playlist with ID: ${playlist.id}`
      ); // Success log
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        url: `https://www.youtube.com/playlist?list=${playlist.id}`,
      };
    } catch (error) {
      // This block will catch the error and give you details
      console.error("[API ERROR] Failed to create playlist.");
      if (error.response && error.response.data) {
        // Log the specific error details from the Google API response
        console.error("DETAILS:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("FULL ERROR:", error.message);
      }
      // Re-throw the error so the main process knows it failed
      throw new Error("Playlist creation failed in YouTubeService.");
    }
  }

  /**
   * Searches for a single video and returns its ID.
   * This is required for the roadmap feature.
   * @param {string} query - The search query.
   * @returns {Promise<string|null>} A promise that resolves to a video ID.
   */
  async searchForVideoId(query) {
    console.log(`[API] Searching for top video with query: "${query}"...`);
    try {
      const response = await this.youtube.search.list({
        part: "snippet",
        q: query,
        type: "video",
        // videoDuration: 'medium',
        videoDefinition: "high",
        maxResults: 1,
      });
      const videoId = response.data.items?.[0]?.id?.videoId;
      if (videoId) {
        console.log(`[API] Found video ID: ${videoId}`);
        return videoId;
      }
      return null;
    } catch (error) {
      console.error(`[API ERROR] Search for video ID failed:`, error.message);
      return null;
    }
  }

  /**
   * REAL: Adds a list of videos to a specified playlist.
   */
  async addVideosToPlaylist(playlistId, videoIds) {
    console.log(
      `[API] Adding ${videoIds.length} videos to playlist ID: ${playlistId}...`
    );
    for (const videoId of videoIds) {
      try {
        await this.youtube.playlistItems.insert({
          part: "snippet",
          requestBody: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: "youtube#video",
                videoId: videoId,
              },
            },
          },
        });
      } catch (error) {
        console.error(
          `[API] Failed to add video ${videoId} to playlist ${playlistId}:`,
          error.message
        );
      }
    }
    console.log("[API] Finished adding videos.");
    return { success: true, itemsAdded: videoIds.length };
  }

  /**
   * Fetches all playlists for the authenticated user.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of playlist objects.
   */
  async getUsersPlaylists() {
    console.log("[API] Fetching user playlists...");
    try {
      const response = await this.youtube.playlists.list({
        part: "snippet",
        mine: true,
        maxResults: 50, // You can fetch up to 50 playlists at a time
      });

      const playlists = response.data.items.map((item) => ({
        id: item.id,
        name: item.snippet.title,
      }));

      console.log(`[API] Found ${playlists.length} playlists.`);
      return playlists;
    } catch (error) {
      console.error(
        "[API ERROR] Failed to fetch user playlists:",
        error.message
      );
      return []; // Return an empty array on failure
    }
  }

  /**
   * Deletes a playlist by its ID.
   * @param {string} playlistId - The ID of the playlist to delete.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deletePlaylist(playlistId) {
    console.log(`[API] Deleting playlist with ID: ${playlistId}...`);
    try {
      await this.youtube.playlists.delete({
        id: playlistId,
      });
      console.log(`[API] Successfully deleted playlist ${playlistId}.`);
      return { success: true, message: "Playlist deleted successfully." };
    } catch (error) {
      console.error(
        `[API ERROR] Failed to delete playlist ${playlistId}:`,
        error.message
      );
      return { success: false, message: "Failed to delete playlist." };
    }
  }

  /**
   * NEW METHOD: Gets full details for a list of video IDs.
   * @param {string[]} videoIds - An array of video IDs.
   * @returns {Promise<Array<Object>>} An array of video detail objects.
   */
  async getVideoDetails(videoIds) {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }
    try {
      const response = await this.youtube.videos.list({
        part: "snippet,contentDetails", // Requesting snippet (title, thumbnail) and contentDetails (duration)
        id: videoIds.join(","), // Combine all IDs into a single, comma-separated string
      });

      // Map the API response to a cleaner format for your frontend
      return response.data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        duration: item.contentDetails.duration, // e.g., "PT5M3S"
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    } catch (error) {
      console.error("[API ERROR] Failed to get video details:", error.message);
      return []; // Return an empty array on failure
    }
  }

  /**
   * Fetches all playlists for the authenticated user.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of playlist objects.
   */
  async getUsersPlaylists() {
    console.log("[API] Fetching user playlists...");
    try {
      const response = await this.youtube.playlists.list({
        part: "snippet,contentDetails", // Get snippet (title, etc.) and contentDetails (itemCount)
        mine: true,
        maxResults: 50, // You can fetch up to 50 playlists at a time
      });

      // Map the response to a clean format for your frontend
      const playlists = response.data.items.map((item) => ({
        id: item.id,
        name: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        videoCount: item.contentDetails.itemCount,
      }));

      console.log(`[API] Found ${playlists.length} playlists.`);
      return playlists;
    } catch (error) {
      console.error(
        "[API ERROR] Failed to fetch user playlists:",
        error.message
      );
      return []; // Return an empty array on failure
    }
  }

  /**
   * NEW METHOD: Fetches all video items from a specific playlist.
   * @param {string} playlistId - The ID of the playlist.
   * @returns {Promise<Array<Object>>} An array of video objects from the playlist.
   */
  async getPlaylistItems(playlistId) {
    console.log(`[API] Fetching items for playlist ID: ${playlistId}...`);
    try {
      const response = await this.youtube.playlistItems.list({
        part: "snippet",
        playlistId: playlistId,
        maxResults: 50, // The YouTube API max for this endpoint
      });

      // Map the response to a clean format
      const videoIds = response.data.items.map(
        (item) => item.snippet.resourceId.videoId
      );

      console.log(`[API] Found ${videoIds.length} items.`);
      // We return the IDs, and can get details later if needed
      return videoIds;
    } catch (error) {
      console.error(
        "[API ERROR] Failed to fetch playlist items:",
        error.message
      );
      return [];
    }
  }
}

module.exports = YouTubeService;
