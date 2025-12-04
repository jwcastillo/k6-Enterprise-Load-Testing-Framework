FROM grafana/k6:latest

# Install Node.js for the runner
USER root
RUN apk add --no-cache nodejs npm bash

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

# Make scripts executable
RUN chmod +x bin/testing/run-test.sh

# Set entrypoint to use the wrapper script
# Usage: docker run k6-runner --client=latam --test=example.ts
ENTRYPOINT ["./bin/testing/run-test.sh"]

