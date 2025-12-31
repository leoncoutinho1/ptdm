# Build Stage
FROM node:22-alpine AS build
WORKDIR /app

# Enable Corepack for Yarn 4 support
RUN corepack enable

# Copy package manager configs first for better caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies (using --immutable for reproducible builds in CI/Docker)
RUN yarn install --immutable

COPY . .
RUN yarn build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
