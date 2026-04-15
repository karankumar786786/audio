import { registry, ApiResponseSchema, PaginatedResultSchema } from "./openapi-registry";
import { z } from "zod";

import { artistSchema, createArtistSchema, updateArtistSchema } from "../schema/artist.schema";
import { playlistSchema, createPlaylistInput, playlistSongSchema, playlistSongInput } from "../schema/playlist.schema";
import { songSchema, CreateSongSchema, updateSongSchema } from "../schema/songs.schema";

const wrapResponse = (dataSchema: z.ZodTypeAny) => z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema
});

const wrapPaginatedResponse = (itemSchema: z.ZodTypeAny) => wrapResponse(z.object({
    data: z.array(itemSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    })
}));

// --- ARTISTS ---
registry.registerPath({
  method: "get",
  path: "/artists",
  description: "Get paginated list of artists",
  summary: "List Artists",
  tags: ["Artists"],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
  ],
  responses: {
    200: {
      description: "List of artists",
      content: { "application/json": { schema: wrapPaginatedResponse(artistSchema) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/artists",
  description: "Create a new artist",
  summary: "Create Artist",
  tags: ["Artists"],
  request: { body: { content: { "application/json": { schema: createArtistSchema } } } },
  responses: {
    201: {
      description: "Artist created successfully",
      content: { "application/json": { schema: wrapResponse(artistSchema) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/artists/{id}",
  description: "Get artist details by ID",
  summary: "Get Artist",
  tags: ["Artists"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Artist details", content: { "application/json": { schema: wrapResponse(artistSchema) } } },
    404: { description: "Artist not found" },
  },
});

registry.registerPath({
  method: "put",
  path: "/artists/{id}",
  description: "Update artist details",
  summary: "Update Artist",
  tags: ["Artists"],
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: updateArtistSchema } } } },
  responses: {
    200: { description: "Artist updated", content: { "application/json": { schema: wrapResponse(artistSchema) } } },
    404: { description: "Artist not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/artists/{id}",
  description: "Delete an artist",
  summary: "Delete Artist",
  tags: ["Artists"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Artist deleted", content: { "application/json": { schema: wrapResponse(artistSchema) } } },
    404: { description: "Artist not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/artists/{id}/songs",
  description: "Get paginated list of songs by an artist",
  summary: "Get Artist Songs",
  tags: ["Artists"],
  request: { params: z.object({ id: z.string() }) },
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
  ],
  responses: {
    200: { description: "List of artist songs", content: { "application/json": { schema: wrapPaginatedResponse(songSchema) } } },
  },
});


// --- SONGS ---
registry.registerPath({
  method: "post",
  path: "/songs",
  description: "Initialize a new song processing job",
  summary: "Create Song",
  tags: ["Songs"],
  request: { body: { content: { "application/json": { schema: CreateSongSchema } } } },
  responses: {
    202: {
      description: "Processing job initiated",
      content: { "application/json": { schema: wrapResponse(z.object({ id: z.string(), jobId: z.string(), status: z.string() })) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/songs",
  description: "Get paginated list of songs",
  summary: "List Songs",
  tags: ["Songs"],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
  ],
  responses: {
    200: {
      description: "List of songs",
      content: { "application/json": { schema: wrapPaginatedResponse(songSchema) } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/songs/{id}",
  description: "Update song details",
  summary: "Update Song",
  tags: ["Songs"],
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: updateSongSchema } } } },
  responses: {
    200: { description: "Song updated", content: { "application/json": { schema: wrapResponse(songSchema) } } },
    404: { description: "Song not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/songs/{id}",
  description: "Delete a song",
  summary: "Delete Song",
  tags: ["Songs"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Song deleted", content: { "application/json": { schema: wrapResponse(songSchema) } } },
    404: { description: "Song not found" },
  },
});


// --- PLAYLISTS ---
registry.registerPath({
  method: "post",
  path: "/playlists",
  description: "Create a new system playlist",
  summary: "Create Playlist",
  tags: ["Playlists"],
  request: { body: { content: { "application/json": { schema: createPlaylistInput } } } },
  responses: {
    201: { description: "Playlist created", content: { "application/json": { schema: wrapResponse(playlistSchema) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/playlists",
  description: "Get paginated list of playlists",
  summary: "List Playlists",
  tags: ["Playlists"],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
  ],
  responses: {
    200: { description: "List of playlists", content: { "application/json": { schema: wrapPaginatedResponse(playlistSchema) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/playlists/{id}",
  description: "Get system playlist details by ID",
  summary: "Get Playlist",
  tags: ["Playlists"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Playlist details", content: { "application/json": { schema: wrapResponse(playlistSchema) } } },
    404: { description: "Playlist not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/playlists/{id}",
  description: "Delete a system playlist",
  summary: "Delete Playlist",
  tags: ["Playlists"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Playlist deleted", content: { "application/json": { schema: wrapResponse(playlistSchema) } } },
    404: { description: "Playlist not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/playlists/{id}/songs",
  description: "Get paginated list of songs in a playlist",
  summary: "Get Playlist Songs",
  tags: ["Playlists"],
  request: { params: z.object({ id: z.string() }) },
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
  ],
  responses: {
    200: { description: "List of playlist songs", content: { "application/json": { schema: wrapPaginatedResponse(songSchema) } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/playlists/songs",
  description: "Add a song to a playlist",
  summary: "Add Song to Playlist",
  tags: ["Playlists"],
  request: { body: { content: { "application/json": { schema: playlistSongInput } } } },
  responses: {
    201: { description: "Song added", content: { "application/json": { schema: wrapResponse(playlistSongSchema) } } },
  },
});

registry.registerPath({
  method: "delete",
  path: "/playlists/songs",
  description: "Remove a song from a playlist",
  summary: "Remove Song from Playlist",
  tags: ["Playlists"],
  request: { body: { content: { "application/json": { schema: playlistSongInput } } } },
  responses: {
    200: { description: "Song removed", content: { "application/json": { schema: wrapResponse(playlistSongSchema) } } },
  },
});

// --- MISC ---
registry.registerPath({
  method: "get",
  path: "/misc/presigned-url/image",
  description: "Get a presigned upload URL and auth parameters for ImageKit",
  summary: "Get Image Upload Params",
  tags: ["Misc"],
  responses: {
    200: { 
        description: "Upload parameters", 
        content: { "application/json": { schema: wrapResponse(z.object({ token: z.string(), expire: z.number(), signature: z.string(), tempKey: z.string() })) } } 
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/misc/presigned-url/song",
  description: "Get a presigned upload URL for S3/Storage",
  summary: "Get Song Upload URL",
  tags: ["Misc"],
  responses: {
    200: { 
        description: "Presigned URL", 
        content: { "application/json": { schema: wrapResponse(z.object({ key: z.string(), url: z.string() })) } } 
    },
  },
});
