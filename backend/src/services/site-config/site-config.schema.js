// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators.js'
import { userSummarySchema } from '../users/users.subdocs.schema.js';

// Fixed ID for the single site config document
export const siteConfigId = '000000000000000000000000';

// Main data model schema
export const siteConfigSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    logoUrl: Type.String(),
    faviconUrl: Type.String(),
    customized: Type.Object({
      logoUrl: Type.Boolean(),
      faviconUrl: Type.Boolean(),
    }),
    updatedAt: Type.Number(),
    updatedBy: Type.Optional(userSummarySchema)
  },
  { $id: 'SiteConfig', additionalProperties: false }
)
export const siteConfigValidator = getValidator(siteConfigSchema, dataValidator)
export const siteConfigResolver = resolve({})

export const siteConfigExternalResolver = resolve({})

// Schema for updating existing entries
export const siteConfigPatchSchema = Type.Partial(siteConfigSchema, {
  $id: 'SiteConfigPatch'
})
export const siteConfigPatchValidator = getValidator(siteConfigPatchSchema, dataValidator)
export const siteConfigPatchResolver = resolve({
  updatedAt: async () => Date.now(),
  updatedBy: async (_value, _message, context) => {
    if (context.params.user) {
      return {
        _id: context.params.user._id,
        name: context.params.user.name,
        refName: context.params.user.refName
      }
    }
    return _value
  }
})

// Schema for allowed query properties
export const siteConfigQueryProperties = Type.Pick(siteConfigSchema, ['_id'])
export const siteConfigQuerySchema = Type.Intersect(
  [
    querySyntax(siteConfigQueryProperties),
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export const siteConfigQueryValidator = getValidator(siteConfigQuerySchema, queryValidator)
export const siteConfigQueryResolver = resolve({})
