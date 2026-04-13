import { Router } from "express";
import {
    getArtists,
    getArtistById,
    getSongsOfArtist,
} from "../controlers/artistContoller";

export const artistRouter = Router();

artistRouter.get("/", getArtists);
artistRouter.get("/:id", getArtistById);
artistRouter.get("/:id/songs", getSongsOfArtist);
