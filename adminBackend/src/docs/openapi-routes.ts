import { registry } from "./openapi-registry";
import { z } from "zod";
import { artistSchema, createArtistSchema, updateArtistSchema } from "../schema/artist.schema";
import { playlistSchema, createPlaylistInput, playlistSongSchema, playlistSongInput } from "../schema/playlist.schema";
import { songSchema, CreateSongSchema, updateSongSchema } from "../schema/songs.schema";

// --- ARTISTS ---
registry.registerPath({
  method: "get",
  path: "/artists",
  description: "Get paginated list of artists",
  summary: "List Artists",
  responses: {
    200: {
      description: "List of artists",
      content: { "application/json": { schema: z.object({ success: z.boolean(), message: z.string(), data: z.object({ data: z.array(artistSchema) }) }) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/artists",
  description: "Create a new artist",
  summary: "Create Artist",
  request: { body: { content: { "application/json": { schema: createArtistSchema } } } },
  responses: {
    201: {
      description: "Artist created successfully",
      content: { "application/json": { schema: artistSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/artists/{id}",
  description: "Get artist details by ID",
  summary: "Get Artist",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Artist details", content: { "application/json": { schema: artistSchema } } },
    404: { description: "Artist not found" },
  },
});

registry.registerPath({
  method: "put",
  path: "/artists/{id}",
  description: "Update artist details",
  summary: "Update Artist",
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: updateArtistSchema } } } },
  responses: {
    200: { description: "Artist updated", content: { "application/json": { schema: artistSchema } } },
    404: { description: "Artist not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/artists/{id}",
  description: "Delete an artist",
  summary: "Delete Artist",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Artist deleted", content: { "application/json": { schema: artistSchema } } },
    404: { description: "Artist not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/artists/{id}/songs",
  description: "Get all songs by an artist",
  summary: "Get Artist Songs",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "List of artist songs", content: { "application/json": { schema: z.array(songSchema) } } },
  },
});


// --- SONGS ---
registry.registerPath({
  method: "post",
  path: "/songs",
  description: "Initialize a new song processing job",
  summary: "Create Song",
  request: { body: { content: { "application/json": { schema: CreateSongSchema } } } },
  responses: {
    201: {
      description: "Processing job created",
      content: { "application/json": { schema: z.object({ id: z.string(), jobId: z.string(), status: z.string() }) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/songs",
  description: "Get paginated list of songs",
  summary: "List Songs",
  responses: {
    200: {
      description: "List of songs",
      content: { "application/json": { schema: z.array(songSchema) } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/songs/{id}",
  description: "Update song details",
  summary: "Update Song",
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: updateSongSchema } } } },
  responses: {
    200: { description: "Song updated", content: { "application/json": { schema: songSchema } } },
    404: { description: "Song not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/songs/{id}",
  description: "Delete a song",
  summary: "Delete Song",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Song deleted", content: { "application/json": { schema: songSchema } } },
  },
});


// --- PLAYLISTS ---
registry.registerPath({
  method: "post",
  path: "/playlists",
  description: "Create a new playlist",
  summary: "Create Playlist",
  request: { body: { content: { "application/json": { schema: createPlaylistInput } } } },
  responses: {
    201: { description: "Playlist created", content: { "application/json": { schema: playlistSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/playlists",
  description: "Get all playlists",
  summary: "List Playlists",
  responses: {
    200: { description: "List of playlists", content: { "application/json": { schema: z.array(playlistSchema) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/playlists/{id}",
  description: "Get playlist details by ID",
  summary: "Get Playlist",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Playlist details", content: { "application/json": { schema: playlistSchema } } },
    404: { description: "Playlist not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/playlists/{id}",
  description: "Delete a playlist",
  summary: "Delete Playlist",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Playlist deleted", content: { "application/json": { schema: playlistSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/playlists/{id}/songs",
  description: "Get all songs in a playlist",
  summary: "Get Playlist Songs",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "List of playlist songs", content: { "application/json": { schema: z.array(songSchema) } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/playlists/songs",
  description: "Add a song to a playlist",
  summary: "Add Song to Playlist",
  request: { body: { content: { "application/json": { schema: playlistSongInput } } } },
  responses: {
    201: { description: "Song added", content: { "application/json": { schema: playlistSongSchema } } },
  },
});

registry.registerPath({
  method: "delete",
  path: "/playlists/songs",
  description: "Remove a song from a playlist",
  summary: "Remove Song from Playlist",
  request: { body: { content: { "application/json": { schema: playlistSongInput } } } },
  responses: {
    200: { description: "Song removed", content: { "application/json": { schema: playlistSongSchema } } },
  },
});

// --- MISC ---
registry.registerPath({
  method: "get",
  path: "/misc/presigned-url/image",
  description: "Get a presigned upload URL for an image",
  summary: "Get Image Upload URL",
  responses: {
    200: { description: "Presigned URL", content: { "application/json": { schema: z.object({ url: z.string() }) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/misc/presigned-url/song",
  description: "Get a presigned upload URL for a song file",
  summary: "Get Song Upload URL",
  responses: {
    200: { description: "Presigned URL", content: { "application/json": { schema: z.object({ url: z.string() }) } } },
  },
});


