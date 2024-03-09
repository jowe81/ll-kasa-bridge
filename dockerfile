# Use the official Node.js image as a base
FROM node:latest

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if present) to the working directory
COPY backend/package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY backend/. .

# Expose the port(s) your app uses
EXPOSE 3010
EXPOSE 4000
EXPOSE 9999/udp

# Command to run your application
CMD ["node", "jj-auto.js", "--import-map", "--import-config"]
