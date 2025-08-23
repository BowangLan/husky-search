import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { cecCourseObj } from "./schema";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const PAGE_SIZE = 1000;

export const transformCourseData = (data: any) => {
  const item = data;
  const parts = item.data.h2.replace(/&nbsp;/g, " ").split("   ")
  const h1 = item.data.h1

  const transformTerm = (term: string): string => {
    const seasonMap: { [key: string]: string } = {
      "WI": "1",
      "SP": "2",
      "SU": "3",
      "AU": "4"
    };

    const season = term.slice(0, 2);
    const seasonNum = seasonMap[season];
    const year = parseInt(term.slice(2)) + 2000;

    return `${year}${seasonNum}`;
  };

  let code = "";
  let session = "";
  let firstDigitIndex = -1;

  // Search from end of h1 string
  for (let i = h1.length - 1; i >= 0; i--) {
    // Find first digit from the right
    if (firstDigitIndex === -1 && /\d/.test(h1[i])) {
      firstDigitIndex = i;
      session = h1.slice(i + 1).trim();
    }

    // Find first lowercase letter from the right
    if (/[a-z]/.test(h1[i])) {
      if (firstDigitIndex === -1) {
        code = h1.slice(i + 2);
      } else {
        code = h1.slice(i + 1, firstDigitIndex + 1);
      }
      break;
    }
  }

  return {
    letter: item.letter.toLocaleLowerCase(),
    courseCode: code.trim(),
    sessionCode: session.trim(),
    professor: parts[0].trim(),
    role: parts[1].trim(),
    term: transformTerm(parts[2].trim()),
  }
}

export const getCoursesWithNullData = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cecCourses").withIndex("by_data", q => q.eq("data", null)).collect();
  }
})

export const getTotalPages = query({
  args: {},
  handler: async (ctx) => {
    const allCourses = await ctx.db.query("cecCourses").collect();
    return Math.ceil(allCourses.length / PAGE_SIZE);
  }
})

export const getCourseByUrl = query({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.query("cecCourses").filter(q => q.eq(q.field("url"), args.url)).first();

    if (c) {
      return c;
    }

    return null;
  }
})

export const getCoursesByLetter = query({
  args: {
    letter: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("cecCourses").withIndex("by_letter", q => q.eq("letter", args.letter)).collect();
  }
})

export const createCourses = mutation({
  args: {
    courses: v.array(cecCourseObj),
  },
  handler: async (ctx, args) => {
    const existingCourses = await Promise.all(args.courses.map(async (course) => {
      return await ctx.db.query("cecCourses").withIndex("by_url", q => q.eq("url", course.url)).first();
    }));

    const existingCourseSet = new Set(existingCourses.map(course => course?.url).filter(url => url !== undefined));

    const newCourses = args.courses.filter(course => !existingCourseSet.has(course.url)).map(course => ({
      ...course,
      letter: course.letter.toLocaleLowerCase(),
    }));

    if (newCourses.length > 0) {
      console.log(`Created ${newCourses.length} new courses`);
      return await Promise.all(newCourses.map(course => ctx.db.insert("cecCourses", course)));
    }

    return [];
  }
})

export const updateCourseDataByUrl = mutation({
  args: {
    url: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existingCourse = await ctx.db.query("cecCourses").filter(q => q.eq(q.field("url"), args.url)).first();

    if (!existingCourse) {
      throw new Error("Course not found");
    }

    return await ctx.db.patch(existingCourse._id, { data: args.data });
  }
})

export const updateCourseDataByUrlBatch = mutation({
  args: {
    data: v.array(v.object({
      url: v.string(),
      data: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.data.map(async (item) => {
      const existingCourse = await ctx.db.query("cecCourses").withIndex("by_url", q => q.eq("url", item.url)).first();
      if (!existingCourse) {
        console.log(`Course not found: ${item.url}`);
        return;
      }
      return await ctx.db.patch(existingCourse._id, { data: item.data });
    }));
  }
})


export const cleanBatch = mutation({
  args: {
    data: v.array(v.object({
      id: v.id("cecCourses"),
      letter: v.string(),
      data: v.any(),
    }))
  },
  handler: async (ctx, args) => {
    await Promise.all(args.data.map(async (item) => {
      const parts = item.data.h2.replace(/&nbsp;/g, " ").split("   ")
      const h1 = item.data.h1

      const transformTerm = (term: string): string => {
        const seasonMap: { [key: string]: string } = {
          "WI": "1",
          "SP": "2",
          "SU": "3",
          "AU": "4"
        };

        const season = term.slice(0, 2);
        const seasonNum = seasonMap[season];
        const year = parseInt(term.slice(2)) + 2000;

        return `${year}${seasonNum}`;
      };

      let code = "";
      let session = "";
      let firstDigitIndex = -1;

      // Search from end of h1 string
      for (let i = h1.length - 1; i >= 0; i--) {
        // Find first digit from the right
        if (firstDigitIndex === -1 && /\d/.test(h1[i])) {
          firstDigitIndex = i;
          session = h1.slice(i + 1).trim();
        }

        // Find first lowercase letter from the right
        if (/[a-z]/.test(h1[i])) {
          if (firstDigitIndex === -1) {
            code = h1.slice(i + 2);
          } else {
            code = h1.slice(i + 1, firstDigitIndex + 1);
          }
          break;
        }
      }

      await ctx.db.patch(
        item.id,
        {
          letter: item.letter.toLocaleLowerCase(),
          courseCode: code.trim(),
          sessionCode: session.trim(),
          professor: parts[0].trim(),
          role: parts[1].trim(),
          term: transformTerm(parts[2].trim()),
        }
      );
    }));
  }
});

export const clean = action({
  args: {},
  handler: async (ctx, args) => {
    // loop through all letters
    for (let letter of "abcdefghijklmnopqrstuvwxyz") {
      const courses = await ctx.runQuery(api.cec.getCoursesByLetter, {
        letter,
      });
      console.log(`Found ${courses.length} courses for ${letter}`);

      // batch size 1000
      const batchSize = 100;
      for (let i = 0; i < courses.length; i += batchSize) {
        const batch = courses.slice(i, i + batchSize);
        await ctx.scheduler.runAfter(0, api.cec.cleanBatch, {
          data: batch.map(course => ({
            id: course._id,
            letter: course.letter,
            data: course.data,
          })),
        });
        console.log(`Scheduled batch ${i / batchSize + 1} of ${Math.ceil(courses.length / batchSize)}`);
      }
    }

    return "done";
  }
})

export const letterStats = query({
  args: {
    letter: v.string(),
  },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("cecCourses").withIndex("by_letter", q => q.eq("letter", args.letter)).collect();

    const totalCourses = courses.length;
    const uniqueUrls = new Set(courses.map(course => course.url));
    const uniqueLetters = new Set(courses.map(course => course.letter));
    const nullCourseCount = courses.filter(course => course.data === null).length;
    const dataFillPercentage = (((totalCourses - nullCourseCount) / totalCourses) * 100).toFixed(2) + "%";

    return {
      totalCourses,
      uniqueUrls: uniqueUrls.size,
      uniqueLetters: uniqueLetters.size,
      nullCourseCount,
      dataFillPercentage,
    };
  }
})

export const stats = action({
  args: {},
  handler: async (ctx) => {
    const letterStats = await Promise.all("abcdefghijklmnopqrstuvwxyz".split("").map(async (letter) => {
      return await ctx.runQuery(api.cec.letterStats, {
        letter,
      });
    }));


    const totalCourses = letterStats.reduce((acc, curr) => acc + curr.totalCourses, 0);
    const uniqueUrls = new Set(letterStats.flatMap(stat => stat.uniqueUrls));
    const uniqueLetters = new Set(letterStats.flatMap(stat => stat.uniqueLetters));
    const nullCourseCount = letterStats.reduce((acc, curr) => acc + curr.nullCourseCount, 0);
    const dataFillPercentage = (((totalCourses - nullCourseCount) / totalCourses) * 100).toFixed(2) + "%";

    console.log(`Total courses: ${totalCourses}`);
    console.log(`Unique URLs: ${uniqueUrls.size}`);
    console.log(`Unique letters: ${uniqueLetters.size}`);
    console.log(`Null course count: ${nullCourseCount}`);
    console.log(`Data fill percentage: ${dataFillPercentage}`);

    // return letterStats;
    // return {
    //   totalCourses,
    //   uniqueUrls: uniqueUrls.size,
    //   uniqueLetters: uniqueLetters.size,
    //   nullCourseCount,
    //   dataFillPercentage,
    // };
  }
})
