#!/bin/bash

# Set default values for environment variables
if [ -z "$VITE_APP_API_URL" ]; then
  VITE_APP_API_URL=$(. /env.sh && echo $VITE_APP_API_URL)
fi

if [ -z "$VITE_MATOMO_URL" ]; then
  VITE_MATOMO_URL=$(. /env.sh && echo $VITE_MATOMO_URL)
fi

if [ -z "$VITE_MATOMO_SITE" ]; then
  VITE_MATOMO_SITE=$(. /env.sh && echo $VITE_MATOMO_SITE)
fi

if [ -z "$VITE_STRIPE_PURCHASE_PEER_URL" ]; then
  VITE_STRIPE_PURCHASE_PEER_URL=$(. /env.sh && echo $VITE_STRIPE_PURCHASE_PEER_URL)
fi

# Copy the build files to the app directory
cp -r /opt/dist/* /app/

# Replace the placeholders with the actual values
find /app -type f -exec sed -i "s|__VITE_APP_API_URL__|$VITE_APP_API_URL|g" {} \;
find /app -type f -exec sed -i "s|__VITE_MATOMO_URL__|$VITE_MATOMO_URL|g" {} \;
find /app -type f -exec sed -i "s|__VITE_MATOMO_SITE__|$VITE_MATOMO_SITE|g" {} \;
if [ -n "$VITE_STRIPE_PURCHASE_PEER_URL" ]; then
  find /app -type f -exec sed -i "s|__VITE_STRIPE_PURCHASE_PEER_URL__|$VITE_STRIPE_PURCHASE_PEER_URL|g" {} \;
fi

/usr/local/openresty/bin/openresty -g 'daemon off;'
