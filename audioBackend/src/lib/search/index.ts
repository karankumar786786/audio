import { algoliasearch } from "algoliasearch";
import type { SearchClient } from "algoliasearch";


export interface SongRecord {
    id: string;
    title: string;
    artistName: string;
    timeInMs: number;
    songUrl: string;
    imageUrl: string;
    language: string;
}

export interface ArtistRecord {
    id: string;
    name: string;
    about: string;
    dob: string;
    coverImageUrl: string;
    bannerImageUrl: string;
}

export interface SystemPlaylistRecord {
    id: string;
    name: string;
    coverImageUrl: string;
    bannerImageUrl: string;
}

export type SearchRecord = SongRecord | ArtistRecord | SystemPlaylistRecord;

export class AlgoliaService {

    private readonly client: SearchClient;
    private readonly indexName: string;

    constructor(appId: string, apiKey: string, indexName: string) {
        this.client = algoliasearch(appId, apiKey);
        this.indexName = indexName;
    }

    async save(record: SearchRecord): Promise<string> {
        const result = await this.client.saveObject({
            indexName: this.indexName,
            body: {
                ...record,
                objectID: record.id,
            },
        });
        if (!result.objectID) throw new Error("Algolia did not return an objectID");
        return result.objectID;
    }

    async search<T = SearchRecord>(query: string): Promise<T[]> {
        const { hits } = await this.client.searchSingleIndex<T>({
            indexName: this.indexName,
            searchParams: { query },
        });
        return hits;
    }

    async setSettings(attributes: string[]): Promise<void> {
        await this.client.setSettings({
            indexName: this.indexName,
            indexSettings: {
                searchableAttributes: attributes,
            },
        });
    }

    async delete(objectID: string): Promise<void> {
        await this.client.deleteObject({
            indexName: this.indexName,
            objectID,
        });
    }
}