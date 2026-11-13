# Build React client
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Run API + serve built client
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server ./server
COPY --from=client /app/client/dist ./client/dist
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "server/src/index.js"]
