// THIS FILE CONTAINS METHODS TO INTERACT WITH THE YOUTUBE API IN PREDEFINED MANNERS

const { google } = require("googleapis");

class YouTubeService {
  /**
   * @param {OAuth2Client} oAuth2Client - A pre-authenticated Google OAuth2 client.
   */
  constructor(oAuth2Client) {
    if (!oAuth2Client) {
      throw new Error(
        "YouTubeService requires an authenticated OAuth2 client."
      );
    }
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
        videoDefinition: "high",
        maxResults: count,
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
      console.error("[API ERROR] Failed to create playlist.");
      if (error.response && error.response.data) {
        console.error("DETAILS:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("FULL ERROR:", error.message);
      }
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
        maxResults: 50,
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
      return [];
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
        part: "snippet,contentDetails",
        id: videoIds.join(","),
      });

      return response.data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        duration: item.contentDetails.duration,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    } catch (error) {
      console.error("[API ERROR] Failed to get video details:", error.message);
      return [];
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
        part: "snippet,contentDetails",
        mine: true,
        maxResults: 50,
      });

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
      return [];
    }
  }

  /**
   * Fetches ALL video items from a specific playlist, handling pagination.
   * @param {string} playlistId - The ID of the playlist.
   * @returns {Promise<Array<string>>} An array of all video IDs from the playlist.
   */
  async getPlaylistItems(playlistId) {
    console.log(`[API] Fetching all items for playlist ID: ${playlistId}`);
    let allVideoIds = [];
    let nextPageToken = null;

    try {
      do {
        const response = await this.youtube.playlistItems.list({
          part: "snippet",
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        const videoIds = response.data.items.map(
          (item) => item.snippet.resourceId.videoId
        );
        allVideoIds = allVideoIds.concat(videoIds);

        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      console.log(`[API] Found a total of ${allVideoIds.length} items.`);
      return allVideoIds;
    } catch (error) {
      console.error("[API ERROR] Failed to fetch all playlist items:", error);
      return [];
    }
  }

  /**
   * Adds a single video to a specified playlist.
   * @param {string} playlistId - The ID of the target playlist.
   * @param {string} videoId - The ID of the video to add.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async addVideoToPlaylist(playlistId, videoId) {
    console.log(`[API] Adding video ${videoId} to playlist ${playlistId}...`);
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
      return { success: true, message: "Video added successfully." };
    } catch (error) {
      console.error("[API ERROR] Failed to add video to playlist:", error);
      return { success: false, message: "Failed to add video." };
    }
  }

  async addVideosToPlaylist(playlistId, videoIds) {
    console.log(
      `[API] Adding ${videoIds.length} videos to playlist ${playlistId}...`
    );
    for (const videoId of videoIds) {
      await this.addVideoToPlaylist(playlistId, videoId);
    }
    return { success: true, message: `${videoIds.length} videos added.` };
  }

  /**
   * Removes a video from a specific playlist.
   * This requires finding the video's unique playlistItemId first.
   * @param {string} playlistId - The ID of the target playlist.
   * @param {string} videoId - The ID of the video to remove.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async removeVideoFromPlaylist(playlistId, videoId) {
    console.log(
      `[API] Attempting to remove video ${videoId} from playlist ${playlistId}...`
    );
    try {
      let playlistItemId = null;
      let nextPageToken = null;

      do {
        const response = await this.youtube.playlistItems.list({
          part: "snippet",
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        const foundItem = response.data.items.find(
          (item) => item.snippet.resourceId.videoId === videoId
        );

        if (foundItem) {
          playlistItemId = foundItem.id;
          break;
        }

        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      if (!playlistItemId) {
        throw new Error("Video not found in this playlist.");
      }

      await this.youtube.playlistItems.delete({
        id: playlistItemId,
      });

      console.log(`[API] Successfully removed item ${playlistItemId}.`);
      return { success: true, message: "Video removed successfully." };
    } catch (error) {
      console.error(
        "[API ERROR] Failed to remove video from playlist:",
        error.message
      );
      return { success: false, message: "Failed to remove video." };
    }
  }

  async removeVideosFromPlaylist(playlistId, videoIds) {
    console.log(
      `[API] Removing ${videoIds.length} videos from playlist ${playlistId}...`
    );
    for (const videoId of videoIds) {
      await this.removeVideoFromPlaylist(playlistId, videoId);
    }
    return { success: true, message: `${videoIds.length} videos removed.` };
  }

  async renamePlaylist(playlistId, newTitle) {
    try {
      await this.youtube.playlists.update({
        part: "snippet",
        requestBody: {
          id: playlistId,
          snippet: {
            title: newTitle,
          },
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to rename playlist:", error);
      return { success: false };
    }
  }
}

module.exports = YouTubeService;
