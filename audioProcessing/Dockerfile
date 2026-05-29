# build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Copy all source files
COPY . .

RUN bun install --frozen-lockfile

# runtime stage
FROM oven/bun:latest

# Install ffmpeg and curl for shaka-packager download
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Download Shaka Packager binary
RUN curl -L https://github.com/shaka-project/shaka-packager/releases/download/v3.4.1/packager-linux-x64 -o /usr/bin/packager && \
    chmod +x /usr/bin/packager

WORKDIR /app

# Copy the entire built workspace
COPY --from=build /app ./

ENV NODE_ENV=production
EXPOSE 3002

CMD ["bun", "audioProcessing/src/index.ts"]
