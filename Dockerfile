FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:../data/store.db

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate && npm run build

RUN mkdir -p /app/data

EXPOSE 3000

# Crea/actualiza tablas y siembra el catálogo la primera vez; luego arranca.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node scripts/seed.mjs && npm start"]
