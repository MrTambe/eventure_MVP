/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as admin_actions from "../admin_actions.js";
import type * as admin_creation from "../admin_creation.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as communication from "../communication.js";
import type * as dashboard from "../dashboard.js";
import type * as debug from "../debug.js";
import type * as events from "../events.js";
import type * as generators_createAdminUser from "../generators/createAdminUser.js";
import type * as generators_createSampleData from "../generators/createSampleData.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as privateMessages from "../privateMessages.js";
import type * as team from "../team.js";
import type * as user_creation from "../user_creation.js";
import type * as user_management from "../user_management.js";
import type * as users from "../users.js";
import type * as utils_isAdmin from "../utils/isAdmin.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  admin_actions: typeof admin_actions;
  admin_creation: typeof admin_creation;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  communication: typeof communication;
  dashboard: typeof dashboard;
  debug: typeof debug;
  events: typeof events;
  "generators/createAdminUser": typeof generators_createAdminUser;
  "generators/createSampleData": typeof generators_createSampleData;
  http: typeof http;
  migrations: typeof migrations;
  privateMessages: typeof privateMessages;
  team: typeof team;
  user_creation: typeof user_creation;
  user_management: typeof user_management;
  users: typeof users;
  "utils/isAdmin": typeof utils_isAdmin;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
