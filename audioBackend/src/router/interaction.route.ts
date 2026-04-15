import { Router } from "express";
import { interactionController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userHistorySchema } from "../schema/userHistory.schema";
import { secure } from "../middlewares/authenticate.middleware";

const addListenInput = userHistorySchema.pick({ userId: true, songId: true, part: true });

export const interactionRouter = Router();

interactionRouter.post("/listen",validate(addListenInput), interactionController.recordListen);
interactionRouter.get("/trending", interactionController.getTrendingSongs);
interactionRouter.get("/recommendations/:userId", secure,interactionController.getRecommendations);
