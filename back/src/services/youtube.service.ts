import axios from 'axios';

export interface YouTubeVideo {
  title: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
}

export interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
}

export class YouTubeService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for YouTube videos related to things to do in a specific location
   * @param location - The location name to search for
   * @param maxResults - Maximum number of results to return (default: 5)
   * @returns Promise<YouTubeVideo[]> - Array of video suggestions
   */
  async searchThingsToDo(location: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
    try {
      const searchQuery = `things to do in ${location}`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const response = await axios.get<YouTubeSearchResponse>(
        `${this.baseUrl}/search?q=${encodedQuery}&maxResults=${maxResults}`,
        {
          timeout: 60000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Validate response structure
      if (!response.data || !Array.isArray(response.data.videos)) {
        throw new Error('Invalid response format from YouTube API');
      }

      // Validate each video object
      const videos = response.data.videos.map((video: any) => {
        if (!video.title || !video.url || !video.thumbnail || !video.channelTitle) {
          throw new Error('Invalid video object structure');
        }
        return {
          title: video.title,
          url: video.url,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle
        } as YouTubeVideo;
      });

      return videos;
    } catch (error) {
      console.error('YouTube API error:', error);
      
      // Return empty array instead of throwing to avoid breaking the main flow
      // The weather search should still work even if YouTube suggestions fail
      return [];
    }
  }

  /**
   * Search for YouTube videos with a custom query
   * @param query - The search query
   * @param maxResults - Maximum number of results to return (default: 5)
   * @returns Promise<YouTubeVideo[]> - Array of video suggestions
   */
  async searchVideos(query: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      
      const response = await axios.get<YouTubeSearchResponse>(
        `${this.baseUrl}/search?q=${encodedQuery}&maxResults=${maxResults}`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Validate response structure
      if (!response.data || !Array.isArray(response.data.videos)) {
        throw new Error('Invalid response format from YouTube API');
      }

      // Validate each video object
      const videos = response.data.videos.map((video: any) => {
        if (!video.title || !video.url || !video.thumbnail || !video.channelTitle) {
          throw new Error('Invalid video object structure');
        }
        return {
          title: video.title,
          url: video.url,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle
        } as YouTubeVideo;
      });

      return videos;
    } catch (error) {
      console.error('YouTube API error:', error);
      return [];
    }
  }
}
