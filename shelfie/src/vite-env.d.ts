declare module '*.css';

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
