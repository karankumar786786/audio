import * as recombee from "recombee-api-client";
import type { RecommendationSchema, RecommendationService } from "./index.types";
import type { Logger } from "../../observability";


const { ApiClient, requests } = recombee;


/**
 * Field type map used when initialising the Recombee item catalogue.
 * Every property of RecommendationSchema (except itemId, which is the
 * Recombee item identifier, not a stored value) must appear here.
 */
const SCHEMA_FIELDS: Record<
  Exclude<keyof RecommendationSchema, "id">,
  "string" | "int" | "double"
> = {
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

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async send<T>(req: { timeout: number } & object): Promise<T> {
    req.timeout = this.DEFAULT_TIMEOUT;
    return (await this.client.send(req as any)) as T;
  }

  // ---------------------------------------------------------------------------
  // Schema / catalogue setup
  // ---------------------------------------------------------------------------

  /**
   * Registers all item properties (fields) in the Recombee catalogue.
   * Safe to call multiple times – Recombee ignores duplicate AddItemProperty
   * requests for properties that already exist.
   *
   * @param _schema  Unused at runtime; kept in the signature to satisfy the
   *                 interface so callers can pass a representative item for
   *                 documentation purposes.
   */
  async setUp(_schema: RecommendationSchema): Promise<void> {
    const batch = Object.entries(SCHEMA_FIELDS).map(([name, type]) => {
      const req = new requests.AddItemProperty(name, type);
      req.timeout = this.DEFAULT_TIMEOUT;
      return req;
    });

    // Recombee's Batch request accepts up to 10,000 operations.
    const batchReq = new requests.Batch(batch);
    batchReq.timeout = this.DEFAULT_TIMEOUT;
    await this.client.send(batchReq);
  }

  // ---------------------------------------------------------------------------
  // Item CRUD
  // ---------------------------------------------------------------------------

  /**
   * Creates or fully replaces an item in the Recombee catalogue.
   * Uses SetItemValues with cascadeCreate so the item is created if it does
   * not yet exist.
   */
  async create(schema: RecommendationSchema): Promise<void> {
    const { id, ...properties } = schema;
    const req = new requests.SetItemValues(id, properties, {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  /**
   * Deletes an item and all associated interaction data from the catalogue.
   */
  async delete(id: string): Promise<void> {
    const req = new requests.DeleteItem(id);
    await this.send(req);
  }

  // ---------------------------------------------------------------------------
  // User management
  // ---------------------------------------------------------------------------

  /**
   * Ensures a user exists in Recombee (no-op if already present).
   */
  async addUser(userId: string): Promise<void> {
    const req = new requests.AddUser(userId);
    // cascadeCreate is the default for AddUser – no extra option needed.
    await this.send(req);
  }

  // ---------------------------------------------------------------------------
  // Interaction tracking
  // ---------------------------------------------------------------------------

  /**
   * Records a "detail view" / listen interaction.
   *
   * @param userId   Recombee user identifier.
   * @param id       Item (track) identifier.
   * @param portion  Fraction of the track actually listened to [0, 1].
   *                 Maps to Recombee's `portion` field on DetailView.
   */
  async addListen(userId: string, id: string, portion: number): Promise<void> {
    const req = new requests.SetViewPortion(userId, id, Math.min(1, Math.max(0, portion)), {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  /**
   * Records a "bookmark" (like / save) interaction.
   *
   * @param userId  Recombee user identifier.
   * @param id      Item (track) identifier.
   */
  async addLike(userId: string, id: string): Promise<void> {
    const req = new requests.AddBookmark(userId, id, {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  /**
   * Records a "favorite" interaction (alias for Bookmark).
   */
  async addFavorite(userId: string, id: string): Promise<void> {
    const req = new requests.AddBookmark(userId, id, {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  /**
   * Removes a "favorite" interaction.
   */
  async removeFavorite(userId: string, id: string): Promise<void> {
    const req = new requests.DeleteBookmark(userId, id);
    await this.send(req);
  }

  /**
   * Records an "add to playlist" interaction (mapped to CartAddition).
   */
  async addToPlaylist(userId: string, id: string): Promise<void> {
    const req = new requests.AddCartAddition(userId, id, {
      cascadeCreate: true,
    });
    await this.send(req);
  }

  /**
   * Removes an "add to playlist" interaction.
   */
  async removeFromPlaylist(userId: string, id: string): Promise<void> {
    const req = new requests.DeleteCartAddition(userId, id);
    await this.send(req);
  }

  // ---------------------------------------------------------------------------
  // Recommendations
  // ---------------------------------------------------------------------------

  /**
   * Returns up to `limit` recommended tracks for the given user.
   * Each returned object includes the itemId plus whatever item properties
   * Recombee returns (by default all stored properties).
   *
   * @param userId  Recombee user identifier.
   * @param limit   Maximum number of recommendations to return.
   */
  async recommendUser(
    userId: string,
    limit: number
  ): Promise<Partial<RecommendationSchema>[]> {
    const req = new requests.RecommendItemsToUser(userId, limit, {
      cascadeCreate: true,
      returnProperties: true,
      includedProperties: [
        "title",
        "artistName",
        "duration",
        "songKey",
        "imageKey",
        "language",
      ],
    });

    const result = await this.send<{
      recomms: Array<{ id: string; values?: Record<string, unknown> }>;
    }>(req);

    return (result.recomms || []).map((r) => ({
      id: r.id,
      ...(r.values as Omit<RecommendationSchema, "id">),
    }));
  }

  async resetDatabase(): Promise<void> {
    this.logger.info(`[RECOMBEE] Resetting whole database`);
    const req = new requests.ResetDatabase();
    await this.send(req);
  }
}