FROM node:20-alpine AS build

WORKDIR /app

# Enable corepack for Yarn Berry
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn install

COPY . .

RUN yarn build

# Final stage utilizing Nginx Alpine - an ultra-lightweight web server
FROM nginx:alpine

# Copy custom nginx config for SPA routing (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the build stage to Nginx's HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
