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
import type * as auth from "../auth.js";
import type * as canvas from "../canvas.js";
import type * as cec from "../cec.js";
import type * as cecDetailScrapers from "../cecDetailScrapers.js";
import type * as cecIndexScrapers from "../cecIndexScrapers.js";
import type * as constants from "../constants.js";
import type * as coursePlans from "../coursePlans.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as dawgpath from "../dawgpath.js";
import type * as dawgpathScrapers from "../dawgpathScrapers.js";
import type * as embedding from "../embedding.js";
import type * as http from "../http.js";
import type * as kvStore from "../kvStore.js";
import type * as myplan from "../myplan.js";
import type * as myplan1_courses from "../myplan1/courses.js";
import type * as myplan1_subjectAreas from "../myplan1/subjectAreas.js";
import type * as myplanDataPoints from "../myplanDataPoints.js";
import type * as myplanScrapers from "../myplanScrapers.js";
import type * as myplanUtils from "../myplanUtils.js";
import type * as ops_courseEmbeddings from "../ops/courseEmbeddings.js";
import type * as ops_myplan from "../ops/myplan.js";
import type * as users from "../users.js";
import type * as uwMapScrapers from "../uwMapScrapers.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  canvas: typeof canvas;
  cec: typeof cec;
  cecDetailScrapers: typeof cecDetailScrapers;
  cecIndexScrapers: typeof cecIndexScrapers;
  constants: typeof constants;
  coursePlans: typeof coursePlans;
  courses: typeof courses;
  crons: typeof crons;
  dawgpath: typeof dawgpath;
  dawgpathScrapers: typeof dawgpathScrapers;
  embedding: typeof embedding;
  http: typeof http;
  kvStore: typeof kvStore;
  myplan: typeof myplan;
  "myplan1/courses": typeof myplan1_courses;
  "myplan1/subjectAreas": typeof myplan1_subjectAreas;
  myplanDataPoints: typeof myplanDataPoints;
  myplanScrapers: typeof myplanScrapers;
  myplanUtils: typeof myplanUtils;
  "ops/courseEmbeddings": typeof ops_courseEmbeddings;
  "ops/myplan": typeof ops_myplan;
  users: typeof users;
  uwMapScrapers: typeof uwMapScrapers;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
