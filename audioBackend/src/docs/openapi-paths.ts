import { registry } from "./openapi-registry";
import { z } from "zod";

// --- Song Routes ---

registry.registerPath({
  method: "get",
  path: "/songs",
  summary: "Get all songs",
  tags: ["Songs"],
  responses: {
    200: {
      description: "List of songs",
      content: { "application/json": { schema: z.any() } }
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/songs/{id}",
  summary: "Get song by ID",
  tags: ["Songs"],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: {
    200: {
      description: "Song details",
      content: { "application/json": { schema: z.any() } }
    },
  },
});

// --- Artist Routes ---

registry.registerPath({
  method: "get",
  path: "/artists",
  summary: "Get all artists",
  tags: ["Artists"],
  responses: {
    200: {
      description: "List of artists",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/artists/{id}",
  summary: "Get artist by ID",
  tags: ["Artists"],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: {
    200: {
      description: "Artist details",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

// --- Playlist Routes ---

registry.registerPath({
  method: "get",
  path: "/playlists/system",
  summary: "Get system playlists",
  tags: ["Playlists"],
  responses: {
    200: {
      description: "List of system playlists",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

// --- User Routes ---

registry.registerPath({
  method: "post",
  path: "/users",
  summary: "Create or sync user",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ id: z.string(), email: z.string().email() }) }
      }
    }
  },
  responses: {
    201: { description: "User created/synced", content: { "application/json": { schema: z.any() } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  summary: "Get user by ID",
  tags: ["Users"],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: {
    200: { description: "User details", content: { "application/json": { schema: z.any() } } }
  }
});

// --- User Interactions ---

registry.registerPath({
  method: "post",
  path: "/interactions/listen",
  summary: "Record a song listen",
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
    200: { description: "Listen recorded", content: { "application/json": { schema: z.any() } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/interactions/trending",
  summary: "Get trending songs",
  tags: ["Interactions"],
  responses: {
    200: { description: "List of trending songs", content: { "application/json": { schema: z.any() } } }
  }
});

// --- User Playlists ---

registry.registerPath({
  method: "post",
  path: "/user-playlists",
  summary: "Create a user playlist",
  tags: ["User Playlists"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string(),
            name: z.string(),
            description: z.string().optional()
          })
        }
      }
    }
  },
  responses: {
    201: { description: "Playlist created", content: { "application/json": { schema: z.any() } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/user-playlists/user/{userId}",
  summary: "Get all playlists for a user",
  tags: ["User Playlists"],
  parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
  responses: {
    200: { description: "List of user playlists", content: { "application/json": { schema: z.any() } } }
  }
});

// --- Search ---

registry.registerPath({
  method: "get",
  path: "/search/unified",
  summary: "Unified search across songs, artists, and playlists",
  tags: ["Search"],
  parameters: [
    {
      name: "query",
      in: "query",
      required: true,
      schema: { type: "string" }
    }
  ],
  responses: {
    200: { description: "Search results", content: { "application/json": { schema: z.any() } } }
  }
});
