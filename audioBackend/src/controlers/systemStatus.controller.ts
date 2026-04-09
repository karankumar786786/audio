import { type Request, type Response, type NextFunction } from "express";
import { ApiResponse } from "../utils/ApiResponse";

export async function getStatus(req:Request,res:Response,next:NextFunction)  {
    return res.json(new ApiResponse(200,"healthy"));
}