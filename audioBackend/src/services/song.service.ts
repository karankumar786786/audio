import { 
    songRepository, 
} from "../infra";
import type { SongSchema } from "../schema/songs.schema";
import type { PaginationParams, PaginatedResult } from "../type/pagination.type";
import { buildPaginatedResult } from "../type/pagination.type";

export class SongService {
    async getSongs(params: PaginationParams): Promise<PaginatedResult<SongSchema>> {
        const offset = (params.page - 1) * params.limit;
        const [data, total] = await Promise.all([
            songRepository.getAll(params.limit, offset),
            songRepository.count()
        ]);
        
        return buildPaginatedResult(data, total, params);
    }

    async getSongById(id: string): Promise<SongSchema> {
        return await songRepository.getById(id);
    }
}
