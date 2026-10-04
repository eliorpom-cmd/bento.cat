FROM oven/bun:1.4.2@sha256:9114c058aeae42162ee16dd5084b95fe9473970bb6bcb5b232ab1630f0546895 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
ARG PUBLIC_CONVEX_URL
ARG PUBLIC_CONVEX_SITE_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG PUBLIC_GOOGLE_SIGN_IN_ENABLED=true
RUN bun run check:production && bun run build

FROM oven/bun:1.4.2@sha256:9114c058aeae42162ee16dd5084b95fe9473970bb6bcb5b232ab1630f0546895 AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile --ignore-scripts
COPY --from=build --chown=bun:bun /app/build ./build
USER bun
EXPOSE 3000
CMD ["bun", "build/index.js"]
