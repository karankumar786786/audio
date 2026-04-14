import { Router } from "express";
import { search } from "../controllers/search.controller";

export const searchRouter = Router();

searchRouter.get("/", search);
