FROM node:18-alpine

WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

COPY . .

RUN mkdir -p logs

EXPOSE 5000

CMD ["npm", "start"]