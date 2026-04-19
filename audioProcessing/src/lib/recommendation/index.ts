import * as recombee from "recombee-api-client";

const { ApiClient, requests } = recombee;

interface RecommendationService<T> {
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
  createdAt?: string;
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

/**
 * Field type map used when initialising the Recombee item catalogue.
 * Every property of RecommendationSchema (except itemId, which is the
 * Recombee item identifier, not a stored value) must appear here.
 */
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

export class RecommendationServiceImpl implements RecommendationService<RecommendationSchema>{
  private readonly client: InstanceType<typeof ApiClient>;
  private readonly DEFAULT_TIMEOUT = 10_000;
  private readonly logger: any;

  constructor(
    databaseId: string,
    privateToken: string,
    region: string = "us-west",
    logger: any
  ) {
    this.client = new ApiClient(databaseId, privateToken, { region });
    this.logger = logger;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async send<T>(req: { timeout: number } & object): Promise<T> {
    (req as { timeout: number }).timeout = this.DEFAULT_TIMEOUT;
    return (await this.client.send(req as any)) as T;
  }

  /**
   * Recombee IDs should be the base UUID, not the signed ID.
   * This ensures consistency even if we rotate our signing keys.
   */
  private stripId(signedId: string): string {
    if (!signedId) return "";
    return signedId.split(".")[0] || "";
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
    const req = new requests.SetViewPortion(this.stripId(userId), this.stripId(id), Math.min(1, Math.max(0, portion)), {
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

  /**
   * Removes a "favorite" interaction.
   */
  async removeFavorite(userId: string, id: string): Promise<void> {
    const req = new requests.DeleteBookmark(this.stripId(userId), this.stripId(id));
    await this.send(req);
  }

  /**
   * Records an "add to playlist" interaction (mapped to CartAddition).
   */
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
    const req = new requests.RecommendItemsToUser(this.stripId(userId), limit, {
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