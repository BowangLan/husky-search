import { v } from "convex/values";
import { query } from "../_generated/server";

export const listShort = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db.query("myplanSubjects")
      .paginate({
        numItems: args.limit ?? 100,
        cursor: args.cursor ?? null,
      })

    return {
      data: data.page.map((item) => ({
        code: item.code,
        title: item.title,
      })),
      continueCursor: data.continueCursor,
      isDone: data.isDone,
    }
  }
})

export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("myplanSubjects").withIndex("by_code", (q) => q.eq("code", args.code)).first();
  }
})