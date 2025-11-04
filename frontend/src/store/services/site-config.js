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
      customized: {
        logoUrl: false,
        faviconUrl: false,
        siteTitle: false,
        copyrightText: false
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
