# Admin Backend API Documentation

This document provides a detailed reference for all endpoints available in the `adminBackend` service. This service is designed for administrative tasks such as content management, artist onboarding, and system-wide modifications.

## Base URL
The base URL for all endpoints is:
`http://localhost:3000/api/v1`

---

## Response Format
Most endpoints return a standard `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

### Pagination
Paginated endpoints return a `PaginatedResult<T>` structure:

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

**Query Parameters for Pagination:**
- `page` (optional): The page number (default: 1).
- `limit` (optional): Items per page (default: 10).

---

## Endpoints

### Artists

#### 1. List Artists
Returns a paginated list of all artists.
- **URL**: `/artists`
- **Method**: `GET`
- **Pagination Support**: Yes

#### 2. Create Artist
Creates a new artist profile.
- **URL**: `/artists`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "string",
    "bio": "string (optional)",
    "dob": "string (YYYY-MM-DD)",
    "imageKey": "string",
    "bannerKey": "string"
  }
  ```

#### 3. Get Artist details
- **URL**: `/artists/:id`
- **Method**: `GET`

#### 4. Update Artist
- **URL**: `/artists/:id`
- **Method**: `PUT`
- **Body**: Partial updates allowed.

#### 5. Delete Artist
- **URL**: `/artists/:id`
- **Method**: `DELETE`

#### 6. Get Artist Songs
Returns all songs associated with an artist.
- **URL**: `/artists/:id/songs`
- **Method**: `GET`
- **Pagination Support**: Yes

---

### Playlists (System Playlists)

#### 1. List Playlists
Returns all system-wide playlists.
- **URL**: `/playlists`
- **Method**: `GET`
- **Pagination Support**: Yes

#### 2. Create Playlist
- **URL**: `/playlists`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "string",
    "coverImageKey": "string",
    "bannerImageKey": "string"
  }
  ```

#### 3. Add Song to Playlist
- **URL**: `/playlists/songs`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "playlistId": "string (Signed ID)",
    "songId": "string (Signed ID)"
  }
  ```

#### 4. Remove Song from Playlist
- **URL**: `/playlists/songs`
- **Method**: `DELETE`
- **Body**: Same as Add Song.

---

### Songs

#### 1. Create Song (Job Initialization)
Initializes a processing job for a new song.
- **URL**: `/songs`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "title": "string",
    "artistName": "string",
    "tempSongKey": "string",
    "imageKey": "string"
  }
  ```

#### 2. List Songs
- **URL**: `/songs`
- **Method**: `GET`
- **Pagination Support**: Yes

---

### Misc / Utilities

#### 1. Pre-Signed Song URL
Generates a URL for direct upload to the temporary storage.
- **URL**: `/misc/presigned-url/song`
- **Method**: `GET`

#### 2. Pre-Signed Image URL
Generates authentication parameters for ImageKit uploads.
- **URL**: `/misc/presigned-url/image`
- **Method**: `GET`
