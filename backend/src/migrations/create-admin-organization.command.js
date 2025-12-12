// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import mongodb from 'mongodb';
import _ from 'lodash';
import { OrganizationTypeMap } from '../services/organizations/organizations.subdocs.schema.js';

const userEmail = 'admin@local.test';
const userCfg = 'fecd69a2-f30f-44f1-8c23-863998b3f9ac.cfg';
const systemCfg = '35518e54-4743-46bd-a147-a92ea4ecfe76.cfg';
const otherOrgAdmins = [
  'pieter@local.test',
  'johnd@local.test',
]

export async function createAdminOrganizationCommand(app) {
  const organizationService = app.service('organizations');
  const userService = app.service('users');
  const preferenceService = app.service('preferences');
  const orgDb = await organizationService.options.Model;
  const prefDb = await preferenceService.options.Model;

  // Fetch user
  console.log(`>>> Fetching user ${userEmail}`);
  const users = await userService.find({query: {email: userEmail}})
  if (users.total) {
    const owner = users.data[0];
    console.log('>>> User found');
    const organizations = await organizationService.find({ query: { refName: 'AdminOrganization' } })
    let adminOrganization;
    if (organizations.total === 0) {
      console.log('>>> Creating Admin Organization');
      // Create admin organization
      adminOrganization = await organizationService.create({
        name: 'Admin Organization',
        refName: 'AdminOrganization',
        type: OrganizationTypeMap.admin,
      }, { user: owner });
      console.log('>>> Admin Organization created: ', adminOrganization);
    } else {
      console.log('>>> Admin Organization found, no need to create');
      adminOrganization = organizations.data[0];
    }

    for (let userEmail of otherOrgAdmins) {
      try {
        const users = await userService.find({ query: { email: userEmail } })
        console.log(users);
        if (users.total) {
          const user = users.data[0];
          console.log(`>>> User found: ${userEmail}`);
          await organizationService.patch(
            adminOrganization._id,
            {
              shouldAddUsersToOrganization: true,
              userIds: [user._id.toString()],
            },
            {
              user: owner
            }
          );
          await organizationService.patch(
            adminOrganization._id,
            {
              shouldGiveAdminAccessToUsersOfOrganization: true,
              userIds: [user._id.toString()],
            },
            {
              user: owner
            }
          );
          console.log(`>>> Successfully make ${userEmail} user admin`);
        } else {
          console.log(`User ${userEmail} not found`);
        }
      } catch (e) {
        console.log(`Error encountered to add or make admin ${userEmail} user`);
      }
    }

    if (!adminOrganization.preferencesId) {
      console.log('>>> creating a preference object');
      const pref = await preferenceService.create({
        organizationId: adminOrganization._id.toString(),
        version: {
          files: [
            {
              fileName: 'user.cfg',
              uniqueFileName: userCfg,
              additionalData: {},
              additionalKeysToSave: []
            },
            {
              fileName: 'system.cfg',
              uniqueFileName: systemCfg,
              additionalData: {},
              additionalKeysToSave: []
            }
          ]
        }
      }, { user: owner });

      const newPref = await prefDb.insertOne({
        ..._.omit(pref, 'currentVersion'),
        _id: new mongodb.ObjectId('000000000000000000000000')
      });

      console.log('>>> Created Preference object', newPref);

      await prefDb.deleteOne(
        { _id: pref._id } // Original ObjectID
      )
      const updateOrg = await orgDb.updateOne(
        { _id: adminOrganization._id }, // Specify the current ObjectID
        { $set: { preferencesId: new mongodb.ObjectId('000000000000000000000000') } } // Set the new ObjectID
      )

    } else {
      console.log('>>> Preference object already exists');
    }
  }
}
