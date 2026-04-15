import { logMethods, type Logger } from "../observablity";
import type { SearchService as AlgoliaSearchService } from "../lib/search";
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
            // Logic to categorize based on present fields
            if ("title" in hit && "artistName" in hit) {
                songs.push(hit);
            } else if ("about" in hit || "dob" in hit) {
                artists.push(hit);
            } else if ("coverImageKey" in hit || "bannerImageKey" in hit) {
                // Heuristic: Playlists have coverImageKey but not 'about' or 'title/artistName'
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
