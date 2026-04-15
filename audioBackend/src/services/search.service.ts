import { type AlgoliaSearchService } from "../lib/search";
import { logMethods, type Logger } from "../observability";
import type { ArtistSchema, PlaylistSchema, SongSchema } from "../schema";

export interface UnifiedSearchResponse {
    songs: SongSchema[];
    artists: ArtistSchema[];
    playlists: PlaylistSchema[];
}

export class SearchService {
    constructor(
        private readonly algoliaSearchService: AlgoliaSearchService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async unifiedSearch(query: string): Promise<UnifiedSearchResponse> {
        if (!query.trim()) {
            return {
                songs: [],
                artists: [],
                playlists: [],
            };
        }

        const hits = await this.algoliaSearchService.search<Record<string, any>>(query);

        const songs: SongSchema[] = [];
        const artists: ArtistSchema[] = [];
        const playlists: PlaylistSchema[] = [];

        for (const hit of hits) {
            if ("title" in hit && "artistName" in hit) {
                songs.push(hit as any);
            } else if ("about" in hit || "dob" in hit) {
                artists.push(hit as any);
            } else if ("coverImageKey" in hit || "bannerImageKey" in hit) {
                playlists.push(hit as any);
            }
        }

        return {
            songs,
            artists,
            playlists,
        };
    }
}
