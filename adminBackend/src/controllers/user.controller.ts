import { type Request, type Response } from "express";
import { userRepository } from "../infra";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userRepository.getAll();
    return new ApiResponse(200, "Users retrieved successfully", users).send(res);
});

export const createOrPromoteAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    let user = await userRepository.getByEmail(email);
    if (user) {
        if (user.role === "superadmin") {
            throw new ApiError(400, "Cannot modify role of a superadmin");
        }
        user = await userRepository.update(user.id, { name, role: "admin" });
    } else {
        user = await userRepository.create({ email, name, role: "admin" });
    }

    return new ApiResponse(201, "Admin user created or promoted successfully", user).send(res);
});

export const deleteOrDemoteAdmin = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!id) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await userRepository.getById(id);
    if (user.role === "superadmin") {
        throw new ApiError(400, "Cannot delete or demote a superadmin");
    }

    await userRepository.delete(id);
    return new ApiResponse(200, "User deleted successfully", user).send(res);
});
