import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const KV_STORE_KEYS = {
  MYPLAN_COURSE_CODES: "myplan_course_codes",
  CURRENT_TERMS: "current_terms",
  MYPLAN_COOKIE: "myplan_cookie",
  MYPLAN_CSRF_TOKEN: "myplan_token",
  DAWGPATH_COOKIE: "dawgpath_cookie",
} as const;

export const getMyplanCookie = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const kvStoreCookie = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.MYPLAN_COOKIE)).first();
    return (kvStoreCookie?.value ?? "") as string;
  }
})

export const getMyplanCsrfToken = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const kvStoreCsrfToken = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.MYPLAN_CSRF_TOKEN)).first();
    return (kvStoreCsrfToken?.value ?? "") as string;
  }
})

export const getKVStoreCourseCodes = mutation({
  args: {},
  handler: async (ctx, args) => {
    const kvStoreCourseCodes = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.MYPLAN_COURSE_CODES)).first();
    return (kvStoreCourseCodes?.value || []) as string[];
  }
})


export const getCurrentTerms = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const kvStoreCurrentTerms = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.CURRENT_TERMS)).first();
    return (kvStoreCurrentTerms?.value || []) as string[];
  }
})

export const getDawgpathCookie = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const kvStoreCookie = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.DAWGPATH_COOKIE)).first();
    return (kvStoreCookie?.value ?? "") as string;
  }
})
