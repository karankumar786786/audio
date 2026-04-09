import { Router } from "express";
import {
    createUserPlaylist,
    deleteUserPlaylist,
    addSongInUserPlaylist,
    deleteSongInUserPlaylist,
    getUserPlaylists,
    getUserPlaylistSongs,
} from "../controlers/userPlaylist.controller";

export const userPlaylistRouter = Router();

userPlaylistRouter.post("/create", createUserPlaylist);
userPlaylistRouter.get("/user/:userId", getUserPlaylists);
userPlaylistRouter.get("/:id/songs", getUserPlaylistSongs);
userPlaylistRouter.delete("/:id", deleteUserPlaylist);
userPlaylistRouter.post("/songs", addSongInUserPlaylist);
userPlaylistRouter.delete("/songs", deleteSongInUserPlaylist);
