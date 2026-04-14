import { Router } from "express";
import { searchController } from "../infra";

export const searchRouter = Router();

searchRouter.get("/", searchController.unifiedSearch);
