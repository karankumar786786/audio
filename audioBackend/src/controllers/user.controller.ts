import { type Request, type Response } from "express";
import { type UserService } from "../services/user.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import { parsePagination, type PaginationParams, type PaginatedResult } from "../type/pagination.type";
import { type UserSchema, type UserFavouriteSongSchema, type UserPlaylistSchema, type UserPlaylistSongSchema, type SongSchema, type Payload, type UserSearchHistorySchema } from "../schema";


export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger,
    ) {
        logMethods(this, this.logger);
    }

    handleUser = asyncHandler(async (req: Request, res: Response) => {
        const accessToken = req.params["access-token"] as string;
        const data: {payload:Payload,token:string} = await this.userService.createUser(accessToken);
        return new ApiResponse<Payload>(201, "User created successfully", data.payload).sendToken(req,res,data.token);
    });

    getUserById = asyncHandler(async (req: Request, res: Response) => {
        const id: string = req.params.id as string;
        const user: UserSchema = await this.userService.getUserById(id);
        return new ApiResponse<UserSchema>(200, "User fetched successfully", user).send(res);
    });

    // Favourites
    addSongInUserFavourites = asyncHandler(async (req: Request, res: Response) => {
        const { userId, songId } = req.body;
        const entry: UserFavouriteSongSchema = await this.userService.addFavourite(userId, songId);
        return new ApiResponse<UserFavouriteSongSchema>(201, "Song added to favourites", entry).send(res);
    });

    deleteSongInUserFavourites = asyncHandler(async (req: Request, res: Response) => {
        const { userId, songId } = req.body;
        const entry: UserFavouriteSongSchema = await this.userService.removeFavourite(userId, songId);
        return new ApiResponse<UserFavouriteSongSchema>(200, "Song removed from favourites", entry).send(res);
    });

    getUserFavourites = asyncHandler(async (req: Request, res: Response) => {
        const userId: string = req.params.userId as string;
        const params: PaginationParams = parsePagination(req.query);
        const result: PaginatedResult<SongSchema> = await this.userService.getFavourites(userId, params.limit, (params.page - 1) * params.limit);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "User favourites fetched", result).send(res);
    });

    // History
    getUserHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId: string = req.params.userId as string;
        const params: PaginationParams = parsePagination(req.query);
        const result: PaginatedResult<SongSchema> = await this.userService.getHistory(userId, params.limit, (params.page - 1) * params.limit);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "User history fetched", result).send(res);
    });

    // Search History
    getUserSearchHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId: string = req.params.userId as string;
        const params: PaginationParams = parsePagination(req.query);
        const result: PaginatedResult<UserSearchHistorySchema> = await this.userService.getSearchHistory(userId, params.limit, (params.page - 1) * params.limit);
        return new ApiResponse<PaginatedResult<UserSearchHistorySchema>>(200, "User search history fetched", result).send(res);
    });

    saveUserSearchHistory = asyncHandler(async (req: Request, res: Response) => {
        const { userId, searchedText } = req.body;
        await this.userService.saveSearchHistory(userId, searchedText);
        return new ApiResponse<null>(201, "Search history saved").send(res);
    });

    clearUserSearchHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId: string = req.params.userId as string;
        await this.userService.clearSearchHistory(userId);
        return new ApiResponse<null>(200, "User search history cleared", null).send(res);
    });

    // Playlist logic
    createUserPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const playlist: UserPlaylistSchema = await this.userService.createUserPlaylist(req.body);
        return new ApiResponse<UserPlaylistSchema>(201, "User playlist created", playlist).send(res);
    });

    getUserPlaylistById = asyncHandler(async (req: Request, res: Response) => {
        const id: string = req.params.id as string;
        const playlist: UserPlaylistSchema = await this.userService.getUserPlaylistById(id);
        return new ApiResponse<UserPlaylistSchema>(200, "User playlist fetched", playlist).send(res);
    });

    getUserPlaylists = asyncHandler(async (req: Request, res: Response) => {
        const userId: string = req.params.userId as string;
        const params: PaginationParams = parsePagination(req.query);
        const result: PaginatedResult<UserPlaylistSchema> = await this.userService.getUserPlaylists(userId, params.limit, (params.page - 1) * params.limit);
        return new ApiResponse<PaginatedResult<UserPlaylistSchema>>(200, "User playlists fetched", result).send(res);
    });

    addSongToUserPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const { playlistId, songId, userId } = req.body;
        const entry: UserPlaylistSongSchema = await this.userService.addSongToUserPlaylist(playlistId, songId, userId);
        return new ApiResponse<UserPlaylistSongSchema>(200, "Song added to playlist", entry).send(res);
    });

    removeSongFromUserPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const { playlistId, songId, userId } = req.body;
        const entry: UserPlaylistSongSchema = await this.userService.removeSongFromUserPlaylist(playlistId, songId, userId);
        return new ApiResponse<UserPlaylistSongSchema>(200, "Song removed from playlist", entry).send(res);
    });

    getUserPlaylistSongs = asyncHandler(async (req: Request, res: Response) => {
        const id: string = req.params.id as string;
        const params: PaginationParams = parsePagination(req.query);
        const result: PaginatedResult<SongSchema> = await this.userService.getUserPlaylistSongs(id, params.limit, (params.page - 1) * params.limit);
        return new ApiResponse<PaginatedResult<SongSchema>>(200, "Songs of user playlist fetched", result).send(res);
    });

    deleteUserPlaylist = asyncHandler(async (req: Request, res: Response) => {
        const id: string = req.params.id as string;
        const playlist: UserPlaylistSchema = await this.userService.deleteUserPlaylist(id);
        return new ApiResponse<UserPlaylistSchema>(200, "User playlist deleted", playlist).send(res);
    });
}