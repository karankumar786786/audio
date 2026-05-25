# 🎵 One Melody: Production-Grade Distributed Music Streaming & Audio Processing Platform

One Melody is a state-of-the-art, production-grade distributed music streaming platform structured as a monorepo. It features a modern user frontend, a comprehensive administration dashboard, dual user/admin backends, an asynchronous audio processing/HLS transcoding pipeline, and a dedicated Python digital signal processing (DSP) feature extraction service.

## 🚀 Key Technical Highlights (Resume Ready)
- **High-Performance Monorepo Architecture**: Designed and built a high-performance monorepo-based music platform using a microservices architecture (Next.js, Bun/Hono, Python FastAPI) served via Docker, Traefik, and Caddy.
- **Asynchronous Event-Driven Orchestration**: Developed an asynchronous event-driven audio ingestion pipeline using Inngest, orchestrating HLS transcoding (FFmpeg), Whisper-based transcription, and Python-based Digital Signal Processing.
- **Acoustic Analytics & Vector Recommendations**: Implemented Python DSP analytics using the Essentia library to extract acoustic features (BPM, spectral flux, zero-crossing rates) to build a vector recommendation engine powered by Recombee.
- **Cryptographic Security Gateway**: Secured user routes and media files against IDOR attacks by deploying a custom cryptographic Signed ID utility at the API gateway layer.

---

## 📸 Product Walkthrough & Visual Interface

Below is a detailed visual guide of the One Melody platform, utilizing the screenshots provided in `readmeImages/`.

### 1. The Gateway: Landing Page & Initial Impression
The portal showcases a modern, high-performance dark-themed landing page. It introduces users to the platform's features, complete with custom-designed ambient background blobs, layout specifications, system FAQs, and call-to-actions.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.07.41 PM.png" alt="One Melody Landing Page" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

### 2. The Core Experience: Music Player & Home Feed
Upon logging in, users are greeted by the main application shell. The interface features a curated header carousel, top artists, system playlists, personal recommendations, and an infinite-scrolling tracks feed. At the bottom, a custom HLS ambient floating audio player controls playback.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.28.41 PM.png" alt="Main Music Feed & Floating Player" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

### 3. Dynamic Visual Layouts & Fluid Navigation
With glassmorphic design and subtle animations, the main tracks list and the sidebar navigation are highly responsive. The app updates dynamically depending on the current track context, generating color-coordinated ambient lighting effects.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.28.58 PM.png" alt="Visual Themes & Track Listing" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

### 4. Featured Playlists & Curated Recommendations
The user interface features a grid for playlists and personalized recommendation feeds. These are powered dynamically by backend telemetry tracking user listens and comparing acoustic vectors.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.29.13 PM.png" alt="Playlists & Recommendations" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

### 5. Interactive Lyrics & Multi-bitrate HLS Quality Switching
The player features a synchronized lyrics overlay tracking current playback progress. It includes an HLS stream quality selector, letting users switch between multiple audio bitrates dynamically depending on network performance.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.29.24 PM.png" alt="Synchronized Lyrics & Audio Quality Selector" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

### 6. Unified Instant Search
Powered by Algolia, search is fast and comprehensive. It returns filtered search results matching tracks, artists, and playlists instantaneously as the user types.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.29.36 PM.png" alt="Instant Search Dashboard" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

### 7. Administrative Control Panel
The administration frontend allows system admins to monitor the entire platform. The dashboard features high-level analytics, quick links to upload tracks, manage artist entries, and check database and API availability.
<br />
<img src="./readmeImages/Screenshot 2026-05-25 at 10.29.56 PM.png" alt="Admin Analytics & Management Console" width="900" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;" />

---

## 🏗️ Architecture & Flow Overview

One Melody is built as a set of decoupled services coordinated through an event-driven task queue. Below is the system blueprint mapping requests and job events:

```mermaid
graph TD
    User([User Client]) -->|Interact| AF[audioFrontend - Next.js]
    Admin([System Admin]) -->|Manage| AdF[adminFrontend - Next.js]

    AF -->|HTTP API Requests| AB[audioBackend - Bun/TS]
    AdF -->|HTTP API Requests| AdB[adminBackend - Bun/TS]

    AB -->|Read/Write| DB[(Neon PostgreSQL)]
    AdB -->|Read/Write| DB

    %% Inngest Orchestration
    AdB -->|Publish Event| Inngest{{Inngest Event Bus}}
    Inngest -->|Job: Transcode & Transcribe| AP[audioProcessing - TS Service]
    Inngest -->|Job: Extract DSP Features| AFE[audioFeatureExtraction - Python/Essentia]

    AP -->|1. Convert to HLS| S3[(AWS S3 Storage)]
    AP -->|2. Transcribe to VTT| S3
    
    AFE -->|Download & Extract DSP| S3
    AFE -->|Callback Event| Inngest

    Inngest -->|Index Features| Rec[(Recombee AI Recommender)]
    Inngest -->|Index Metadata| Alg[(Algolia Unified Search)]
```

---

## 🛠️ Monorepo Workspaces & Services

The codebase is organized as a monorepo using Bun workspaces:

### 1. `audioFrontend` (User Client)
- **Tech Stack**: Next.js (App Router), Tailwind CSS, Framer Motion, TanStack Query, TanStack Store.
- **Key Features**:
  - HLS-powered audio player (`Hls.js`) supporting multiple audio bitrates.
  - Interactive, synchronized karaoke-style lyrics parser (`.vtt` or `.json` captions).
  - Infinite-scroll track discovery, playlist management, and user listen history tracking.
  - HSL-themed dynamic ambient glows adapted to match active album art.

### 2. `adminFrontend` (Admin Client)
- **Tech Stack**: Next.js (App Router), Tailwind CSS, TanStack Query.
- **Key Features**:
  - Unified system control board showing database and backend API status.
  - Content manager for creating and editing artist profiles (metadata, DOB, banners, bios).
  - Track upload wizard offering direct-to-S3 signed uploads and YouTube-to-S3 imports.
  - Real-time job tracking system reporting transcoding progress.

### 3. `audioBackend` (User Web Services API)
- **Tech Stack**: Bun Runtime, Hono/Express, Drizzle ORM, Neon PostgreSQL.
- **Key Features**:
  - Standardized JSON responses (`ApiResponse<T>`) and paginated list containers.
  - User sync callback endpoint designed for Auth0 logins.
  - Interactive APIs: trending songs tracking, listen recording, user playlists, and personal favourites.
  - Cryptographic **Signed IDs** security layer (e.g. `userId` and `songId` signatures) to protect resource access.

### 4. `adminBackend` (Management API)
- **Tech Stack**: Bun Runtime, Drizzle ORM, Neon PostgreSQL.
- **Key Features**:
  - Administrative endpoints for managing system playlists and creating artist database records.
  - Secure pre-signed URL generator for uploading audio/image assets directly to S3 and ImageKit.
  - Dispatches job creation events to the Inngest queue.

### 5. `audioProcessing` (Audio Pipelines worker)
- **Tech Stack**: Node.js/Bun, FFmpeg, ImageKit API, `yt-dlp`.
- **Key Features**:
  - **Transcoding**: Splits raw audio files into discrete HLS segments (`.ts`) and creates playlist manifests (`.m3u8`) for adaptive streaming.
  - **YouTube Import**: Pipes streams from `yt-dlp` straight into S3 temporary storage and processes remote thumbnails via ImageKit.
  - **Transcription**: Calls transcription interfaces to generate JSON/VTT captions, stored in AWS S3 alongside transcoded tracks.

### 6. `audioFeatureExtraction` (Acoustic DSP Service)
- **Tech Stack**: Python (FastAPI), Essentia DSP Library, NumPy, `boto3`.
- **Key Features**:
  - Analyzes audio samples to extract critical acoustic metrics: Duration, Loudness, Dynamic Complexity, BPM, Spectral Centroid, Spectral Flux, and Zero Crossing Rate.
  - Integrates with the Inngest runner using Python SDK handlers.

### 7. `packages/*` (Shared Modules)
- **`@onemelody/core`**: Drizzle database connection configurations, Drizzle entity schemas, shared repository layers (Songs, Jobs, Artists), and cryptographical signature services.
- **`@onemelody/api`**: Client SDK packages used by the Frontends to interact with the backend APIs.

---

## ⚡ Asynchronous Ingestion & Processing Pipeline

When an admin uploads a song or imports it from YouTube, it triggers an event-driven workflow managed by **Inngest**:

```
[Upload / Youtube Import] 
       │
       ▼
1. audio/song.transcode ──────► [audioProcessing] Transcodes raw file to HLS (.m3u8 + segments)
       │
       ▼
2. audio/song.transcribe ─────► [audioProcessing] Generates Whisper-based captions (.vtt / .json)
       │
       ▼
3. audio/song.features.extract ──► [audioFeatureExtraction] Python Essentia extracts DSP features
       │
       ▼
4. audio/song.features.extracted ◄── [Inngest Worker] updates job db metadata with DSP variables
       │
       ▼
5. audio/song.index.recombee ──► Synchronizes song details & DSP features to Recombee recommendation engine
       │
       ▼
6. audio/song.index.algolia ───► Indexes title, artist, duration, image, and language to Algolia Search
       │
       ▼
7. audio/song.final.create ────► Finalizes job status, cleans up raw temp S3 files, saves song in database
```

---

## 🔒 Security & Performance Details

- **Cryptographic Signed IDs**: Rather than exposing raw database IDs (UUIDs/Ints), identifiers (like `songId` or `userId`) are passed as signatures cryptographically signed by the backend. This prevents insecure direct object references (IDOR) and unauthorized interactions.
- **HLS Segmented Streaming**: Audio is never delivered raw. It is transcoded into HTTP Live Streaming (HLS) formats, chunked into short segments, and streamed adaptively based on client quality selectors.
- **CDN Optimization**: All graphics (banners, cover arts, profile pictures) are managed through ImageKit, utilizing real-time CDN caching, auto-compression, and modern format delivery (`WebP`/`AVIF`).

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root (and relevant subdirectories as needed) and configure the variables:

```ini
# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# AWS / S3 Configuration
ACCESS_KEY_ID=your_access_key
SECRET_KEY=your_secret_key
REGION=ap-south-1
S3_BUCKET=your_bucket_name
TEMP_BUCKET_NAME=videotranscodetemp
PRODUCTION_BUCKET_NAME=audioprocessingproduction

# Database Configuration (Neon/PostgreSQL)
DATABASE_URL=postgres://user:password@hostname/dbname

# External Integrations
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
RECOMBEE_DATABASE_ID=your_recombee_db_id
RECOMBEE_PRIVATE_TOKEN=your_recombee_token
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_secret
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Auth0 Configuration
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
```

---

## 🚀 Setup & Execution

### Local Development Setup

1. **Install Dependencies**
   Install dependencies across the entire monorepo:
   ```bash
   bun install
   ```

2. **Database Migrations**
   Generate and apply migrations using Drizzle:
   ```bash
   # From packages/core directory
   bunx drizzle-kit generate
   bunx drizzle-kit migrate
   ```

3. **Start Services Independently**
   You can run workspaces individually using Bun:
   ```bash
   # Launch User Frontend
   bun --filter frontend dev
   
   # Launch Admin Frontend
   bun --filter admin-frontend dev

   # Launch User API Backend
   bun --filter audiobackend dev
   
   # Launch Admin API Backend
   bun --filter adminbackend dev
   
   # Launch Audio Processor
   bun --filter audioprocessing dev
   ```

4. **Python DSP Worker Setup**
   Run the FastAPI feature extractor:
   ```bash
   cd audioFeatureExtraction
   uv venv
   source .venv/bin/activate
   uv pip install -r pyproject.toml
   python main.py
   ```

5. **Run Inngest Dev Server**
   Start the Inngest development server to route events locally:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:3002/api/inngest
   ```

### Production Deployment (Docker Compose)

The workspace includes a `docker-compose.yml` pre-configured with **Traefik** and **Caddy** for reverse proxy routing.

To build and start the entire cluster in production mode:
```bash
docker-compose up --build -d
```

#### Routing Table (configured in Traefik labels):
- `one-org.me` / `www.one-org.me` ──► User Next.js Frontend (`audio-frontend`)
- `admin.one-org.me` ──────────────► Admin Next.js Frontend (`admin-frontend`)
- `api.one-org.me` ────────────────► User Express/Hono API Backend (`audio-backend`)
- `admin-api.one-org.me` ──────────► Admin API Backend (`admin-backend`)
- `process.one-org.me` ────────────► Inngest TS Worker (`audio-processing`)
- `extract.one-org.me` ────────────► Inngest Python DSP Worker (`audio-feature-extraction`)
