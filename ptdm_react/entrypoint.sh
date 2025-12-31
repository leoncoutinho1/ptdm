#!/bin/sh

# Define default values if env vars are missing
API_URL=${API_URL:-"http://localhost:5215/"}
VITE_APP_NAME=${VITE_APP_NAME:-"Vite + React"}

echo "Generating config.js with API_URL=$API_URL and VITE_APP_NAME=$VITE_APP_NAME"

# Overwrite config.js with actual environment variables
cat <<EOF > /usr/share/nginx/html/config.js
window.env = {
  API_URL: "$API_URL",
  VITE_APP_NAME: "$VITE_APP_NAME"
};
EOF

# Execute the command passed to docker (start nginx)
exec "$@"
