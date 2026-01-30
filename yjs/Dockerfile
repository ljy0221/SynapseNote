# 1단계: 빌드
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# 2단계: 런타임
FROM node:20-alpine
ENV TZ=Asia/Seoul
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 1234
ENTRYPOINT ["node", "dist/index.js"]