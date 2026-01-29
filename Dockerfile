FROM node:20-slim
# Enable corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lockfile and package.json
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build the static site
RUN pnpm exec eleventy

EXPOSE 3000
CMD ["node", "server.js"]