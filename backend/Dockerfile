FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force


FROM node:24-alpine AS runtime

LABEL org.opencontainers.image.source="https://github.com/Louis-SLR/Atelier" \
      org.opencontainers.image.title="Atelier Backend" \
      org.opencontainers.image.description="API Node.js de suivi des interventions"

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]