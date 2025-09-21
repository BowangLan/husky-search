import { mutation } from "./_generated/server";

export const KV_STORE_KEYS = {
  MYPLAN_COURSE_CODES: "myplan_course_codes",
}

export const getKVStoreCourseCodes = mutation({
  args: {},
  handler: async (ctx, args) => {
    const kvStoreCourseCodes = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.MYPLAN_COURSE_CODES)).first();
    return (kvStoreCourseCodes?.value || []) as string[];
  }
})

