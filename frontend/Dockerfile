FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginxinc/nginx-unprivileged:1.29.5-alpine AS runtime

LABEL org.opencontainers.image.source="https://github.com/Louis-SLR/Atelier" \
      org.opencontainers.image.title="Atelier Frontend" \
      org.opencontainers.image.description="Interface web de suivi des interventions"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080