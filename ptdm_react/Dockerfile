FROM node:20-alpine AS build

WORKDIR /app

# Enable corepack for Yarn Berry
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn install

COPY . .

RUN yarn build

# Final stage utilizing 'serve' - a static file server for Node.js
# This removes the need for an internal Nginx configuration
FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app

# Copy the build output
COPY --from=build /app/dist .

EXPOSE 3000

# Start server on port 3000, single-page application mode (-s)
CMD ["serve", "-s", ".", "-l", "3000"]
