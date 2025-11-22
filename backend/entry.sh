#!/bin/bash

# Run migrations before starting the application
npm run migration addInitialTosPp
npm run migration createDefaultSiteConfig
npm run migration addDefaultAdminUser
npm run migration createDefaultPublisherEntries

# Start the application
if [ "$NODE_ENV" = "development" ]; then
  npm run dev
else
  npm run start
fi
