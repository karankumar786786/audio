import { searchService as algoliaSearchService } from "../infra";

export class SearchService {
    async unifiedSearch(query: string) {
        if (!query.trim()) {
            return {
                songs: [],
                artists: [],
                playlists: [],
            };
        }

        const hits = await algoliaSearchService.search<Record<string, any>>(query);

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
