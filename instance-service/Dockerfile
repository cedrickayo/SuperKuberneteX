FROM node:18-alpine

WORKDIR /app

RUN mkdir -p /app/uploads && chown -R node:node /app

COPY package*.json ./

RUN npm ci --only=production

COPY src ./src

EXPOSE 5001

USER node

CMD ["node", "src/index.js"]

