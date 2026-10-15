# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS dependencies
ARG PNPM_VERSION=12.6.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
# Source edits must not invalidate the dependency layer.
# Scripts are skipped: postinstall (`nuxt prepare`) needs the sources and `nuxt build` runs it anyway.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=jewell-nuxt-pnpm,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts

FROM dependencies AS build
ENV NODE_ENV=production
COPY nuxt.config.ts tsconfig.json ./
COPY app ./app
COPY server ./server
COPY shared ./shared
COPY i18n ./i18n
COPY public ./public
# nuxt.config.ts allows IPX to download originals only from this host, so the Strapi URL
# is needed at build time. It is public; tokens are supplied by Coolify at runtime only.
ARG NUXT_STRAPI_URL=
ENV NUXT_STRAPI_URL=${NUXT_STRAPI_URL}
RUN pnpm run build

# Nitro output is self-contained: no node_modules in the runtime image.
FROM base AS runtime
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=3000
# Coolify ignores the Dockerfile HEALTHCHECK and runs its own check with curl/wget,
# which node:slim does not ship.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/.output ./.output
# Disk cache of /_ipx responses. A named volume mounted here inherits the owner of this directory.
ENV IPX_CACHE_DIR=/app/ipx-cache
RUN mkdir -p ${IPX_CACHE_DIR} && chown node:node ${IPX_CACHE_DIR}
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.NITRO_PORT||3000)+'/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
