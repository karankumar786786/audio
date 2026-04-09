import { Router } from "express";
import { search } from "../controlers/search.controller";

export const searchRouter = Router();

searchRouter.get("/", search);
