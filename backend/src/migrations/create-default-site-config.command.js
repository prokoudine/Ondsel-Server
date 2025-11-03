// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ObjectId } from 'mongodb';
import { siteConfigId } from '../services/site-config/site-config.schema.js';

export async function createDefaultSiteConfigCommand(app) {
  // Check if site config already exists
  console.log(">>> checking for site config");
  const db = await app.get('mongodbClient');
  const collection = db.collection('site-config');

  const existingConfig = await collection.findOne({ _id: new ObjectId(siteConfigId) });

  if (existingConfig) {
    console.log(">>> site config already exists, skipping migration");
    return;
  }

  console.log(">>> creating default site config");
  const defaultSiteConfig = {
    _id: new ObjectId(siteConfigId),
    logoUrl: '/ondsel_logo.svg',
    faviconUrl: '/favicon.ico',
    siteTitle: 'Lens',
    customized: {
      logoUrl: false,
      faviconUrl: false,
      siteTitle: false,
    }
  };

  // Insert the default site config
  await collection.insertOne(defaultSiteConfig);

  console.log(">>> site config created");
}
