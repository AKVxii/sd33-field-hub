FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
# Seed default data files if volume is empty
CMD ["sh", "-c", "node -e \"const fs=require('fs');const p='data';if(!fs.existsSync(p))fs.mkdirSync(p);\" && node server.js"]
