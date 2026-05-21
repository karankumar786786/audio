import type { SearchEngineService as AlgoliaSearchService, SearchRecord } from "../infra/search.types.ts";
import type { ArtistSchema } from "../schema/artist.schema.ts";
import type { PlaylistSchema } from "../schema/playlist.schema.ts";
import type { SongSchema } from "../schema/songs.schema.ts";
import { logMethods, type Logger } from "../utils/index.ts";

export interface UnifiedSearchResponse {
    songs: SongSchema[];
    artists: ArtistSchema[];
    playlists: PlaylistSchema[];
}

export class SearchService {
    constructor(
        private readonly algoliaSearchService: AlgoliaSearchService<SearchRecord>,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    async unifiedSearch(query: string): Promise<UnifiedSearchResponse> {
        this.logger.debug({ query }, "unifiedSearch starting");
        
        if (!query.trim()) {
            return {
                songs: [],
                artists: [],
                playlists: [],
            };
        }

        const hits = await this.algoliaSearchService.search(query);

        const songs: SongSchema[] = [];
        const artists: ArtistSchema[] = [];
        const playlists: PlaylistSchema[] = [];

        for (const hit of hits as any[]) {
            if ("title" in hit && "artistName" in hit) {
                songs.push(hit);
            } else if ("about" in hit || "dob" in hit) {
                artists.push(hit);
            } else if ("coverImageKey" in hit || "bannerImageKey" in hit) {
                playlists.push(hit);
            }
        }

        this.logger.debug({ 
            songsCount: songs.length, 
            artistsCount: artists.length, 
            playlistsCount: playlists.length 
        }, "unifiedSearch completed");

        return {
            songs,
            artists,
            playlists,
        };
    }
}
