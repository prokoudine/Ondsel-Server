// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import feathersClient, { makeServicePlugin, BaseModel } from '@/plugins/feathers-client'
import store from '@/store'

// Fixed ID for the single site config document
export const SITE_CONFIG_ID = '000000000000000000000000'

class SiteConfig extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }

  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'SiteConfig'

  // Define default properties here
  static instanceDefaults() {
    return {
      logoUrl: '/ondsel_logo.svg',
      faviconUrl: '/favicon.ico',
      siteTitle: 'Lens',
      copyrightText: '2025 Ondsel Inc.',
      homepageContent: {
        title: 'Welcome to Lens',
        markdownContent: 'Welcome to Lens, your collaborative CAD platform. Upload, view, and share 3D models with version control, export capabilities, and real-time collaboration tools.',
        rssFeedUrl: 'https://ondsel.com/blog/rss',
        rssFeedName: 'Latest Ondsel Blog',
        banner: {
          enabled: false,
          title: 'Shutdown Notice',
          content: '# Service is Shutting Down as of November 22nd, 2024\n## Please download any of your files that you want to keep!',
          color: '#283593'
        },
      },
      defaultModel: {
        filePath: 'ondsel.FCStd',
        objPath: 'ondsel_generated.FCSTD',
        thumbnailPath: 'public/ondsel_thumbnail.PNG',
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
        defaultModel: false
      }
    }
  }
}

const servicePath = 'site-config'
const servicePlugin = makeServicePlugin({
  Model: SiteConfig,
  service: feathersClient.service(servicePath),
  servicePath
})

// Sync function to update app state when site-config service updates
function syncToAppState(config) {
  if (config._id === SITE_CONFIG_ID) {
    store.commit('app/SET_SITE_CONFIG', config);
  }
}

feathersClient.service(servicePath).on('patched', syncToAppState)

// Set up the client-side Feathers hooks.
feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
})

export default servicePlugin
