// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, virtual } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators.js'
import {
  PublishedFileTargetType,
  PublishedReleaseCadenceType
} from "./publisher.subdocs.schema.js";
import {refNameHasher} from "../../refNameFunctions.js";

// Main data model schema
export const publisherSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    target: PublishedFileTargetType,
    createdBy: ObjectIdSchema(),
    createdAt: Type.Number(),
    releaseDate: Type.Optional(Type.Number()),
    releaseCadence: PublishedReleaseCadenceType,
    release: Type.Optional(Type.String()),
    filename: Type.String(),
    uploadedUniqueFilename: Type.String(), // ex: "66a8e0f9-0e0b-4712-84d7-455e457a7812"; see 'upload' endpoint
    downloadUrl: Type.Optional(Type.String()),

    deleted: Type.Optional(Type.Boolean),
  },
  { $id: 'Publisher', additionalProperties: false }
)
export const publisherValidator = getValidator(publisherSchema, dataValidator)
export const publisherResolver = resolve({
  downloadUrlResolved: virtual(async (message, context) => {
    if (message.downloadUrl) {
      return message.downloadUrl;
    }
    return context.app.get('frontendUrl') + `/publisher/${message._id}/download/${message.filename}`;
  })
})

export const publisherExternalResolver = resolve({})

// Schema for creating new entries
export const publisherDataSchema = Type.Pick(publisherSchema, [
  'target',
  'releaseCadence',
  'downloadUrl',
  'releaseDate',
], {
  $id: 'PublisherData'
})
export const publisherDataValidator = getValidator(publisherDataSchema, dataValidator)
export const publisherDataResolver = resolve({
  createdBy: async (_value, _message, context) => {
    return context.params.user._id
  },
  createdAt: async () => Date.now(),
  releaseDate: async (_value, _message, _context) => {
    return _value ?? Date.now();
  },
})

// Schema for updating existing entries
export const publisherPatchSchema = Type.Partial(publisherSchema, {
  $id: 'PublisherPatch'
})
export const publisherPatchValidator = getValidator(publisherPatchSchema, dataValidator)
export const publisherPatchResolver = resolve({})

// Schema for allowed query properties
export const publisherQueryProperties = Type.Pick(publisherSchema, ['target', 'releaseCadence', 'deleted'])
export const publisherQuerySchema = Type.Intersect(
  [
    querySyntax(publisherQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export const publisherQueryValidator = getValidator(publisherQuerySchema, queryValidator)
export const publisherQueryResolver = resolve({})
