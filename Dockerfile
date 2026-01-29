FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@latest --activate

# Use a standard, non-conflicting path
WORKDIR /usr/src/app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copy everything (including your new /routing folder)
COPY . .

# Build the 11ty site into /dist
RUN pnpm exec eleventy

EXPOSE 3000

# Tell Node exactly where the script moved to
CMD ["node", "routing/server.js"]