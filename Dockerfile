# Use the official Node.js image with a specific version
FROM node:20-alpine

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies and PM2 globally
RUN npm install && npm install pm2 -g

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start the application using PM2
CMD ["pm2-runtime", "start", "npm", "--", "run", "start-main"]
