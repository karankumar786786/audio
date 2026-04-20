# build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Copy lockfile and package.json
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# runtime stage
FROM oven/bun:latest

# Install ffmpeg (required for yt-dlp)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/bin ./bin
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 4001

CMD ["bun", "src/index.ts"]
