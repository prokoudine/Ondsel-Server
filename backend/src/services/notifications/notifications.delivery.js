// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {OrganizationTypeMap} from "../organizations/organizations.subdocs.schema.js";
import _ from "lodash";
import {NotificationCadenceTypeMap} from "../users/users.subdocs.schema.js";
import {
  notificationMessageMap,
  specificDeliveryMethodMap,
  specificDeliveryMethodType
} from "./notifications.subdocs.js";
import {Type} from "@feathersjs/typebox";
import {navTargetMap} from "../../curation.schema.js";
import {strEqual} from "../../helpers.js";
import { siteConfigId } from "../site-config/site-config.schema.js";

export async function translateCollection(collection, context) {
  let tr = '';
  switch (collection) {
    case navTargetMap.workspaces:
      tr = 'a workspace';
      break;
    case navTargetMap.organizations:
      tr = 'an organization';
      break;
    case navTargetMap.users:
      tr = 'a individual user';
      break;
    case navTargetMap.sharedModels:
      tr = 'a specific CAD model';
      break;
    case navTargetMap.models:
      tr = 'a CAD model';
      break;
    case navTargetMap.lens:
      const siteConfig = await context.app.service('site-config').get(siteConfigId);
      tr = siteConfig.siteTitle;
      break;
  }
  return tr;
}

export async function generateGenericBodySummaryTxt(ntf, context) {
  let txt = "";
  txt += `User "${ntf.createdBy.name}" `;
  if (ntf.from.type !== OrganizationTypeMap.personal) {
    txt += `on behalf of "${ntf.from.name}" `
  }
  switch (ntf.message){
    case notificationMessageMap.itemShared:
      // later; add support for the other types of things to share.
      txt += 'has shared ';
      txt += (await translateCollection(ntf.nav?.target, context)) + ' ';
      if (ntf.parameters?.name) {
        txt += `named "${ntf.parameters.name}" `;
      }
      txt += '.';
      break;
    default:
      txt += ' has notified you about something.';
      break;
  }
  return txt;
}

export async function performExternalNotificationDelivery(targetUserId, ntf, context) {
  let details = [];

  const userService = context.app.service('users');
  const user = await userService.get(targetUserId);
  const orgId = user.personalOrganization._id;
  const settings = user.organizations.find((userOrg) => strEqual(userOrg._id, orgId));
  // we only do email right now
  const emailCadence = settings.notificationByEmailCadence || NotificationCadenceTypeMap.live;
  if (emailCadence) {
    const result = await deliverViaMailchimpSMTP(user, ntf, context);
    details.push(result);
  }
  return {
    details: details,
  }
}

async function deliverViaMailchimpSMTP(user, ntf, context) {
  const emailService = context.app.service('email');
  const siteConfig = await context.app.service('site-config').get(siteConfigId);
  let body = ntf.bodySummaryTxt + '\n';
  if (ntf.parameters?.message) {
    body += `\nMessage:\n\n${ntf.parameters.message}\n\n`;
  }
  if (ntf.parameters?.link) {
    body += `\nVisit: ${ntf.parameters.link}\n`;
  }
  let msgDetail = {
    from: context.app.get('smtpFrom'),
    to: user.email,
    subject: `[${siteConfig.siteTitle}] notification`,
    text: body,
  };
  const result = await emailService.create(msgDetail);
  const response = {
    method: specificDeliveryMethodMap.mailchimpSMTP,
    result: JSON.stringify(result),
    success: result?.accepted?.length === 1,
  }
 return response;
}
