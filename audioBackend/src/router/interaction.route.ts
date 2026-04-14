import { Router } from "express";
import { interactionController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userHistorySchema } from "../schema/userHistory.schema";

const addListenInput = userHistorySchema.pick({ userId: true, songId: true, part: true });

export const interactionRouter = Router();

interactionRouter.post("/listen", validate(addListenInput), interactionController.recordListen);
interactionRouter.get("/trending", interactionController.getTrendingSongs);
interactionRouter.get("/recommendations/:userId", interactionController.getRecommendations);
