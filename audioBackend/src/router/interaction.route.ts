import { Router } from "express";
import { interactionController } from "../infra";
import { validate } from "../middlewares/validate.middleware";
import { userHistorySchema } from "../schema/userHistory.schema";
import { secure } from "../middlewares/authenticate.middleware";

const addListenInput = userHistorySchema.pick({ songId: true, part: true });

export const interactionRouter = Router();

interactionRouter.post("/listen", secure, validate(addListenInput), interactionController.recordListen);
interactionRouter.get("/trending", interactionController.getTrendingSongs);
interactionRouter.get("/recommendations", secure, interactionController.getRecommendations);
