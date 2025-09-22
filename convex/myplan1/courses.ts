import { v } from "convex/values"
import { mutation, query } from "../_generated/server"

export const listShort = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db.query("myplanCourses")
      .paginate({
        numItems: args.limit ?? 100,
        cursor: args.cursor ?? null,
      })

    return {
      data: data.page.map((item) => ({
        _id: item._id,
        courseCode: item.courseCode,
      })),
      continueCursor: data.continueCursor,
      isDone: data.isDone,
    }
  }
})

// used by check_course_code_duplicates.py
// export const deleteByIds = mutation({
//   args: {
//     ids: v.array(v.id("myplanCourses")),
//   },
//   handler: async (ctx, args) => {
//     await Promise.all(args.ids.map(async (id) => {
//       await ctx.db.delete(id);
//     }));

//     return {
//       success: true,
//     };
//   }
// })