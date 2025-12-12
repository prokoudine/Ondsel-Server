// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// add initial TOS and PP documents

import {ObjectId} from "mongodb";
import {agreementCategoryTypeMap} from "../services/agreements/agreements.subdocs.js";

function formatDateVersion(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function addInitialTosPp(app) {

  const agreementsService = app.service('agreements');
  const effectiveDate = new Date();
  const effectiveTimestamp = effectiveDate.getTime();

  console.log(">>> TOS");
  const tosCheck = await agreementsService.find({
    query: {
      category: agreementCategoryTypeMap.termsOfService,
    }
  });
  if (tosCheck.data.length === 0) {
    const tosId = new ObjectId();
    const tosSummary = {
      agreementDocId: tosId,
      title: 'Terms Of Use',
      effective: effectiveTimestamp,
      deprecated: null,
      version: formatDateVersion(effectiveDate),
      markdownContent: tosText,
      docPostedAt: Date.now(),
    }
    const tosResult = await agreementsService.create({
      category: agreementCategoryTypeMap.termsOfService,
      current: tosSummary,
      history: [tosSummary],
    });
    console.log(">>>   added doc");
  } else {
    console.log(">>>   skipped as doc already exists");
  }

  console.log(">>> PP");
  const ppCheck = await agreementsService.find({
    query: {
      category: agreementCategoryTypeMap.privacyPolicy,
    }
  });
  if (ppCheck.data.length === 0) {
    const ppId = new ObjectId();
    const ppSummary = {
      agreementDocId: ppId,
      title: 'Privacy Policy',
      effective: effectiveTimestamp,
      deprecated: null,
      version: formatDateVersion(effectiveDate),
      markdownContent: ppText,
      docPostedAt: Date.now(),
    }
    const ppResult = await agreementsService.create({
      category: agreementCategoryTypeMap.privacyPolicy,
      current: ppSummary,
      history: [ppSummary],
    });
    console.log(">>>   added doc");
  } else {
    console.log(">>>   skipped as doc already exists");
  }
}

const tosText = `# Terms of Use

TBD
`;

const ppText = `# Privacy Policy

TBD
`