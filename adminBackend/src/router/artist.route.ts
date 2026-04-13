import { Router } from "express";
import {
    createArtist,
    deleteArtist,
    getArtists,
    getArtistById,
    getSongsOfArtist,
    updateArtist,
} from "../controllers/artistContoller";
import { validate } from "../middlewares/validate.middleware";
import { artistSchema } from "../schema/artist.schema";

const createArtistInput = artistSchema.omit({ id: true, createdAt: true });

export const artistRouter = Router();

artistRouter.post("/", validate(createArtistInput), createArtist);
artistRouter.get("/", getArtists);
artistRouter.get("/:id", getArtistById);
artistRouter.get("/:id/songs", getSongsOfArtist);
artistRouter.put("/:id", updateArtist);
artistRouter.delete("/:id", deleteArtist);
