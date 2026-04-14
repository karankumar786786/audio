import { type Request, type Response } from "express";
import { type UserService } from "../services/user.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logMethods, type Logger } from "../observability";
import { userSchema } from "../schema/user.schema";
import { parsePagination } from "../type/pagination.type";

export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger
    ) {
        logMethods(this, this.logger);
    }

    createUser = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = userSchema.parse(req.body);
        const user = await this.userService.createUser(validatedData.id, validatedData.email);
        return res.status(201).json(new ApiResponse(201, "User created successfully", user));
    });

    getUserById = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const user = await this.userService.getUserById(id);
        if (!user) {
            return res.status(404).json(new ApiResponse(404, "User not found", null));
        }
        return res.status(200).json(new ApiResponse(200, "User fetched successfully", user));
    });

    getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
        const users = await this.userService.getAllUsers();
        return res.status(200).json(new ApiResponse(200, "Users fetched successfully", users));
    });

    // Favourites
    addSongInUserFavourites = asyncHandler(async (req: Request, res: Response) => {
        const { userId, songId } = req.body;
        const entry = await this.userService.addFavourite(userId, songId);
        return res.status(201).json(new ApiResponse(201, "Song added to favourites", entry));
    });

    deleteSongInUserFavourites = asyncHandler(async (req: Request, res: Response) => {
        const { userId, songId } = req.body;
        const entry = await this.userService.removeFavourite(userId, songId);
        return res.status(200).json(new ApiResponse(200, "Song removed from favourites", entry));
    });

    getUserFavourites = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await this.userService.getFavourites(userId, params.limit, (params.page - 1) * params.limit);
        return res.status(200).json(new ApiResponse(200, "User favourites fetched", { data: result, ...params }));
    });

    // History
    getUserHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await this.userService.getHistory(userId, params.limit, (params.page - 1) * params.limit);
        return res.status(200).json(new ApiResponse(200, "User history fetched", { data: result, ...params }));
    });

    // Search History
    getUserSearchHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        const params = parsePagination(req.query);
        const result = await this.userService.getSearchHistory(userId, params.limit, (params.page - 1) * params.limit);
        return res.status(200).json(new ApiResponse(200, "User search history fetched", { data: result, ...params }));
    });

    saveUserSearchHistory = asyncHandler(async (req: Request, res: Response) => {
        const { userId, searchedText } = req.body;
        const entry = await this.userService.saveSearchHistory(userId, searchedText);
        return res.status(201).json(new ApiResponse(201, "Search history saved", entry));
    });

    clearUserSearchHistory = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        await this.userService.clearSearchHistory(userId);
        return res.status(200).json(new ApiResponse(200, "User search history cleared", null));
    });
}