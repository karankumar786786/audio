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

userPlaylistRouter.post("/", createUserPlaylist);
userPlaylistRouter.get("/user/:userId", getUserPlaylists);
userPlaylistRouter.post("/songs", addSongInUserPlaylist);
userPlaylistRouter.delete("/songs", deleteSongInUserPlaylist);
userPlaylistRouter.get("/:id/songs", getUserPlaylistSongs);
userPlaylistRouter.delete("/:id", deleteUserPlaylist);
