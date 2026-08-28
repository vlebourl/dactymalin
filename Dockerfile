# Construction et exécution dans la même image : le serveur sert l'API ET le
# dist/ du client, comme sur ecoride. Un seul conteneur à déployer.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# `tsx` et `drizzle-kit` servent à l'exécution (démarrage TypeScript, migrations
# au boot) : on garde les node_modules complets plutôt que de compiler.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src
EXPOSE 3000
CMD ["node", "--import", "tsx", "server/src/index.ts"]
