// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// services/auth-management/notifier.js

import {authManagementActionTypeMap, resetPwdGENERIC, verifySignupGENERIC} from "./auth-management.schema.js";
import {BadRequest} from "@feathersjs/errors";
import {orgInviteStateTypeMap} from "../org-invites/org-invites.subdocs.schema.js";
import { siteConfigId } from "../site-config/site-config.schema.js";

export const notifier = (app) => {
  function getLink(type, hash, uid, baseUrl) {
    return baseUrl + '/' + type + '/' + hash + '/' + uid;
  }

  async function sendEmail(email) {
    try {
      const result = await app.service("email").create(email);
      return result;
    } catch (err) {
      console.error(err);
    }
  }

  function buildSocialLinksText(siteConfig) {
    if (!siteConfig.socialLinks) {
      return '';
    }

    const links = [];
    for (const link of Object.values(siteConfig.socialLinks)) {
      if (link.label && link.url) {
        links.push(`${link.label}: ${link.url}`);
      }
    }

    if (links.length === 0) {
      return '';
    }

    return 'Connect with us:\n' + links.join('\n') + '\n\n';
  }

  // The "type"s used below:
  // "resendVerifySignup" - used to send a verification email.
  // "verifySignupLong" - used to confirm verification and set user.isVerified=true; which sends an email also
  // "verifySignupShort" - (NOT ACTIVE YET) used to confirm verification and set user.isVerified=true; which sends a txt message also
  // "sendResetPwd" - used to send a password-change email
  // "resetPwdLong" - used to change the password using the resetToken
  // "identityChange" - used to change the user's email address
  //
  // see https://feathers-a-m.netlify.app/service-calls.html for more detail

  return async (type, user, notifierOptions = {}) => {
    const baseUrl = app.get('frontendUrl');
    const siteConfig = await app.service('site-config').get(siteConfigId);
    const invite = user; // an alias for some contexts; see 'org-invites.class.js' for detail
    switch (type) {
      case authManagementActionTypeMap.resendVerifySignup:
        return sendEmail({
          from: app.get('smtpFrom'),
          to: user.email,
          subject: `Let's confirm your ${siteConfig.siteTitle} account`,
          text: `To verify your newly registered account with ${siteConfig.siteTitle}, please click here: `
            + getLink('verify-email', user.verifyToken, user._id, baseUrl)
            + `\n\nYours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`,
        });
      case authManagementActionTypeMap.verifySignupLong:
      case verifySignupGENERIC:
        const socialLinksText = buildSocialLinksText(siteConfig);
        return sendEmail({
          from: app.get('smtpFrom'),
          to: user.email,
          subject: `Welcome to ${siteConfig.siteTitle}!`,
          text: `Verification of ${user.email} is complete. Welcome to ${siteConfig.siteTitle}!\n\n`
            + socialLinksText
            + `Yours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`,
        });
      case authManagementActionTypeMap.sendResetPwd:
        return sendEmail({
          from: app.get('smtpFrom'),
          to: user.email,
          subject: `[${siteConfig.siteTitle}] Reset password for your ${siteConfig.siteTitle} account.`,
          text: `To reset your ${user.username} password, please click here: `
            + getLink('change-password', user.resetToken, user._id, baseUrl)
            + `\n\nYours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`
        });
      case authManagementActionTypeMap.resetPwdLong:
      case resetPwdGENERIC:
        return sendEmail({
          from: app.get('smtpFrom'),
          to: user.email,
          subject: `Your ${siteConfig.siteTitle} password has been changed`,
          text: `Your password for ${user.username} at ${siteConfig.siteTitle} has been successfully changed.\n\n`
            + `Yours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`,
        });
      case orgInviteStateTypeMap.sendOrgInviteEmail:
        return sendEmail({
          from: app.get('smtpFrom'),
          to: invite.email,
          subject: `You have been invited to "${invite.organization.name}"`,
          text: `You have been invited to join an organization titled "${invite.organization.name}".\n`
            + `Please click the following link to accept: `
            + getLink('join-org', invite.inviteToken, invite.inviteId, baseUrl)
            + `\n\nYours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`,
        });
      case orgInviteStateTypeMap.verifyOrgInviteEmail:
        return sendEmail({
          from: app.get('smtpFrom'),
          to: invite.email, // NOTE: this email is the User's email; NOT the invite's original email (if different)
          subject: `You have been accepted to "${invite.organization.name}"`,
          text: `You are now a member of the "${invite.organization.name}" organization.\n\n`
            + `Yours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`,
        });
      case authManagementActionTypeMap.identityChange:
        // added by auth-library:
        // "verifyChanges": {
        //   "email": "johnd+111@local.test"
        // },
        return sendEmail({
          from: app.get('smtpFrom'),
          to: user.verifyChanges.email,
          subject: `Please confirm your email change`,
          text: `To verify your newly registered email address with ${siteConfig.siteTitle}, please click here: `
            + getLink('verify-email', user.verifyToken, user._id, baseUrl)
            + `\n\nYours sincerely,\n`
            + `Team ${siteConfig.siteTitle}`,
        });
      default:
        throw new BadRequest(`unhandled auth-management type ${type}`);
    }
  };
};
