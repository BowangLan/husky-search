import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";

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

export const getTopMajors = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get subjects ordered by seatCountRank (lower rank = higher seat count)
    const subjects = await ctx.db.query("myplanSubjects")
      .withIndex("by_seat_count_rank", (q) => q.gte("seatCountRank", 1))
      .order("asc")
      .take(args.limit);


    const seen = new Set<string>();

    // Convert to ProgramInfo format
    const results = subjects.map(subject => {
      // Convert Convex ID to a simple hash number
      const hashId = subject._id.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);

      return {
        id: hashId,
        code: subject.code,
        title: subject.title,
        courseCount: 0, // We'll set this to 0 for now since we're not computing it
        collegeCode: subject.collegeCode,
        collegeTitle: subject.collegeTitle,
        campus: subject.campus,
      };
    }).filter(subject => {
      if (seen.has(subject.code)) {
        return false;
      }
      seen.add(subject.code);
      return true;
    });

    return results;
  }
})

export const updateByCode = mutation({
  args: {
    code: v.string(),
    data: v.object({
      seatCountRank: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const s = await ctx.db.query("myplanSubjects")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    const nonNullFields = Object.fromEntries(Object.entries(args.data).filter(([_, value]) => value !== undefined));
    if (s) {
      await ctx.db.patch(s._id, {
        ...s,
        ...nonNullFields,
      });
    }

    return {
      success: true,
    };
  }
})


export const updateByCodeBatch = mutation({
  args: {
    data: v.array(v.object({
      code: v.string(),
      data: v.object({
        seatCountRank: v.optional(v.number()),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const batchSize = 50;
    for (let i = 0; i < args.data.length; i += batchSize) {
      console.log(`Updating batch ${i / batchSize + 1} of ${Math.ceil(args.data.length / batchSize)}`);
      const batch = args.data.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        await ctx.runMutation(api.myplan1.subjectAreas.updateByCode, {
          code: item.code,
          data: item.data,
        });
        console.log(`Updated ${item.code}`);
      }));
    }

    return {
      success: true,
    };
  }
})

