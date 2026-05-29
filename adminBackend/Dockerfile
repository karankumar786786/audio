# build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Copy all source files
COPY . .

RUN bun install --frozen-lockfile

# runtime stage
FROM oven/bun:latest

# Install ffmpeg (required for yt-dlp)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire built workspace
COPY --from=build /app ./

ENV NODE_ENV=production
EXPOSE 4001

CMD ["bun", "adminBackend/src/index.ts"]
