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

# Install ffmpeg and curl for shaka-packager download
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Download Shaka Packager binary
RUN curl -L https://github.com/shaka-project/shaka-packager/releases/download/v3.4.1/packager-linux-x64 -o /usr/bin/packager && \
    chmod +x /usr/bin/packager

WORKDIR /app

# Copy from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3002

CMD ["bun", "src/index.ts"]
