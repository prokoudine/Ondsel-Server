// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {StringEnum, Type} from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'

// Main data model schema
export const OrganizationTypeMap = {
  personal: 'Personal',
  open: 'Open',
  private: 'Private',
  admin: 'Admin',
}

export const OrganizationType = StringEnum([
  OrganizationTypeMap.personal,
  OrganizationTypeMap.open,
  OrganizationTypeMap.private,
  OrganizationTypeMap.admin,
])

export const organizationSummarySchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    refName: Type.String(),
    type: Type.Optional(OrganizationType),
  },
)

