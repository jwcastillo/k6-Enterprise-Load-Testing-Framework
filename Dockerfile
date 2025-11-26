FROM grafana/k6:latest

# Install Node.js for the runner
USER root
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the entire project
COPY . .

# Build TypeScript
RUN npm run build

# Set entrypoint
ENTRYPOINT ["node", "dist/core/cli.js"]
