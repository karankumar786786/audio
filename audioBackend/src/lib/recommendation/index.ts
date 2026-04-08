import * as recombee from "recombee-api-client";

const { ApiClient, requests } = recombee;

export interface RecombeeItem {
    itemId: string;
    [key: string]: unknown;
}

export class RecombeeService {

    private readonly client: InstanceType<typeof ApiClient>;

    constructor(
        databaseId: string,
        privateToken: string,
        region: string = "us-west"
        ) {
        this.client = new ApiClient(databaseId, privateToken, { region });
    }

    async save(item: RecombeeItem): Promise<void> {
        const { itemId, ...properties } = item;
        const req = new requests.SetItemValues(itemId, properties, {
            cascadeCreate: true,
        });
        req.timeout = 10000;
        await this.client.send(req);
    }

    async recommend(userId: string, count: number = 10): Promise<string[]> {
        const req = new requests.RecommendItemsToUser(userId, count, {
            cascadeCreate: true,
        });
        req.timeout = 10000;
        const result = await this.client.send(req);
        return result.recomms.map((r: { id: string }) => r.id);
    }

    async delete(itemId: string): Promise<void> {
        const req = new requests.DeleteItem(itemId);
        req.timeout = 10000;
        await this.client.send(req);
    }
}