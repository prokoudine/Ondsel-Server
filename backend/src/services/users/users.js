// SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'
import swagger from 'feathers-swagger';
import {iff, preventChanges} from 'feathers-hooks-common'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  userDataValidator,
  userPatchValidator,
  userQueryValidator,
  userResolver,
  userExternalResolver,
  userDataResolver,
  userPatchResolver,
  userQueryResolver,
  userSchema,
  userDataSchema,
  userQuerySchema,
  uniqueUserValidator, uniqueUserPatchValidator, userPublicFields
} from './users.schema.js'
import { UserService, getOptions } from './users.class.js'
import { userPath, userMethods } from './users.shared.js'
import { siteConfigId } from '../site-config/site-config.schema.js'
import {addVerification, removeVerification} from "feathers-authentication-management";
import {notifier} from "../auth-management/notifier.js";
import {isAdminUser, isEndUser} from "../../hooks/is-user.js";
import {buildOrganizationSummary} from "../organizations/organizations.distrib.js";
import {OrganizationTypeMap} from "../organizations/organizations.subdocs.schema.js";
import {
  authenticateJwtWhenPrivate,
  handlePublicOnlyQuery,
  resolvePrivateResults
} from "../../hooks/handle-public-info-query.js";
import {copyUserBeforePatch, distributeUserSummariesHook} from "./users.distrib.js";
import {buildNewCurationForUser, specialUserOrgCurationHandler} from "./users.curation.js";
import {changeEmailNotification} from "./commands/changeEmailNotification.js";
import {verifySiteAdministrativePower} from "../hooks/administration.js";
import {removeUser} from "./commands/removeUser.js";
import { handleQueryArgs } from "./helpers.js";

export * from './users.class.js'
export * from './users.schema.js'


// A configure function that registers the service and its hooks via `app.configure`
export const user = (app) => {
  // Register our service on the Feathers application
  app.use(userPath, new UserService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: userMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: swagger.createSwaggerServiceOptions({
      schemas: { userDataSchema, userQuerySchema, userSchema },
      docs: {
        description: 'A User model service',
        idType: 'string',
        securities: ['all'],
        operations: {
          get: {
            "parameters": [
              {
                "description": "ObjectID or username of User to return",
                "in": "path",
                "name": "_id",
                "schema": {
                  "type": "string"
                },
                "required": true,
              },
              {
                "description": "If provided and set to \"true\", then only return public data",
                "in": "query",
                "name": "publicInfo",
                "schema": {
                  "type": "string"
                },
                "required": false,
              },
            ],
          },
          find: {
            "description": "Retrieves a list of users.<ul><li>If publicInfo = true, then multiple users may be located but the information is limited to public info.</li><li>If logged in as a site administrator or an internal query, then everything is returned.</li><li>Otherwise, you must be logged in and will only see your own entry.</li></ul>",
            "parameters": [
              {
                "description": "Number of results to return",
                "in": "query",
                "name": "$limit",
                "schema": {
                  "type": "integer"
                },
                "required": false,
              },
              {
                "description": "Number of results to skip",
                "in": "query",
                "name": "$skip",
                "schema": {
                  "type": "integer"
                },
                "required": false,
              },
              {
                "description": "Query parameters",
                "in": "query",
                "name": "filter",
                "style": "form",
                "explode": true,
                "schema": {
                  "$ref": "#/components/schemas/UserQuery"
                },
                "required": false,
              },
              {
                "description": "If provided and set to \"true\", then only return public data",
                "in": "query",
                "name": "publicInfo",
                "schema": {
                  "type": "string"
                },
                "required": false,
              },
            ],
          },
        },
      }
    })
  })
  app.service(userPath).publish((data, context) => {
    return app.channel(context.result._id.toString())
  })
  // Initialize hooks
  app.service(userPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(userExternalResolver),
        handleQueryArgs(),
        handlePublicOnlyQuery(userPublicFields),
        resolvePrivateResults(userResolver)
      ],
      find: [authenticateJwtWhenPrivate()],
      get: [authenticateJwtWhenPrivate()],
      create: [],
      update: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [
        schemaHooks.validateQuery(userQueryValidator),
        schemaHooks.resolveQuery(userQueryResolver)
      ],
      find: [],
      get: [
        detectUsernameInId
      ],
      create: [
        schemaHooks.validateData(userDataValidator),
        schemaHooks.resolveData(userDataResolver),
        uniqueUserValidator,
        addVerification("auth-management"),
      ],
      patch: [
        copyUserBeforePatch,
        iff(
          isEndUser,
          preventChanges(
            false,
            'tier',
            'nextTier',
            'subscriptionDetail.state',
            'organizations',
            "isVerified",
            "resetExpires",
            "resetShortToken",
            "resetToken",
            "verifyChanges",
            "verifyExpires",
            "verifyShortToken",
            "verifyToken",
          ),
          iff(
            context => context.data.shouldChangeEmailNotification,
            changeEmailNotification
          ),
          specialUserOrgCurationHandler,
          schemaHooks.validateData(userPatchValidator),
          uniqueUserPatchValidator,
        ),
        schemaHooks.resolveData(userPatchResolver),
      ],
      remove: [
        verifySiteAdministrativePower,
        removeUser,
      ]
    },
    after: {
      all: [],
      create: [
        sendVerify(),
        removeVerification(),
        createDefaultOrganization,
        createNotificationsDoc,
        createSampleModels,
      ],
      patch: [
        distributeUserSummariesHook
      ],
    },
    error: {
      all: []
    }
  })
}


const createSampleModels = async (context) => {
  const { app } = context;
  const modelService = app.service('models');
  const fileService = app.service('file');
  const uploadService = app.service('upload');
  const siteConfigService = app.service('site-config');

  try {
    let siteConfig = await siteConfigService.get(siteConfigId);

    const sampleModelFileName = siteConfig.defaultModel.fileName;
    const sampleModelObj = siteConfig.defaultModel.objPath;
    const sampleModelThumbnail = siteConfig.defaultModel.thumbnailPath;
    const attributes = siteConfig.defaultModel.attributes

    const file = await fileService.create({
      custFileName: sampleModelFileName,
      shouldCommitNewVersion: true,
      version: {
        uniqueFileName: sampleModelObj,
      }
    }, { user: context.result, $triggerLambda: false })

    const model  = await modelService.create({
      fileId: file._id.toString(),
      attributes: attributes,
      isObjGenerated: true,
      isThumbnailGenerated: true,
    }, { user: { _id: context.result._id }, skipSystemGeneratedSharedModel: true })

    if (sampleModelThumbnail) {
      const thumbnailFilename = sampleModelThumbnail.split('/').pop();
      await uploadService.copy(sampleModelThumbnail, sampleModelThumbnail.replace(thumbnailFilename, `${model._id.toString()}_thumbnail.PNG`));
    }
    await uploadService.copy(sampleModelObj, `${model._id.toString()}_generated.FCSTD`);

    // Patch to update the model thumbnail url, because the thumbnail file didn't exist when the model was created
    await modelService.patch(model._id, {
      isThumbnailGenerated: !!sampleModelThumbnail,
    })
  } catch (e) {
    console.error(e);
  }

  return context
}

const sendVerify = () => {
  return async (context) => {
    // Temporary disable email verification for creating default admin user
    if (process.env.DISABLE_SEND_VERIFICATION_EMAIL) {
      return context;
    }

    const notifierInst = notifier(context.app);

    const users = Array.isArray(context.result)
      ? context.result
      : [context.result];

    await Promise.all(
      users.map(async user => notifierInst("resendVerifySignup", user))
    )
  };
}

const createDefaultOrganization = async context => {
  const organizationService = context.app.service('organizations');
  const workspaceService = context.app.service('workspaces');
  const organization = await organizationService.create(
    {
      name: 'Personal',
      refName: context.result._id.toString(),
      type: OrganizationTypeMap.personal,
      curation: buildNewCurationForUser(context.result),
    },
    { user: context.result }
  );
  const workspace = await workspaceService.create(
    { name: 'Default', description: 'Your workspace', organizationId: organization._id, refName: 'default' },
    { user: context.result }
  )
  await context.service.patch(
    context.result._id,
    {
      // Note: the earlier organization CREATE automatically populated the `organizations` field of User.
      // for details, visit assignOrganizationIdToUser in file:
      //     backend/src/services/organizations/helpers.js
      defaultWorkspaceId: workspace._id,
      personalOrganization: buildOrganizationSummary(organization),
      currentOrganizationId: organization._id,
    }
  );
  return context;
}

const createNotificationsDoc = async context => {
  const ntfService = context.app.service('notifications');
  const ntfDoc = await ntfService.create(
    {
      userId: context.result._id,
      notificationsReceived: [],
    }
  );
  await context.service.patch(
    context.result._id,
    {
      notificationsId: ntfDoc._id,
    }
  );
  return context;
}


const detectUsernameInId = async context => {
  const id = context.id.toString();
  if (id.length < 24) { // a 24 character id is an OID not a username, so only look at username if shorter
    if (context.params?.user?.username !== context.id) {
      if (!(await isAdminUser(context))) {
        context.publicDataOnly = true;
      }
    }
    let userList = {};
    if (context.publicDataOnly) {
      userList = await context.service.find({
        query: {
          publicInfo: "true",
          username: id,
          $select: userPublicFields,
        }
      });
    } else {
      userList = await context.service.find(
        {query: { username: id } }
      );
    }
    if (userList?.total === 1) {
      context.result = userList.data[0];
    }
  }
  return context;
}