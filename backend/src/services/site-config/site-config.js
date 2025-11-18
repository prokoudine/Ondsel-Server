// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { disallow } from 'feathers-hooks-common'
import {
  siteConfigPatchResolver,
  siteConfigPatchValidator,
  siteConfigQueryResolver,
  siteConfigQueryValidator,
  siteConfigResolver,
  siteConfigExternalResolver
} from './site-config.schema.js'
import { SiteConfigService, getOptions } from './site-config.class.js'
import { siteConfigPath, siteConfigMethods } from './site-config.shared.js'
import { siteConfigId } from './site-config.schema.js'
import { verifyOndselAdministrativePower } from '../hooks/administration.js'
import { setCustomizedFlags } from './set-customized-flags.hook.js'
import { uploadBrandingLogo } from './upload-branding.hook.js'
import { uploadDefaultModel, uploadDefaultModelThumbnail } from './upload-default-model.hook.js'
import multer from 'multer'

export * from './site-config.class.js'
export * from './site-config.schema.js'

// A configure function that registers the service and its hooks via `app.configure`
export const siteConfig = (app) => {
  // Register our service on the Feathers application with multipart support for branding logos and default model
  const fieldsMulter = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'faviconFile', maxCount: 1 },
    { name: 'defaultModelFile', maxCount: 1 },
    { name: 'defaultModelThumbnailFile', maxCount: 1 },
  ])

  app.use(siteConfigPath,
    // Parse multipart form with fields multer and validate each file
    (req, res, next) => {
      fieldsMulter(req, res, (err) => {
        if (err) {
          return next(err)
        }

        const files = req.files || {}

        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']

        // Validate logo file if present
        if (files.logoFile && files.logoFile[0]) {
          const logoFile = files.logoFile[0]
          if (!allowedTypes.includes(logoFile.mimetype)) {
            return next(new Error('Only PNG, JPG, SVG, and ICO files are allowed for logo'))
          }
          req.feathers.logoFile = logoFile
        }

        // Validate favicon file if present
        if (files.faviconFile && files.faviconFile[0]) {
          const faviconFile = files.faviconFile[0]
          if (!allowedTypes.includes(faviconFile.mimetype)) {
            return next(new Error('Only PNG, JPG, SVG, and ICO files are allowed for favicon'))
          }
          req.feathers.faviconFile = faviconFile
        }

        // Validate default model file if present
        if (files.defaultModelFile && files.defaultModelFile[0]) {
          const defaultModelFile = files.defaultModelFile[0]
          const extension = defaultModelFile.originalname.split('.').pop().toLowerCase()
          if (extension !== 'fcstd') {
            return next(new Error('Only .FCStd files are allowed for default model'))
          }
          req.feathers.defaultModelFile = defaultModelFile
        }

        // Validate default model thumbnail file if present
        if (files.defaultModelThumbnailFile && files.defaultModelThumbnailFile[0]) {
          const defaultModelThumbnailFile = files.defaultModelThumbnailFile[0]
          if (defaultModelThumbnailFile.mimetype !== 'image/png') {
            return next(new Error('Only PNG files are allowed for default model thumbnail'))
          }
          req.feathers.defaultModelThumbnailFile = defaultModelThumbnailFile
        }

        next()
      })
    },
    new SiteConfigService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: siteConfigMethods,
      // You can add additional custom events to be sent to clients here
      events: []
    })

  // Add publish configuration for real-time updates
  app.service(siteConfigPath).publish('patched', (data, context) => {
    // Broadcast site config updates to all users (public and authenticated)
    return [
      app.channel('anonymous'),
      app.channel('authenticated')
    ];
  });

  // Initialize hooks
  app.service(siteConfigPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(siteConfigExternalResolver),
        schemaHooks.resolveResult(siteConfigResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(siteConfigQueryValidator),
        schemaHooks.resolveQuery(siteConfigQueryResolver)
      ],
      get: [
        // Allow public access to default site config
        async (context) => {
          if (context.id === siteConfigId) {
            return context; // Skip authentication
          }
          // Require authentication for other configs
          return authenticate('jwt')(context);
        },
        // Only verify admin power for non-default configs
        async (context) => {
          if (context.id !== siteConfigId) {
            return verifyOndselAdministrativePower(context);
          }
          return context;
        }
      ],
      patch: [
        authenticate('jwt'),
        verifyOndselAdministrativePower,
        uploadBrandingLogo,
        uploadDefaultModel,
        uploadDefaultModelThumbnail,
        setCustomizedFlags,
        schemaHooks.validateData(siteConfigPatchValidator),
        schemaHooks.resolveData(siteConfigPatchResolver)
      ],
      // Disallow methods we don't support
      find: [disallow()],
      create: [disallow()],
      update: [disallow()],
      remove: [disallow()]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  // Proxy FreeCAD blog feed endpoint
  app.get('/freecad-blog-rss', async (req, res) => {
    try {
      const response = await fetch('https://blog.freecad.org/feed/');
      if (!response.ok) {
        return res.status(response.status).json({ error: `Upstream error ${response.status}` });
      }

      const text = await response.text();

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(text);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch FreeCAD feed', details: error.message });
    }
  });
}
