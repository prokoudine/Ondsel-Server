// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export async function migrateOndselToAdminOrganizationCommand(app) {
  const organizationService = app.service('organizations');
  const userService = app.service('users');
  const orgDb = await organizationService.options.Model;
  const userDb = await userService.options.Model;

  console.log('>>> Finding organizations with type "Ondsel"');
  const organizations = await organizationService.find({
    paginate: false,
    pipeline: [{ $match: { type: 'Ondsel' } }]
  });

  console.log(`>>> Found ${organizations.length} Ondsel organization(s)`);

  for (let organization of organizations) {
    console.log(`>>> Migrating organization ${organization._id.toString()} (${organization.name})`);

    const updateFields = {
      type: 'Admin'
    };

    if (organization.name === 'Ondsel') {
      updateFields.name = 'Admin Organization';
    }

    if (organization.refName === 'Ondsel') {
      updateFields.refName = 'AdminOrganization';
    }

    try {
      await orgDb.updateOne(
        { _id: organization._id },
        { $set: updateFields }
      );
      console.log(`>>> Successfully migrated organization ${organization._id.toString()}`);

      // Update users who have this organization in their organizations array
      // Use the organization's users list to find which users need updating
      console.log(`  >>> Finding users with this organization`);
      const orgUsers = organization.users || [];
      console.log(`  >>> Found ${orgUsers.length} user(s) in organization`);

      for (let orgUser of orgUsers) {
        try {
          const user = await userService.get(orgUser._id);
          const orgIndex = user.organizations.findIndex(
            org => org._id.toString() === organization._id.toString()
          );
          if (orgIndex !== -1) {
            const updatedOrgs = [...user.organizations];
            if (updateFields.name) {
              updatedOrgs[orgIndex].name = updateFields.name;
            }
            if (updateFields.refName) {
              updatedOrgs[orgIndex].refName = updateFields.refName;
            }
            updatedOrgs[orgIndex].type = updateFields.type;

            await userDb.updateOne(
              { _id: user._id },
              { $set: { organizations: updatedOrgs } }
            );
            console.log(`  >>> Updated organization summary for user ${user._id.toString()}`);
          }
        } catch (e) {
          console.log(`  >>> Error updating user ${orgUser._id.toString()}`);
          console.log(e);
          continue;
        }
      }
    } catch (e) {
      console.log(`>>> Error migrating organization ${organization._id.toString()}`);
      console.log(e);
      continue;
    }
  }

  console.log('>>> Migration of Ondsel organizations to Admin organizations completed');
}

