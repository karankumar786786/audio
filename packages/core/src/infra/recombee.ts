import * as recombee from "recombee-api-client";
import type { RecommendationSchema, RecommendationService } from "./recommendation.types.ts";
import type { Logger } from "../utils/index.ts";

const { ApiClient, requests } = recombee;

const SCHEMA_FIELDS: Record<
  Exclude<keyof RecommendationSchema, "id">,
  "string" | "int" | "double"
> = {
  fullId: "string",
  jobId: "string",
  createdAt: "string",
  title: "string",
  artistName: "string",
  duration: "double",
  songKey: "string",
  imageKey: "string",
  loudness: "double",
  dynamicComplexity: "double",
  bpm: "double",
  spectralCentroid: "double",
  spectralFlux: "double",
  zeroCrossingRate: "double",
  language: "string",
};

export class RecommbeeRecommendationService implements RecommendationService<RecommendationSchema> {
  private readonly client: InstanceType<typeof ApiClient>;
  private readonly DEFAULT_TIMEOUT = 10_000;
  private readonly logger: Logger;

  constructor(
    databaseId: string,
    privateToken: string,
    region: string = "us-west",
    logger: Logger
  ) {
    this.client = new ApiClient(databaseId, privateToken, { region });
    this.logger = logger;
  }

  private async send<T>(req: { timeout: number } & object): Promise<T> {
    req.timeout = this.DEFAULT_TIMEOUT;
    return (await this.client.send(req as any)) as T;
  }

  private stripId(signedId: string): string {
    if (!signedId) return "";
    return signedId.split(".")[0] || "";
  }

  async setUp(_schema: RecommendationSchema): Promise<void> {
    const batch = Object.entries(SCHEMA_FIELDS).map(([name, type]) => {
      const req = new requests.AddItemProperty(name, type);
      req.timeout = this.DEFAULT_TIMEOUT;
      return req;
    });

    const batchReq = new requests.Batch(batch);
    batchReq.timeout = this.DEFAULT_TIMEOUT;
    await this.client.send(batchReq);
  }

  async create(schema: RecommendationSchema): Promise<void> {
    const { id, ...properties } = schema;
    const baseId = this.stripId(id);
    const req = new requests.SetItemValues(baseId, properties, {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  async delete(id: string): Promise<void> {
    const req = new requests.DeleteItem(this.stripId(id));
    await this.send(req);
  }

  async addUser(userId: string): Promise<void> {
    const req = new requests.AddUser(this.stripId(userId));
    await this.send(req);
  }

  async addListen(userId: string, id: string, portion: number): Promise<void> {
    const req = new requests.SetViewPortion(this.stripId(userId), this.stripId(id), Math.min(1, Math.max(0, portion)), {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  async addLike(userId: string, id: string): Promise<void> {
    const req = new requests.AddBookmark(this.stripId(userId), this.stripId(id), {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  async addFavorite(userId: string, id: string): Promise<void> {
    const req = new requests.AddBookmark(this.stripId(userId), this.stripId(id), {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  async removeFavorite(userId: string, id: string): Promise<void> {
    const req = new requests.DeleteBookmark(this.stripId(userId), this.stripId(id));
    await this.send(req);
  }

  async addToPlaylist(userId: string, id: string): Promise<void> {
    const req = new requests.AddCartAddition(this.stripId(userId), this.stripId(id), {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  async removeFromPlaylist(userId: string, id: string): Promise<void> {
    const req = new requests.DeleteCartAddition(this.stripId(userId), this.stripId(id));
    await this.send(req);
  }

  async recommendUser(
    userId: string,
    limit: number
  ): Promise<Partial<RecommendationSchema>[]> {
    const strippedId = this.stripId(userId);
    try {
      const req = new requests.RecommendItemsToUser(strippedId, limit, {
        cascadeCreate: true,
        returnProperties: true,
        includedProperties: [
          "fullId",
          "jobId",
          "createdAt",
          "title",
          "artistName",
          "duration",
          "songKey",
          "imageKey",
          "language",
        ],
        diversity: 0.2,
        rotationRate: 0.2,
        rotationTime: 1200,
      });

      const result = await this.send<{
        recomms: Array<{ id: string; values?: Record<string, unknown> }>;
      }>(req);

      this.logger.info(`[RECOMBEE] Recommendation for ${strippedId} returned ${result.recomms?.length ?? 0} items`);

      return (result.recomms || []).map((r) => ({
        id: r.id,
        ...(r.values as Omit<RecommendationSchema, "id">),
      }));
    } catch (err: any) {
      this.logger.error(`[RECOMBEE] Error fetching recommendations for ${strippedId}: ${err.message || err}`);
      return [];
    }
  }

  async resetDatabase(): Promise<void> {
    this.logger.info(`[RECOMBEE] Resetting whole database`);
    const req = new requests.ResetDatabase();
    await this.send(req);
  }
}
