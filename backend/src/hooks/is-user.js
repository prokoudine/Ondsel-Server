// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isSiteAdministrator } from "../services/hooks/administration.js";

export const isEndUser = async (context) => {
  const provider = context.params.provider; // Internal calls are "undefined"
  if (provider === undefined) {
    return false;
  }
  if (await isAdminUser(context)) {
    return false;
  } else {
    return true;
  }
}

export const isAdminUser = async (context) => {
  const [isAdmin] = await isSiteAdministrator(context.params, context.app);
  return isAdmin;
}

