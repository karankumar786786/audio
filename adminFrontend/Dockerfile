# build stage
FROM node:20-slim AS build

WORKDIR /app

# Copy lockfile and package.json
COPY package.json bun.lock ./

RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Remove ALL native SWC binaries to force WASM fallback
RUN find node_modules -type d -name "@next" | xargs -I{} find {} -maxdepth 1 -name "swc-*" -type d | xargs rm -rf

# Disable telemetry and specifically enable WASM fallback
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_TURBOPACK=1
ENV NEXT_PRIVATE_LOCAL_SKIP_SWC_CHECK=1
ENV NEXT_OTEL_FETCH_DISABLED=1

# Run build with explicitly specified Webpack to avoid Turbopack native binary crashes
RUN npx next build --webpack

# runtime stage
FROM oven/bun:latest AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["bun", "server.js"]