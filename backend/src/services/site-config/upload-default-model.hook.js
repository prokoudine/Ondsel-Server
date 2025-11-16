// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { BadRequest } from '@feathersjs/errors'
import { randomUUID } from 'crypto'

export const uploadDefaultModel = async (context) => {
  if (context.method !== 'patch' || !context.params?.defaultModelFile) {
    return context
  }

  const modelFile = context.params.defaultModelFile

  const originalName = modelFile?.originalname || ''
  if (!originalName.toLowerCase().endsWith('.fcstd')) {
    throw new BadRequest('Only .FCStd files are allowed')
  }

  // Save uploaded FCStd to upload service at a fixed key
  const defaultModelFilePath = 'default-model.FCStd'
  const defaultModelObjPath = 'default-model_generated.FCSTD'
  const tempUploadId = `${randomUUID()}.FCStd`
  let tempFile = null

  try {
    await context.app.service('upload').create({
      id: tempUploadId,
      uri: `data:${modelFile.mimetype};base64,${modelFile.buffer.toString('base64')}`
    }, { user: context.params?.user })

    tempFile = await context.app.service('file').create({
      custFileName: tempUploadId,
      shouldCommitNewVersion: true,
      version: { uniqueFileName: tempUploadId }
    }, { user: context.params?.user })

    const tempModel = await context.app.service('models').create({
      fileId: tempFile._id.toString(),
      createSystemGeneratedShareLink: false,
      shouldStartObjGeneration: true,
    }, {
      user: context.params?.user,
      skipSystemGeneratedSharedModel: true,
      accessToken: context.params?.authentication?.accessToken || null,
    })

    let attempts = 0
    const maxAttempts = 60
    let isObjGenerationInProgress = true
    let isObjGenerated = false
    let attributes = {}
    while (attempts < maxAttempts && isObjGenerationInProgress && !isObjGenerated) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      const model = await context.app.service('models').get(tempModel._id)
      isObjGenerationInProgress = model.isObjGenerationInProgress
      isObjGenerated = model.isObjGenerated
      attributes = model.attributes || attributes
      attempts++
    }
    if (isObjGenerationInProgress && !isObjGenerated) {
      throw new Error('OBJ generation timeout after 5 minutes')
    } else if (!isObjGenerationInProgress && !isObjGenerated) {
      throw new Error('OBJ generation failed')
    }

    await context.app.service('upload').upsert(tempUploadId, defaultModelFilePath)
    await context.app.service('upload').upsert(`${tempModel._id}_generated.FCSTD`, defaultModelObjPath)

    await context.app.service('site-config').patch(context.id, {
      defaultModel: {
        fileName: originalName,
        filePath: defaultModelFilePath,
        objPath: defaultModelObjPath,
        thumbnailPath: '',
        attributes: attributes,
      }
    })
  } finally {
    // Clean up temporary resources
    if (tempFile?._id) {
      try {
        await context.app.service('file').remove(tempFile._id, { user: context.params?.user })
      } catch (cleanupError) {
        console.error('Failed to remove temporary file:', cleanupError)
      }
    }

    if (tempUploadId) {
      try {
        await context.app.service('upload').remove(tempUploadId)
      } catch (cleanupError) {
        console.error('Failed to remove temporary upload:', cleanupError)
      }
    }
  }

  return context
}

export const uploadDefaultModelThumbnail = async (context) => {
  if (context.method !== 'patch' || !context.params?.defaultModelThumbnailFile) {
    return context
  }

  const thumbnailFile = context.params.defaultModelThumbnailFile

  if (thumbnailFile.mimetype !== 'image/png') {
    throw new BadRequest('Invalid thumbnail file type. Only PNG files are allowed')
  }

  const thumbnailPath = `public/default-model_thumbnail.PNG`

  await context.app.service('upload').create({
    id: thumbnailPath,
    uri: `data:${thumbnailFile.mimetype};base64,${thumbnailFile.buffer.toString('base64')}`
  }, { user: context.params?.user })

  const existingConfig = await context.service.get(context.id)
  if (!existingConfig.defaultModel) {
    throw new BadRequest('Default model must be uploaded before thumbnail')
  }

  context.data.defaultModel = {
    ...existingConfig.defaultModel,
    thumbnailPath
  }

  return context
}