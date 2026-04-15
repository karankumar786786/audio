import { type AlgoliaSearchService } from "../lib/search";
import { logMethods, type Logger } from "../observability";
import type { ArtistSchema, PlaylistSchema, SongSchema } from "../schema";

export class SearchService {
    constructor(
        private readonly algoliaSearchService: AlgoliaSearchService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async unifiedSearch(query: string) {
        if (!query.trim()) {
            return {
                songs: [],
                artists: [],
                playlists: [],
            };
        }

        const hits = await this.algoliaSearchService.search<Record<string, any>>(query);

        const songs: Record<string, any>[] = [];
        const artists: Record<string, any>[] = [];
        const playlists: Record<string, any>[] = [];

        for (const hit of hits) {
            if ("title" in hit && "artistName" in hit) {
                songs.push(hit);
            } else if ("about" in hit || "dob" in hit) {
                artists.push(hit);
            } else if ("coverImageKey" in hit || "bannerImageKey" in hit) {
                playlists.push(hit);
            }
        }

        return {
            songs,
            artists,
            playlists,
        };
    }
}
