# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app
# Copy package files
COPY package*.json ./
RUN npm install --production=false
# Copy source code
COPY . .
# Accept the API URL as a build-time argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
# Build the app
RUN npm run build
# Install serve globally
RUN npm install -g serve
EXPOSE 3000
# Use serve to host the static files
CMD ["serve", "-s", "build", "-l", "3000", "--single"]