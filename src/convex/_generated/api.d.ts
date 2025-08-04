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
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as communication from "../communication.js";
import type * as dashboard from "../dashboard.js";
import type * as events from "../events.js";
import type * as generators_createAdminUser from "../generators/createAdminUser.js";
import type * as generators_createSampleData from "../generators/createSampleData.js";
import type * as http from "../http.js";
import type * as team from "../team.js";
import type * as users from "../users.js";

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
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  communication: typeof communication;
  dashboard: typeof dashboard;
  events: typeof events;
  "generators/createAdminUser": typeof generators_createAdminUser;
  "generators/createSampleData": typeof generators_createSampleData;
  http: typeof http;
  team: typeof team;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
