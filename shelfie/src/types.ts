export type MediaType = 'tv' | 'movie' | 'comic' | 'anime';
export type MediaStatus = 'watching' | 'plan' | 'completed' | 'dropped';

export interface EpisodeProgress {
  number: number;
  title: string;
  watched: boolean;
  watchedAt?: string;
  rating?: number;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  currentProgress: number;
  totalProgress: number;
  coverImage: string;
  synopsis: string;
  releaseYear: number;
  genres: string[];
  unitName: 'Episode' | 'Issue' | 'Chapter' | 'Movie';
  episodes: EpisodeProgress[];
  rating: number;
  lastUpdated: string;
}

export const INITIAL_ITEMS: MediaItem[] = [];
