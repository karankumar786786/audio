# build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Copy all source files
COPY . .

RUN bun install --frozen-lockfile

# runtime stage
FROM oven/bun:latest

WORKDIR /app

# Copy the entire built workspace to preserve monorepo structure and hoisted node_modules
COPY --from=build /app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "audioBackend/src/index.ts"]
