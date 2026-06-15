FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL deps including devDependencies
RUN npm i

# Copy source
COPY . .

# Build TypeScript
RUN npm run build


# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production deps
RUN npm i

# Copy built output
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start"]