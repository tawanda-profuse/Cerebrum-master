# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Add build arguments for environment variables
ARG VITE_DEV_API_URL
ARG VITE_PROD_API_URL
ARG VITE_SERVER_DEV_URL
ARG VITE_SERVER_PROD_URL
ARG VITE_NODE_ENV

# Set environment variables
ENV VITE_DEV_API_URL=$VITE_DEV_API_URL
ENV VITE_PROD_API_URL=$VITE_PROD_API_URL
ENV VITE_SERVER_DEV_URL=$VITE_SERVER_DEV_URL
ENV VITE_SERVER_PROD_URL=$VITE_SERVER_PROD_URL
ENV VITE_NODE_ENV=$VITE_NODE_ENV

RUN npm run build:prod

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Copy a custom nginx configuration if you have one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]