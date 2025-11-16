// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { BadRequest } from '@feathersjs/errors'

export const uploadBrandingLogo = async (context) => {
  if (context.method !== 'patch' || (!context.params?.logoFile && !context.params?.faviconFile)) {
    return context
  }

  const logoFile = context.params?.logoFile
  const faviconFile = context.params?.faviconFile

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  if (logoFile && !allowedTypes.includes(logoFile.mimetype)) {
    throw new BadRequest('Invalid logo file type. Only PNG, JPG, SVG, and ICO are allowed')
  }
  if (faviconFile && !allowedTypes.includes(faviconFile.mimetype)) {
    throw new BadRequest('Invalid favicon file type. Only PNG, JPG, SVG, and ICO are allowed')
  }

  if (logoFile) {
    const logoExtension = logoFile.originalname.split('.').pop().toLowerCase()
    const brandingLogoKey = `public/branding/logo.${logoExtension}`

    await context.app.service('upload').create({
      id: brandingLogoKey,
      uri: `data:${logoFile.mimetype};base64,${logoFile.buffer.toString('base64')}`
    }, { user: context.params?.user })

    const brandingLogoUrl = await context.app.service('upload').get(brandingLogoKey)
    context.data.logoUrl = `${brandingLogoUrl.url}?updatedAt=${Date.now()}`
  }

  if (faviconFile) {
    const faviconExtension = faviconFile.originalname.split('.').pop().toLowerCase()
    const brandingFaviconKey = `public/branding/favicon.${faviconExtension}`

    await context.app.service('upload').create({
      id: brandingFaviconKey,
      uri: `data:${faviconFile.mimetype};base64,${faviconFile.buffer.toString('base64')}`
    }, { user: context.params?.user })

    const brandingFaviconUrl = await context.app.service('upload').get(brandingFaviconKey)
    context.data.faviconUrl = `${brandingFaviconUrl.url}?updatedAt=${Date.now()}`
  }

  return context
}
