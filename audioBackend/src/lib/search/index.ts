import { algoliasearch } from "algoliasearch";
import type { SearchClient } from "algoliasearch";

export interface AlgoliaRecord {
    objectID?: string;
    [key: string]: unknown;
}

export class AlgoliaService {

    private readonly client: SearchClient;
    private readonly indexName: string;

    constructor(appId: string, apiKey: string, indexName: string) {
        this.client    = algoliasearch(appId, apiKey);
        this.indexName = indexName;
    }

    async save(record: AlgoliaRecord): Promise<string> {
        const result = await this.client.saveObject({
            indexName: this.indexName,
            body:      record,
        });
        if (!result.objectID) throw new Error("Algolia did not return an objectID");
        return result.objectID;
    }

    async search<T = AlgoliaRecord>(query: string): Promise<T[]> {
        const { hits } = await this.client.searchSingleIndex<T>({
            indexName:    this.indexName,
            searchParams: { query },
        });
        return hits;
    }

    async delete(objectID: string): Promise<void> {
        await this.client.deleteObject({
            indexName: this.indexName,
            objectID,
        });
    }
}