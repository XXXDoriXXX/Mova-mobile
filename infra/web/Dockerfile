FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG EXPO_PUBLIC_API_URL=https://mova.dehimik.org/v1
ARG EXPO_PUBLIC_WS_URL=wss://mova.dehimik.org
ARG EXPO_PUBLIC_BETA_ONLY=true
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_WS_URL=$EXPO_PUBLIC_WS_URL \
    EXPO_PUBLIC_BETA_ONLY=$EXPO_PUBLIC_BETA_ONLY \
    CI=1
RUN npx expo export --platform web --output-dir dist

FROM nginx:1.27-alpine
COPY infra/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
EXPOSE 80
