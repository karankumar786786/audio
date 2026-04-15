import type { NextFunction, Request, Response } from "express";

export function secure(req:Request,res:Response,next:NextFunction){
    next();
}