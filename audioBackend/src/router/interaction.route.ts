import { Router } from "express";
import { addListen, getTrendingSongs, getRecommendedSongs } from "../controlers/interaction.controller";

export const interactionRouter = Router();

interactionRouter.post("/listen", addListen);
interactionRouter.get("/trending", getTrendingSongs);
interactionRouter.get("/recommendations/:userId", getRecommendedSongs);
