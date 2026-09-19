# Construction et exécution dans la même image : le serveur sert l'API ET le
# dist/ du client, comme sur ecoride. Un seul conteneur à déployer.
# `slim` (Debian) et non `alpine` : le binaire Piper exige la glibc (#124). Les
# DEUX étages partagent la base — `node_modules` passe de l'un à l'autre, et un
# module natif construit pour musl ne se chargerait pas sous glibc.
FROM node:22-slim AS build
WORKDIR /app
# Coolify injecte NODE_ENV=production dans le BUILD : `npm ci` sautait alors
# les devDependencies, et `vite` — l'outil de construction — n'existait pas.
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npx vite build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# La voix de la dictée (#124) : Piper et la voix fr_FR-siwis-medium, DANS
# l'image — un seul conteneur à déployer, rien à configurer dans Coolify. Posé
# AVANT les COPY : cette couche de ~110 Mo ne bouge jamais, elle reste en cache
# d'un déploiement à l'autre. Versions ÉPINGLÉES : une image reconstruite
# demain doit parler avec la même voix qu'aujourd'hui.
ARG PIPER_VERSION=2023.11.14-2
ARG VOIX_URL=https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx
# `curl` et `wget` RESTENT dans l'image : le healthcheck de Coolify et celui de
# `docker-compose.yml` s'exécutent DANS le conteneur, et `node:22-slim` n'a ni
# l'un ni l'autre (sous alpine, `wget` venait de busybox).
# Chaque téléchargement est VÉRIFIÉ : une archive remplacée en amont doit faire
# échouer la construction, pas entrer dans l'image qui sert des enfants.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl wget \
 && rm -rf /var/lib/apt/lists/* \
 && case "$(dpkg --print-architecture)" in \
      amd64) PLATEFORME=x86_64  SOMME=a50cb45f355b7af1f6d758c1b360717877ba0a398cc8cbe6d2a7a3a26e225992 ;; \
      arm64) PLATEFORME=aarch64 SOMME=fea0fd2d87c54dbc7078d0f878289f404bd4d6eea6e7444a77835d1537ab88eb ;; \
      *) echo "Piper n'a pas de binaire pour $(dpkg --print-architecture)" && exit 1 ;; \
    esac \
 && mkdir -p /opt/voix \
 && curl -fsSL -o /tmp/piper.tar.gz "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_${PLATEFORME}.tar.gz" \
 && curl -fsSL -o /opt/voix/fr_FR-siwis-medium.onnx "${VOIX_URL}" \
 && curl -fsSL -o /opt/voix/fr_FR-siwis-medium.onnx.json "${VOIX_URL}.json" \
 && printf '%s  %s\n' \
      "$SOMME" /tmp/piper.tar.gz \
      641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99 /opt/voix/fr_FR-siwis-medium.onnx \
      39479916c2db192b5ac9764daddd0c744d83e023ad890c6976c0633ae4df8959 /opt/voix/fr_FR-siwis-medium.onnx.json \
    | sha256sum -c - \
 && tar -xzf /tmp/piper.tar.gz -C /opt && rm /tmp/piper.tar.gz
# Sans ces deux variables, le serveur tourne sans voix et la dictée parle avec
# celle du navigateur : c'est le régime du développement et de la CI.
ENV PIPER_BIN=/opt/piper/piper
ENV PIPER_MODELE=/opt/voix/fr_FR-siwis-medium.onnx

# `tsx` et `drizzle-kit` servent à l'exécution (démarrage TypeScript, migrations
# au boot) : on garde les node_modules complets plutôt que de compiler.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
EXPOSE 3000
CMD ["node", "--import", "tsx", "server/scripts/start-production.ts"]
