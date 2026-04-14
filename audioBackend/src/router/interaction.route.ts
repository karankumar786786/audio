import { Router } from "express";
import { addListen, getTrendingSongs, getRecommendedSongs } from "../controllers/interaction.controller";
import { validate } from "../middlewares/validate.middleware";
import { userHistorySchema } from "../schema/userHistory.schema";

const addListenInput = userHistorySchema.pick({ userId: true, songId: true, part: true });

export const interactionRouter = Router();

interactionRouter.post("/listen", validate(addListenInput), addListen);
interactionRouter.get("/trending", getTrendingSongs);
interactionRouter.get("/recommendations/:userId", getRecommendedSongs);
