# Use Node.js base image
FROM node:22

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of backend source code
COPY . .

# Expose the backend port
EXPOSE 8081

# Start the server
CMD ["node", "server.js"]
