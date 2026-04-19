export interface RecommendationService<T> {
  setUp(schema: T): Promise<void>;
  create(schema: T): Promise<void>;
  addUser(userId: string): Promise<void>;
  addListen(userId: string, id: string, portion: number): Promise<void>;
  addLike(userId: string, id: string): Promise<void>;
  addFavorite(userId: string, id: string): Promise<void>;
  removeFavorite(userId: string, id: string): Promise<void>;
  addToPlaylist(userId: string, id: string): Promise<void>;
  removeFromPlaylist(userId: string, id: string): Promise<void>;
  delete(id: string): Promise<void>;
  recommendUser(userId: string, limit: number): Promise<Partial<T>[]>;
  resetDatabase(): Promise<void>;
}

export interface RecommendationSchema {
  id: string;
  fullId: string;
  jobId: string;
  title: string;
  artistName: string;
  duration: number;
  songKey: string;
  imageKey: string;
  loudness: number;
  dynamicComplexity: number;
  bpm: number;
  spectralCentroid: number;
  spectralFlux: number;
  zeroCrossingRate: number;
  language: string;
}