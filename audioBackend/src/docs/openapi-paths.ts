import { registry } from "./openapi-registry";
import { z } from "zod";
import * as schemas from "../schema";

const wrapResponse = (dataSchema: z.ZodTypeAny) => z.object({
  success: z.boolean(),
  statusCode: z.number(),
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

const wrapTokenResponse = (payloadSchema: z.AnyZodObject) => z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
    data: z.union([
      payloadSchema,
      payloadSchema.extend({ token: z.string() })
    ])
});

// --- System ---
registry.registerPath({
  method: "get",
  path: "/status",
  summary: "Get system status",
  tags: ["System"],
  responses: {
    200: {
      description: "Service status details",
      content: { "application/json": { schema: wrapResponse(z.object({ uptime: z.number(), status: z.string(), memory: z.any() })) } }
    }
  }
});

// --- Song Routes ---
registry.registerPath({
  method: "get",
  path: "/songs",
  summary: "Get paginated list of songs",
  tags: ["Songs"],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
  ],
  responses: {
    200: {
      description: "List of songs",
      content: { "application/json": { schema: wrapPaginatedResponse(schemas.songSchema) } }
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/songs/{id}",
  summary: "Get song by ID",
  tags: ["Songs"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "Song details",
      content: { "application/json": { schema: wrapResponse(schemas.songSchema) } }
    },
    404: { description: "Song not found" }
  },
});

// --- User Routes ---
registry.registerPath({
  method: "post",
  path: "/users/{access-token}",
  summary: "Handle Auth0 login / User sync",
  tags: ["Users"],
  request: { params: z.object({ "access-token": z.string() }) },
  responses: {
    201: { 
        description: "User synced successfully", 
        content: { "application/json": { schema: wrapTokenResponse(schemas.payload) } } 
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  summary: "Get user profile",
  tags: ["Users"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { 
        description: "User details", 
        content: { "application/json": { schema: wrapResponse(schemas.userSchema) } } 
    }
  }
});

// --- User Favourites ---
registry.registerPath({
  method: "get",
  path: "/users/{userId}/favourites",
  summary: "Get user's favourite songs",
  tags: ["Users"],
  request: { params: z.object({ userId: z.string() }) },
  responses: {
    200: { 
        description: "List of favourite songs", 
        content: { "application/json": { schema: wrapPaginatedResponse(schemas.songSchema) } } 
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/users/favourites",
  summary: "Add song to favourites",
  tags: ["Users"],
  request: { 
      body: { 
          content: { 
              "application/json": { 
                  schema: z.object({ userId: z.string(), songId: z.string() }) 
              } 
          } 
      } 
  },
  responses: {
    201: { description: "Added to favourites", content: { "application/json": { schema: wrapResponse(schemas.userFavouriteSongSchema) } } }
  }
});

registry.registerPath({
  method: "delete",
  path: "/users/favourites",
  summary: "Remove song from favourites",
  tags: ["Users"],
  request: { 
      body: { 
          content: { 
              "application/json": { 
                  schema: z.object({ userId: z.string(), songId: z.string() }) 
              } 
          } 
      } 
  },
  responses: {
    200: { description: "Removed from favourites", content: { "application/json": { schema: wrapResponse(schemas.userFavouriteSongSchema) } } }
  }
});

// --- User History ---
registry.registerPath({
  method: "get",
  path: "/users/{userId}/history",
  summary: "Get user's listen history",
  tags: ["Users"],
  request: { params: z.object({ userId: z.string() }) },
  responses: {
    200: { 
        description: "Listen history", 
        content: { "application/json": { schema: wrapPaginatedResponse(schemas.songSchema) } } 
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/users/{userId}/search-history",
  summary: "Get user's search history",
  tags: ["Users"],
  request: { params: z.object({ userId: z.string() }) },
  responses: {
    200: { 
        description: "Search history", 
        content: { "application/json": { schema: wrapPaginatedResponse(schemas.userSearchHistorySchema) } } 
    }
  }
});

// --- User Playlists ---
registry.registerPath({
  method: "post",
  path: "/users/playlists",
  summary: "Create a user playlist",
  tags: ["Users"],
  request: {
    body: {
      content: { "application/json": { schema: z.object({ userId: z.string(), name: z.string() }) } }
    }
  },
  responses: {
    201: { description: "Playlist created", content: { "application/json": { schema: wrapResponse(schemas.userPlaylistSchema) } } }
  }
});

registry.registerPath({
    method: "get",
    path: "/users/{userId}/playlists",
    summary: "Get all playlists for a user",
    tags: ["Users"],
    request: { params: z.object({ userId: z.string() }) },
    responses: {
      200: { description: "User playlists", content: { "application/json": { schema: wrapPaginatedResponse(schemas.userPlaylistSchema) } } }
    }
});

// --- Interactions ---
registry.registerPath({
  method: "post",
  path: "/interactions/listen",
  summary: "Record a song listen interaction",
  tags: ["Interactions"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string(),
            songId: z.string(),
            part: z.number().int().min(0).max(100).default(100)
          })
        }
      }
    }
  },
  responses: {
    200: { description: "Listen recorded", content: { "application/json": { schema: wrapResponse(z.null()) } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/interactions/trending",
  summary: "Get trending songs globally",
  tags: ["Interactions"],
  responses: {
    200: { description: "Trending songs", content: { "application/json": { schema: wrapPaginatedResponse(schemas.songSchema) } } }
  }
});

registry.registerPath({
    method: "get",
    path: "/interactions/recommendations/{userId}",
    summary: "Get personalized recommendations",
    tags: ["Interactions"],
    request: { params: z.object({ userId: z.string() }) },
    responses: {
      200: { description: "Recommended songs", content: { "application/json": { schema: wrapPaginatedResponse(schemas.songSchema) } } }
    }
});

// --- Artists ---
registry.registerPath({
  method: "get",
  path: "/artists",
  summary: "Get all artists",
  tags: ["Artists"],
  responses: {
    200: { description: "Artist list", content: { "application/json": { schema: wrapPaginatedResponse(schemas.artistSchema) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/artists/{id}",
  summary: "Get artist by ID",
  tags: ["Artists"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Artist details", content: { "application/json": { schema: wrapResponse(schemas.artistSchema) } } },
  },
});

registry.registerPath({
    method: "get",
    path: "/artists/{id}/songs",
    summary: "Get songs by an artist",
    tags: ["Artists"],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Artist songs", content: { "application/json": { schema: wrapPaginatedResponse(schemas.songSchema) } } },
    }
});

// --- Search ---
registry.registerPath({
  method: "get",
  path: "/search",
  summary: "Unified search (Songs, Artists, Playlists)",
  tags: ["Search"],
  parameters: [{ name: "query", in: "query", required: true, schema: { type: "string" } }],
  responses: {
    200: { 
        description: "Search results", 
        content: { 
            "application/json": { 
                schema: wrapResponse(z.object({
                    songs: z.array(schemas.songSchema),
                    artists: z.array(schemas.artistSchema),
                    playlists: z.array(schemas.playlistSchema)
                })) 
            } 
        } 
    }
  }
});

// --- Misc ---
registry.registerPath({
    method: "get",
    path: "/misc/presigned-url/image",
    summary: "Get pre-signed signature for ImageKit upload",
    tags: ["Misc"],
    responses: {
      200: { 
          description: "Signature parameters", 
          content: { "application/json": { schema: wrapResponse(z.object({ token: z.string(), expire: z.number(), signature: z.string(), tempKey: z.string() })) } } 
      }
    }
});
