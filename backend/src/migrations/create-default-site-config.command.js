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
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.ico',
    siteTitle: 'Lens',
    copyrightText: '2025 Ondsel Inc.',
    homepageContent: {
      title: 'Welcome to Lens',
      markdownContent: 'Welcome to Lens, your collaborative CAD platform. Upload, view, and share 3D models with version control, export capabilities, and real-time collaboration tools.',
      rssFeedEnabled: true,
      rssFeedUrl: `http://${app.get('host')}:${app.get('port')}/freecad-blog-rss`,
      rssFeedName: 'Latest FreeCAD Blog',
      banner: {
        enabled: false,
        title: 'Maintenance Notice',
        content: '# Service will be under maintenance from 10:00 to 12:00 UTC on 2099-12-31',
        color: '#283593'
      }
    },
    defaultModel: {
      fileName: 'sample.FCStd',
      filePath: 'sample.FCStd',
      objPath: 'sample_generated.FCSTD',
      thumbnailPath: 'public/sample_thumbnail.PNG',
      attributes: {
        "Fillet1": {
          "type": "length",
          "value": 20,
          "unit": "mm"
        },
        "Fillet2": {
          "type": "length",
          "value": 5,
          "unit": "mm"
        },
        "NumberOfCircles": {
          "type": "number",
          "value": 2,
          "unit": ""
        },
        "RadialDistance": {
          "type": "length",
          "value": 1000,
          "unit": "mm"
        },
        "TangentialDistance": {
          "type": "length",
          "value": 1000,
          "unit": "mm"
        },
        "Thickness": {
          "type": "length",
          "value": 80,
          "unit": "mm"
        }
      }
    },
    customized: {
      logoUrl: false,
      faviconUrl: false,
      siteTitle: false,
      copyrightText: false,
      homepageContent: false,
      defaultModel: false,
    }
  };

  // Insert the default site config
  await collection.insertOne(defaultSiteConfig);

  console.log(">>> site config created");
}
