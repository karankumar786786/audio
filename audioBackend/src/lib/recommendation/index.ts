import * as recombee from "recombee-api-client";

const { ApiClient, requests } = recombee;

export interface RecombeeItem {
    itemId: string;
    [key: string]: unknown;
}

export class RecombeeService {

    private readonly client: InstanceType<typeof ApiClient>;

    constructor(databaseId: string, privateToken: string, region: string = "us-west") {
        this.client = new ApiClient(databaseId, privateToken, { region });
    }

    async save(item: RecombeeItem): Promise<void> {
        const { itemId, ...properties } = item;
        await this.client.send(new requests.SetItemValues(itemId, properties, {
            cascadeCreate: true,
        }));
    }

    async recommend(userId: string, count: number = 10): Promise<string[]> {
        const result = await this.client.send(
            new requests.RecommendItemsToUser(userId, count, {
                cascadeCreate: true,
            })
        );
        return result.recomms.map((r: { id: string }) => r.id);
    }

    async delete(itemId: string): Promise<void> {
        await this.client.send(new requests.DeleteItem(itemId));
    }
}