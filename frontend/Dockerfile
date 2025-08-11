# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Ensure public directory exists and has required files
RUN mkdir -p public && \
    if [ ! -f public/index.html ]; then \
        echo '<!DOCTYPE html><html><head><title>Social Finance</title></head><body><div id="root"></div></body></html>' > public/index.html; \
    fi

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 