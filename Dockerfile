# 1단계: 빌드
FROM node:20-bullseye AS builder
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 전체 코드 복사
COPY . .

# Prisma Client 생성
RUN npx prisma generate

# Remix/웹앱 빌드
RUN npm run build

# 2단계: 런타임 컨테이너
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production

# 빌드 결과/의존성만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# Postgres에 마이그레이션 적용 후 앱 시작
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]