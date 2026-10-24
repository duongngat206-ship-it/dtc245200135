FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY . .

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
