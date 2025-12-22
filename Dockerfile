FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies (including dev deps required for tsx)
# Some repos may not include package-lock.json; copy package.json
# and use `npm install` which works when lockfile is absent.
COPY package.json ./
RUN npm install --silent

# Copy source
COPY . .

# Expose server port
EXPOSE 5000

# Default command: attempt DB migration then start in dev mode (tsx)
CMD ["sh", "-c", "npm run db:push || true && npm run dev"]
