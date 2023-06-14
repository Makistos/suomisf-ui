# Use the official Node.js base image
FROM node:latest AS build

# Set the working directory in the container
WORKDIR /build

# Copy package.json and package-lock.json to the working directory
COPY package.json package.json
COPY yarn.lock yarn.lock

# Install the dependencies
RUN yarn install --production=false

COPY . .
