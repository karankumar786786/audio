# Audio Backend API Documentation

This document provides a detailed reference for all endpoints available in the `audioBackend` service. This service handles the core user-facing functionality of the application.

## Base URL
The base URL for all endpoints is:
`http://localhost:3000/api/v1`

---

## Response Format
The API follows a standardized response format using the `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

### Pagination
For list endpoints, the `data` field contains a `PaginatedResult<T>`:

```json
{
  "items": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Security: Signed IDs
> [!IMPORTANT]
> To prevent unauthorized access and resource manipulation, this API uses **Signed IDs**. IDs passed in routes or bodies (like `userId` or `songId`) must be cryptographically signed by the server. Unsigned IDs will result in a validation error.

---

## Endpoints

### System Status
Utility endpoint for health checks.
- **URL**: `/status`
- **Method**: `GET`

---

### Songs

#### 1. Fetch Songs
- **URL**: `/songs`
- **Method**: `GET`
- **Pagination Support**: Yes

#### 2. Get Song by ID
- **URL**: `/songs/:id` (Signed ID)
- **Method**: `GET`

---

### Users

#### 1. Register / Sync User
Typically used as an Auth0 post-login callback.
- **URL**: `/users/:access-token`
- **Method**: `POST`

#### 2. Get User Profile
- **URL**: `/users/:id` (Signed ID)
- **Method**: `GET`

#### 3. Favourites
- **Add to Favourites**: `POST /users/favourites`
- **Remove Favourites**: `DELETE /users/favourites`
- **Get Favourites**: `GET /users/:userId/favourites` (Paginated)
- **Body**: `{ "userId": "signedId", "songId": "signedId" }`

#### 4. Listen History
- **URL**: `/users/:userId/history` (Signed ID)
- **Method**: `GET`
- **Pagination Support**: Yes

#### 5. Search History
- **Get History**: `GET /users/:userId/search-history`
- **Save Search**: `POST /users/search-history`
- **Clear History**: `DELETE /users/:userId/search-history`

#### 6. Personal Playlists
- **List Playlists**: `GET /users/:userId/playlists`
- **Create Playlist**: `POST /users/playlists`
- **Add Song to Playlist**: `POST /users/playlists/songs`
- **Remove Song**: `DELETE /users/playlists/songs`

---

### Interactions

#### 1. Record Listen
Updates the listen count and history for a song.
- **URL**: `/interactions/listen`
- **Method**: `POST`
- **Body**: `{ "userId": "signedId", "songId": "signedId", "part": number }`

#### 2. Trending Songs
Returns a list of songs with the most listens.
- **URL**: `/interactions/trending`
- **Method**: `GET`
- **Pagination Support**: Yes

#### 3. Recommendations
Personalized recommendations based on listen history.
- **URL**: `/interactions/recommendations/:userId`
- **Method**: `GET`

---

### Artists

#### 1. List Artists
- **URL**: `/artists`
- **Method**: `GET`

#### 2. Get Artist Profile
- **URL**: `/artists/:id` (Signed ID)
- **Method**: `GET`

#### 3. Get Artist Songs
- **URL**: `/artists/:id/songs`
- **Method**: `GET`

---

### Search

#### 1. Unified Search
Executes a multi-index search (Songs, Artists, Playlists) via Algolia.
- **URL**: `/search?query=...`
- **Method**: `GET`

---

### Misc

#### 1. Get Image Upload Signature
- **URL**: `/misc/presigned-url/image`
- **Method**: `GET`
