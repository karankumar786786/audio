export interface SongRecord {
    id: string;
    title: string;
    artistName: string;
    duration: number;
    songKey: string;
    imageKey: string;
    language: string;
}

export interface ArtistRecord {
    id: string;
    name: string;
    about: string;
    dob: string;
    coverImageKey: string;
    bannerImageKey: string;
}

export interface PlaylistRecord {
    id: string;
    name: string;
    coverImageKey: string;
    bannerImageKey: string;
}

export type SearchRecord = SongRecord | ArtistRecord | PlaylistRecord;

export interface SearchService<T> {
    save(record: T): Promise<string>;
    search<R = T>(query: string): Promise<R[]>;
    setSettings(attributes: string[]): Promise<void>;
    delete(objectID: string): Promise<void>;
    clearIndex(): Promise<void>;
    deleteIndex(): Promise<void>;
}
