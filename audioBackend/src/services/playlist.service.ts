import { type PlaylistRepository } from "../repository/playlist.repository";
import { type PlaylistSchema } from "../schema/playlist.schema";
import { type SongSchema } from "../schema/songs.schema";
import { type PaginationParams, type PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";
import { logMethods, type Logger } from "../observability";
import { type SignatureService } from "../lib";

export class PlaylistService {
    constructor(
        private readonly playlistRepository: PlaylistRepository,
        private readonly logger: Logger,
        private readonly signatureService: SignatureService
    ) {
        logMethods(this, this.logger);
    }

    async getPlaylists(params: PaginationParams): Promise<PaginatedResult<PlaylistSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getAll(params.limit, offset),
            this.playlistRepository.count()
        ]);
        
        return buildPaginatedResult(data, total, params);
    }

    async getPlaylistById(id: string): Promise<PlaylistSchema> {
        this.signatureService.verifyId(id, "playlistId");
        return await this.playlistRepository.getById(id);
    }

    async getPlaylistSongs(id: string, params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        this.signatureService.verifyId(id, "playlistId");
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            this.playlistRepository.getSongs(id, params.limit, offset),
            this.playlistRepository.countSongs(id)
        ]);
        
        return buildPaginatedResult(data, total, params);
    }
}
