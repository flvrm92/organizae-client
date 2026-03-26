# Build stage
FROM node:24.2.0 AS build
WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY . .

ARG BUILD_ENV=production
ARG API_URL=https://localhost:7006
RUN sed -i "s|apiUrl: '.*'|apiUrl: '${API_URL}'|g" src/environments/environment.ts src/environments/environment.development.ts src/environments/environment.production.ts

RUN npm run build -- --configuration ${BUILD_ENV}

# Runtime stage
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/organizae-app/browser /usr/share/nginx/html
EXPOSE 80
