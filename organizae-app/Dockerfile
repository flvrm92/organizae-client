# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG BUILD_ENV=production
ARG API_URL=https://localhost:7006
RUN sed -i "s|apiUrl: '.*'|apiUrl: '${API_URL}'|g" src/environments/environment.ts src/environments/environment.development.ts

RUN npm run build --configuration ${BUILD_ENV}

# Runtime stage
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/organizae-app/browser /usr/share/nginx/html
EXPOSE 80
