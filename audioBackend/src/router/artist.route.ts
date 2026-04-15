import { Router } from "express";
import { artistController } from "../infra";
import {secure} from "../middlewares/authenticate.middleware";

export const artistRouter = Router();

artistRouter.get("/", secure,artistController.getArtists);
artistRouter.get("/:id", secure,artistController.getArtistById);
artistRouter.get("/:id/songs",secure, artistController.getSongsOfArtist);
