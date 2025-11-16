// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export const siteConfigPath = 'site-config'

export const siteConfigMethods = ['get', 'patch']

export const siteConfigClient = (client) => {
  const connection = client.get('connection')

  client.use(siteConfigPath, connection.service(siteConfigPath), {
    methods: siteConfigMethods
  })
}
