import { Router } from "express";
import { unifiedSearch } from "../controllers/search.controller";

export const searchRouter = Router();

searchRouter.get("/", unifiedSearch);
