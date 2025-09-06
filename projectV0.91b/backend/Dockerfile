FROM node:18-alpine3.17

WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund

COPY . .

RUN mkdir -p logs

EXPOSE 5000

CMD ["npm", "start"]