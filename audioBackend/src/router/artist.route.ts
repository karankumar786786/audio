import { Router } from "express";
import {
    createArtist,
    deleteArtist,
    getArtists,
    getArtistById,
    getSongsOfArtist,
    updateArtist,
} from "../controlers/artistContoller";

export const artistRouter = Router();

artistRouter.post("/create", createArtist);
artistRouter.get("/", getArtists);
artistRouter.get("/:id", getArtistById);
artistRouter.get("/:id/songs", getSongsOfArtist);
artistRouter.put("/:id", updateArtist);
artistRouter.delete("/:id", deleteArtist);
