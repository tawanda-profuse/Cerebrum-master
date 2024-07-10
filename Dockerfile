# Use the official Node.js image with a specific version
FROM node:20

# Install necessary dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1 \
    libfreetype6 \
    libfreetype6-dev \
    libharfbuzz0b \
    ca-certificates \
    fonts-freefont-ttf \
    wget \
    gnupg

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies, PM2 globally, and Playwright
RUN npm install && \
    npm install pm2 -g && \
    npx playwright install --with-deps chromium

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start the application using PM2
CMD ["pm2-runtime", "start", "npm", "--", "run", "start-main"]
