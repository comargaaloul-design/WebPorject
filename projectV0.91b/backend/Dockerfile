FROM node:18-bullseye-slim

WORKDIR /app

# Add curl for healthcheck and update certificates
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production --no-audit --no-fund

COPY . .

RUN mkdir -p logs

EXPOSE 5000

CMD ["npm", "start"]