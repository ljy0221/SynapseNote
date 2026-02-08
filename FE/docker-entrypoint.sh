#!/bin/sh

echo "Generating config.js from environment variables..."

CONFIG_FILE="/usr/share/nginx/html/config.js"

echo "window.config = {" > "$CONFIG_FILE"

# Iterate over all environment variables starting with VITE_
env | grep '^VITE_' | while read -r line; do
  # Split by the first '='
  key=$(echo "$line" | cut -d= -f1)
  value=$(echo "$line" | cut -d= -f2-)
  
  # Write to config.js
  echo "  $key: \"$value\"," >> "$CONFIG_FILE"
done

echo "};" >> "$CONFIG_FILE"

echo "config.js generated successfully."

# Execute the CMD passed to docker run
exec "$@"
