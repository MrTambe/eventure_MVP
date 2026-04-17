/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as admin_actions from "../admin_actions.js";
import type * as admin_creation from "../admin_creation.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth_emailProvider from "../auth/emailProvider.js";
import type * as auth_magicLink from "../auth/magicLink.js";
import type * as auth_rateLimit from "../auth/rateLimit.js";
import type * as communication from "../communication.js";
import type * as dashboard from "../dashboard.js";
import type * as debug from "../debug.js";
import type * as devTools from "../devTools.js";
import type * as events from "../events.js";
import type * as generators_createAdminUser from "../generators/createAdminUser.js";
import type * as generators_createSampleData from "../generators/createSampleData.js";
import type * as generators_createSampleEvents from "../generators/createSampleEvents.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as privateMessages from "../privateMessages.js";
import type * as registration_emails from "../registration_emails.js";
import type * as team from "../team.js";
import type * as tickets from "../tickets.js";
import type * as user_creation from "../user_creation.js";
import type * as user_creation_internal from "../user_creation_internal.js";
import type * as user_management from "../user_management.js";
import type * as users from "../users.js";
import type * as utils_isAdmin from "../utils/isAdmin.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  admin_actions: typeof admin_actions;
  admin_creation: typeof admin_creation;
  ai: typeof ai;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  "auth/emailProvider": typeof auth_emailProvider;
  "auth/magicLink": typeof auth_magicLink;
  "auth/rateLimit": typeof auth_rateLimit;
  communication: typeof communication;
  dashboard: typeof dashboard;
  debug: typeof debug;
  devTools: typeof devTools;
  events: typeof events;
  "generators/createAdminUser": typeof generators_createAdminUser;
  "generators/createSampleData": typeof generators_createSampleData;
  "generators/createSampleEvents": typeof generators_createSampleEvents;
  http: typeof http;
  migrations: typeof migrations;
  privateMessages: typeof privateMessages;
  registration_emails: typeof registration_emails;
  team: typeof team;
  tickets: typeof tickets;
  user_creation: typeof user_creation;
  user_creation_internal: typeof user_creation_internal;
  user_management: typeof user_management;
  users: typeof users;
  "utils/isAdmin": typeof utils_isAdmin;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
