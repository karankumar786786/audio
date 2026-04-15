import { Router } from "express";
import { artistController } from "../infra";
import {secure} from "../middlewares/authenticate.middleware";

export const artistRouter = Router();

artistRouter.get("/", artistController.getArtists);
artistRouter.get("/:id", artistController.getArtistById);
artistRouter.get("/:id/songs", artistController.getSongsOfArtist);
