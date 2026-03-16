FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
# Running in dev mode to ensure local reliability
CMD ["npm", "run", "dev"]