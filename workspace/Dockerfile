# Use the official Node.js image
FROM node:14

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY workspace/package*.json ./workspace/

# Install dependencies
RUN npm install --prefix ./workspace

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run the application
CMD ["node", "workspace/server.js"]
