import { Router } from "express";
import { searchController } from "../infra";
import { secure } from "../middlewares/authenticate.middleware";

export const searchRouter = Router();

searchRouter.get("/", searchController.unifiedSearch);
