import { Router } from "express";
import {
    createArtist,
    deleteArtist,
    getArtists,
    getArtistById,
    getSongsOfArtist,
    updateArtist,
} from "../controllers/artist.controller";
import { validate } from "../middlewares/validate.middleware";
import { createArtistSchema ,updateArtistSchema} from "../schema";



export const artistRouter = Router();

artistRouter.post("/", validate(createArtistSchema), createArtist);
artistRouter.get("/", getArtists);
artistRouter.get("/:id", getArtistById);
artistRouter.get("/:id/songs", getSongsOfArtist);
artistRouter.put("/:id", validate(updateArtistSchema), updateArtist);
artistRouter.delete("/:id", deleteArtist);
