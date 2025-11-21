// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { OrganizationTypeMap } from '../services/organizations/organizations.subdocs.schema.js';

export async function addDefaultAdminUserCommand(app) {
  const userService = app.service('users');
  const organizationService = app.service('organizations');

  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@local.test';
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@local.test';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin';

  // Check/create admin user
  console.log(">>> checking for admin user");
  const adminExists = await userService.find({
    query: { email: adminEmail },
    paginate: false
  });

  let user;
  const originalDisableSendVerificationEmail = process.env.DISABLE_SEND_VERIFICATION_EMAIL;
  process.env.DISABLE_SEND_VERIFICATION_EMAIL = true;
  if (adminExists.length) {
    console.log(`>>> admin user ${adminEmail} already exists, using existing user`);
    user = adminExists[0];
  } else {
    console.log(">>> creating default admin user");
    user = await userService.create({
      email: adminEmail,
      username: adminUsername,
      password: adminPassword,
      name: adminName,
      usageType: 'both',
    });
    await userService.patch(user._id, {
      isVerified: true,
      tier: 'Enterprise',
    });
    console.log(">>> new admin user created");
  }
  process.env.DISABLE_SEND_VERIFICATION_EMAIL = originalDisableSendVerificationEmail;

  // Check/create Admin organization and add admin user to it
  console.log(">>> setting up Admin organization for admin user");
  const organizations = await organizationService.find({ query: { refName: 'AdminOrganization' } });
  let adminOrganization;

  if (organizations.total === 0) {
    console.log(">>> Creating Admin Organization");
    adminOrganization = await organizationService.create({
      name: 'Admin Organization',
      refName: 'AdminOrganization',
      type: OrganizationTypeMap.ondsel,
    }, { user: user });
    console.log(">>> Admin Organization created");
  } else {
    console.log(">>> Admin Organization found");
    adminOrganization = organizations.data[0];
  }

  // Check if user is already in Admin organization
  const isUserInAdminOrg = adminOrganization.users &&
    adminOrganization.users.some(orgUser => orgUser._id.toString() === user._id.toString());

  if (!isUserInAdminOrg) {
    // Add user to Admin organization
    console.log(">>> Adding admin user to Admin organization");
    await organizationService.patch(
      adminOrganization._id,
      {
        shouldAddUsersToOrganization: true,
        userIds: [user._id.toString()],
      },
      {
        user: user
      }
    );
  } else {
    console.log(">>> User already in Admin organization");
  }

  // Check if user already has admin access
  const userInOrg = adminOrganization.users &&
    adminOrganization.users.find(orgUser => orgUser._id.toString() === user._id.toString());

  if (!userInOrg || !userInOrg.isAdmin) {
    // Grant admin access to the user
    console.log(">>> Granting admin access to user in Admin organization");
    await organizationService.patch(
      adminOrganization._id,
      {
        shouldGiveAdminAccessToUsersOfOrganization: true,
        userIds: [user._id.toString()],
      },
      {
        user: user
      }
    );
  } else {
    console.log(">>> User already has admin access in Admin organization");
  }

  console.log(">>> admin user setup completed");
}
