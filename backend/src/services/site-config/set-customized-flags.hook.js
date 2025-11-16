// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export const setCustomizedFlags = async (context) => {
  if (context.method !== 'patch' || !context.id || !context.data) {
    return context
  }

  const data = context.data

  // Get existing record to retrieve current customized flags
  const existingRecord = await context.service.get(context.id)
  if (!existingRecord) {
    return context
  }

  // Copy existing customized flags
  const updatedCustomized = { ...existingRecord.customized }

  // Update flags for any updated field that exists in the customized object
  for (const key in data) {
    if (data[key] !== undefined && key in updatedCustomized) {
      updatedCustomized[key] = true
    }
  }

  // Set the customized flags back to the data
  context.data.customized = updatedCustomized

  return context
}
