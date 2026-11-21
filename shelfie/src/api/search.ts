import type { MediaType } from '../types';

export interface SearchSuggestion {
  id: string;
  title: string;
  coverUrl: string | undefined;
  year: number | undefined;
  genres: string[];
  synopsis: string;
  source: string;
  externalId: string;
}

const TVMAZE_URL = 'https://api.tvmaze.com';
const JIKAN_URL = 'https://api.jikan.moe/v4';
const OPEN_LIBRARY_URL = 'https://openlibrary.org';
const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1';
const METRON_URL = 'https://metron.cloud/api';
const ITUNES_URL = 'https://itunes.apple.com/search';

function getTMDBKey(): string | undefined {
  return import.meta.env.VITE_TMDB_API_KEY;
}

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchTVShows(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  const [tvmaze, tmdb] = await Promise.allSettled([
    searchTVMaze(query, signal),
    getTMDBKey() ? searchTMDBTV(query, signal) : Promise.resolve([]),
  ]);

  const results: SearchSuggestion[] = [];
  if (tvmaze.status === 'fulfilled') results.push(...tvmaze.value);
  if (tmdb.status === 'fulfilled') results.push(...tmdb.value);

  return deduplicate(results).slice(0, 10);
}

async function searchTVMaze(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const data = await fetchJSON<any[]>(`${TVMAZE_URL}/search/shows?q=${encodeURIComponent(query)}`, signal);
  if (!data) return [];

  return data
    .filter(item => item.score > 0.5 && item.show)
    .map(item => {
      const show = item.show;
      return {
        id: `tvmaze-${show.id}`,
        title: show.name,
        coverUrl: show.image?.original || show.image?.medium,
        year: show.premiered ? parseInt(show.premiered.split('-')[0]) : undefined,
        genres: [show.network?.name || show.webChannel?.name].filter(Boolean) as string[],
        synopsis: show.summary?.replace(/<[^>]+>/g, '') || '',
        source: 'tvmaze',
        externalId: show.id.toString(),
      };
    });
}

async function searchTMDBTV(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const key = getTMDBKey();
  if (!key) return [];

  const data = await fetchJSON<any>(
    `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`,
    signal
  );
  if (!data?.results) return [];

  return data.results.map((show: any) => ({
    id: `tmdb-tv-${show.id}`,
    title: show.name,
    coverUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
    year: show.first_air_date ? parseInt(show.first_air_date.split('-')[0]) : undefined,
    genres: [],
    synopsis: show.overview || '',
    source: 'tmdb',
    externalId: show.id.toString(),
  }));
}

export async function searchMovies(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  const key = getTMDBKey();
  if (!key) {
    // Fallback to iTunes for movies if no TMDB key
    return searchITunes(query, 'movie', signal);
  }

  const data = await fetchJSON<any>(
    `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`,
    signal
  );
  if (!data?.results) return [];

  return data.results.map((movie: any) => ({
    id: `tmdb-movie-${movie.id}`,
    title: movie.title,
    coverUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined,
    genres: [],
    synopsis: movie.overview || '',
    source: 'tmdb',
    externalId: movie.id.toString(),
  })).slice(0, 10);
}

export async function searchAnime(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  const data = await fetchJSON<any>(
    `${JIKAN_URL}/anime?q=${encodeURIComponent(query)}&limit=15&sfw=true`,
    signal
  );
  if (!data?.data) return [];

  return data.data.map((anime: any) => ({
    id: `jikan-${anime.mal_id}`,
    title: anime.title_english || anime.title,
    coverUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
    year: anime.year,
    genres: anime.studios?.map((s: any) => s.name).filter(Boolean) || [],
    synopsis: anime.synopsis || '',
    source: 'jikan',
    externalId: anime.mal_id.toString(),
  })).slice(0, 10);
}

export async function searchComics(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  // Try Metron first (no API key required)
  const data = await fetchJSON<any>(
    `${METRON_URL}/search?q=${encodeURIComponent(query)}&limit=15`,
    signal
  );
  if (!data?.results) return [];

  return data.results
    .filter((item: any) => item.name)
    .map((item: any) => ({
      id: `metron-${item.id || Math.random().toString(36).slice(2)}`,
      title: item.name,
      coverUrl: item.cover_url,
      year: item.year,
      genres: [item.publisher, item.volume].filter(Boolean) as string[],
      synopsis: item.description || '',
      source: 'metron',
      externalId: (item.id as string) || '',
    })).slice(0, 10);
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  const [openLib, googleBooks] = await Promise.allSettled([
    searchOpenLibrary(query, signal),
    searchGoogleBooks(query, signal),
  ]);

  const results: SearchSuggestion[] = [];
  if (openLib.status === 'fulfilled') results.push(...openLib.value);
  if (googleBooks.status === 'fulfilled') results.push(...googleBooks.value);

  return deduplicate(results).slice(0, 10);
}

async function searchOpenLibrary(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const data = await fetchJSON<any>(
    `${OPEN_LIBRARY_URL}/search.json?q=${encodeURIComponent(query)}&limit=15`,
    signal
  );
  if (!data?.docs) return [];

  return data.docs
    .filter((book: any) => book.title)
    .map((book: any) => {
      const coverUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : book.cover_edition_key
        ? `https://covers.openlibrary.org/b/OLID/${book.cover_edition_key}-L.jpg`
        : undefined;
      return {
        id: `ol-${book.key?.replace('/works/', '') || Math.random().toString(36).slice(2)}`,
        title: book.title,
        coverUrl,
        year: book.first_publish_year,
        genres: [book.author_name?.[0]].filter(Boolean) as string[],
        synopsis: '',
        source: 'openlibrary',
        externalId: book.key || '',
      };
    });
}

async function searchGoogleBooks(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const data = await fetchJSON<any>(
    `${GOOGLE_BOOKS_URL}/volumes?q=${encodeURIComponent(query)}&maxResults=15`,
    signal
  );
  if (!data?.items) return [];

  return data.items
    .map((item: any) => {
      const info = item.volumeInfo;
      if (!info.title) return null;
      return {
        id: `gb-${item.id}`,
        title: info.title,
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || info.imageLinks?.smallThumbnail?.replace('http:', 'https:'),
        year: info.publishedDate ? parseInt(info.publishedDate.split('-')[0]) : undefined,
        genres: [info.authors?.[0], info.publisher].filter(Boolean) as string[],
        synopsis: info.description || '',
        source: 'googlebooks',
        externalId: item.id,
      };
    })
    .filter(Boolean) as SearchSuggestion[];
}

async function searchITunes(query: string, media: 'movie' | 'tvShow' | 'ebook' | 'music', signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const entity = media === 'tvShow' ? 'tvSeason' : media === 'ebook' ? 'ebook' : media;
  const data = await fetchJSON<any>(
    `${ITUNES_URL}?term=${encodeURIComponent(query)}&media=${media}&entity=${entity}&limit=10`,
    signal
  );
  if (!data?.results) return [];

  return data.results.map((item: any) => ({
    id: `itunes-${item.trackId || item.collectionId}`,
    title: item.trackName || item.collectionName,
    coverUrl: item.artworkUrl100?.replace('100x100', '600x600'),
    year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined,
    genres: [item.primaryGenreName].filter(Boolean) as string[],
    synopsis: item.longDescription || item.shortDescription || '',
    source: 'itunes',
    externalId: (item.trackId || item.collectionId)?.toString() || '',
  }));
}

export async function searchByType(type: MediaType, query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  switch (type) {
    case 'tv':
      return searchTVShows(query, signal);
    case 'anime':
      return searchAnime(query, signal);
    case 'comic':
      return searchComics(query, signal);
    case 'movie':
      return searchMovies(query, signal);
    default:
      return [];
  }
}

function deduplicate(results: SearchSuggestion[]): SearchSuggestion[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.source}:${r.title.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getDetailsByExternalId(
  source: string,
  externalId: string,
  signal?: AbortSignal
): Promise<SearchSuggestion | null> {
  try {
    switch (source) {
      case 'tvmaze': {
        const data = await fetchJSON<any>(`${TVMAZE_URL}/shows/${externalId}?embed=episodes`, signal);
        if (!data) return null;
        return {
          id: `tvmaze-${data.id}`,
          title: data.name,
          coverUrl: data.image?.original || data.image?.medium,
          year: data.premiered ? parseInt(data.premiered.split('-')[0]) : undefined,
          genres: [data.network?.name, data.webChannel?.name].filter(Boolean) as string[],
          synopsis: data.summary?.replace(/<[^>]+>/g, '') || '',
          source: 'tvmaze',
          externalId: data.id.toString(),
        };
      }
      case 'tmdb':
      case 'tmdb-tv': {
        const key = getTMDBKey();
        if (!key) return null;
        const isTV = source === 'tmdb-tv';
        const data = await fetchJSON<any>(
          `https://api.themoviedb.org/3/${isTV ? 'tv' : 'movie'}/${externalId}?api_key=${key}&language=en-US`,
          signal
        );
        if (!data) return null;
        return {
          id: `${source}-${data.id}`,
          title: isTV ? data.name : data.title,
          coverUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
          year: (isTV ? data.first_air_date : data.release_date) ? parseInt((isTV ? data.first_air_date : data.release_date).split('-')[0]) : undefined,
          genres: [],
          synopsis: data.overview || '',
          source,
          externalId: data.id.toString(),
        };
      }
      case 'jikan': {
        const data = await fetchJSON<any>(`${JIKAN_URL}/anime/${externalId}`, signal);
        if (!data?.data) return null;
        const anime = data.data;
        return {
          id: `jikan-${anime.mal_id}`,
          title: anime.title_english || anime.title,
          coverUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
          year: anime.year,
          genres: anime.studios?.map((s: any) => s.name).filter(Boolean) || [],
          synopsis: anime.synopsis || '',
          source: 'jikan',
          externalId: anime.mal_id.toString(),
        };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}