#!/bin/bash

# SPDX-FileCopyrightText: 2025 Amritpal Singh <amrit3701@gmail.com>
#
# SPDX-License-Identifier: AGPL-3.0-or-later

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
