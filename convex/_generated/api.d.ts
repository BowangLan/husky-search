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
import type * as canvas from "../canvas.js";
import type * as cec from "../cec.js";
import type * as cecDetailScrapers from "../cecDetailScrapers.js";
import type * as cecIndexScrapers from "../cecIndexScrapers.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as dawgpath from "../dawgpath.js";
import type * as myplanScrapers from "../myplanScrapers.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  canvas: typeof canvas;
  cec: typeof cec;
  cecDetailScrapers: typeof cecDetailScrapers;
  cecIndexScrapers: typeof cecIndexScrapers;
  constants: typeof constants;
  crons: typeof crons;
  dawgpath: typeof dawgpath;
  myplanScrapers: typeof myplanScrapers;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
