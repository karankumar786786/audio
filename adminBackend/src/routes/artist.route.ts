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
import { artistSchema, createArtistInput } from "../schema/artist.schema";



export const artistRouter = Router();

artistRouter.post("/", validate(createArtistInput), createArtist);
artistRouter.get("/", getArtists);
artistRouter.get("/:id", getArtistById);
artistRouter.get("/:id/songs", getSongsOfArtist);
artistRouter.put("/:id", validate(artistSchema.partial()), updateArtist);
artistRouter.delete("/:id", deleteArtist);
