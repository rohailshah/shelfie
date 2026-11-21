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

export const INITIAL_ITEMS: MediaItem[] = [
  {
    id: '1',
    title: 'House of the Dragon',
    type: 'tv',
    status: 'watching',
    currentProgress: 3,
    totalProgress: 26,
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    synopsis: 'An internal succession war within House Targaryen at the height of their power in Westeros.',
    releaseYear: 2022,
    genres: ['Fantasy', 'Drama', 'Action'],
    unitName: 'Episode',
    rating: 4.8,
    lastUpdated: '2026-06-01',
    episodes: Array.from({ length: 26 }, (_, i) => ({
      number: i + 1,
      title: i === 0 ? 'The Heirs of the Dragon' : i === 1 ? 'The Rogue Prince' : i === 2 ? 'Rhaenyra Triumphant' : `Episode ${i + 1}`,
      watched: i < 3,
      watchedAt: i < 3 ? '2026-05-28' : undefined
    }))
  },
  {
    id: '2',
    title: 'Stranger Things',
    type: 'tv',
    status: 'watching',
    currentProgress: 8,
    totalProgress: 34,
    coverImage: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop',
    synopsis: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    releaseYear: 2016,
    genres: ['Sci-Fi', 'Horror', 'Drama'],
    unitName: 'Episode',
    rating: 4.9,
    lastUpdated: '2026-06-02',
    episodes: Array.from({ length: 34 }, (_, i) => ({
      number: i + 1,
      title: i === 33 ? 'Chapter Eight: The Upside Down' : `Episode ${i + 1}`,
      watched: i < 8,
      watchedAt: i < 8 ? '2026-05-15' : undefined
    }))
  },
  {
    id: '3',
    title: 'The Boys',
    type: 'tv',
    status: 'watching',
    currentProgress: 8,
    totalProgress: 40,
    coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    synopsis: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.',
    releaseYear: 2019,
    genres: ['Action', 'Sci-Fi', 'Dark Comedy'],
    unitName: 'Episode',
    rating: 4.7,
    lastUpdated: '2026-05-20',
    episodes: Array.from({ length: 40 }, (_, i) => ({
      number: i + 1,
      title: i === 7 ? 'Blood and Bone' : `Episode ${i + 1}`,
      watched: i < 8,
      watchedAt: i < 8 ? '2026-05-20' : undefined
    }))
  },
  {
    id: '4',
    title: 'Batman: The Killing Joke',
    type: 'comic',
    status: 'completed',
    currentProgress: 1,
    totalProgress: 1,
    coverImage: 'https://images.unsplash.com/photo-1531256485687-3694303ae1bc?q=80&w=800&auto=format&fit=crop',
    synopsis: 'The Joker goes on a rampage to prove that any ordinary man can go insane after one bad day.',
    releaseYear: 1988,
    genres: ['Comic', 'DC', 'Noir'],
    unitName: 'Issue',
    rating: 5.0,
    lastUpdated: '2026-04-10',
    episodes: [
      { number: 1, title: 'The Killing Joke (One-Shot)', watched: true, watchedAt: '2026-04-10' }
    ]
  },
  {
    id: '5',
    title: 'Attack on Titan',
    type: 'anime',
    status: 'watching',
    currentProgress: 75,
    totalProgress: 89,
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    synopsis: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans.',
    releaseYear: 2013,
    genres: ['Anime', 'Action', 'Dark Fantasy'],
    unitName: 'Episode',
    rating: 5.0,
    lastUpdated: '2026-06-03',
    episodes: Array.from({ length: 89 }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`,
      watched: i < 75,
      watchedAt: i < 75 ? '2026-06-03' : undefined
    }))
  },
  {
    id: '6',
    title: 'Interstellar',
    type: 'movie',
    status: 'completed',
    currentProgress: 1,
    totalProgress: 1,
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
    synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    releaseYear: 2014,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    unitName: 'Movie',
    rating: 5.0,
    lastUpdated: '2026-01-15',
    episodes: [
      { number: 1, title: 'Full Feature Film', watched: true, watchedAt: '2026-01-15' }
    ]
  },
  {
    id: '7',
    title: 'One Piece',
    type: 'anime',
    status: 'watching',
    currentProgress: 1050,
    totalProgress: 1110,
    coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    synopsis: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gol D. Roger.',
    releaseYear: 1999,
    genres: ['Anime', 'Adventure', 'Action'],
    unitName: 'Episode',
    rating: 4.9,
    lastUpdated: '2026-06-04',
    episodes: Array.from({ length: 1110 }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`,
      watched: i < 1050,
      watchedAt: i < 1050 ? '2026-06-04' : undefined
    }))
  },
  {
    id: '8',
    title: 'Saga',
    type: 'comic',
    status: 'watching',
    currentProgress: 54,
    totalProgress: 66,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    synopsis: 'Two lovers from long-warring space factions struggle to raise their child in a galactic conflict.',
    releaseYear: 2012,
    genres: ['Comic', 'Sci-Fi', 'Indie'],
    unitName: 'Issue',
    rating: 4.9,
    lastUpdated: '2026-05-10',
    episodes: Array.from({ length: 66 }, (_, i) => ({
      number: i + 1,
      title: `Issue #${i + 1}`,
      watched: i < 54,
      watchedAt: i < 54 ? '2026-05-10' : undefined
    }))
  }
];
