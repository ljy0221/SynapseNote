# 1단계: 빌드용 이미지 (Node + deps 설치 + build)
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 먼저 복사해서 캐시 활용
COPY package*.json ./
# pnpm/yarn이면 여기만 바꾸면 됨
RUN npm ci

# 소스 복사 후 빌드
COPY . .
# tsc로 dist 만들기 (package.json에 "build": "tsc" 가 있어야 함)
RUN npm run build


# 2단계: 실행용 이미지 (런타임만)
FROM node:20-alpine
ENV TZ=Asia/Seoul
WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --omit=dev

# 빌드 산출물만 복사
COPY --from=build /app/dist ./dist

EXPOSE 8080
ENV NODE_ENV=production
ENTRYPOINT ["node", "dist/index.js"]