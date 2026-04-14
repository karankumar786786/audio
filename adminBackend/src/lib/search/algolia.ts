import { algoliasearch } from "algoliasearch";
import type { SearchClient } from "algoliasearch";
import type { SearchRecord, SearchService } from "./index.types";
import type { Logger } from "../../observablity";


export class AlgoliaSearchService implements SearchService<SearchRecord> {

    private readonly client: SearchClient;
    private readonly indexName: string;
    private readonly logger: Logger;

    constructor(appId: string, apiKey: string, indexName: string, logger: Logger) {
        this.client = algoliasearch(appId, apiKey);
        this.indexName = indexName;
        this.logger = logger;
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
        return hits as T[];
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

    async clearIndex(): Promise<void> {
        this.logger.info(`[ALGOLIA] Clearing index: ${this.indexName}`);
        await this.client.clearObjects({
            indexName: this.indexName,
        });
    }

    async deleteIndex(): Promise<void> {
        this.logger.info(`[ALGOLIA] Deleting index: ${this.indexName}`);
        await this.client.deleteIndex({
            indexName: this.indexName,
        });
    }
}
