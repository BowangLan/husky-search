"use node";

import { internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";
import OpenAI from "openai";

export const runGenerateCourseEmbeddings = internalAction({
  args: {},
  handler: async (ctx, args) => {
    let page = 1;
    let count = 0;

    console.log(`Fetching all course codes`);
    let courseQuery = await ctx.runQuery(api.myplan.listFullCourses, {
      limit: 10,
    });


    console.log(`[1] Generating embeddings for ${courseQuery.page.length} courses`);
    await ctx.scheduler.runAfter(0, internal.ops.courseEmbeddings.generateCourseEmbeddings, {
      data: courseQuery.page.map((course) => ({
        _id: course._id,
        text: `${course.courseCode}: ${course.description ?? ""}`,
        courseCode: course.courseCode,
      })),
    });
    count += courseQuery.page.length;
    page++;


    while (!courseQuery.isDone) {
      console.log(`[${page}] Generating embeddings for ${courseQuery.page.length} courses`);
      courseQuery = await ctx.runQuery(api.myplan.listFullCourses, {
        limit: 100,
        cursor: courseQuery.continueCursor,
      });
      await ctx.scheduler.runAfter(page * 3000, internal.ops.courseEmbeddings.generateCourseEmbeddings, {
        data: courseQuery.page.map((course) => ({
          _id: course._id,
          text: `${course.courseCode}: ${course.description ?? ""}`,
          courseCode: course.courseCode,
        })),
      });
      count += courseQuery.page.length;
      page++;
    }

    console.log(`[${page}] Spinned up updates for ${count} courses (should be done in ${page * 3} seconds or ${page * 3 / 60} minutes)`);

    return {
      success: true,
    };
  }
})


export const generateCourseEmbeddings = internalAction({
  args: {
    data: v.array(v.object({
      _id: v.id("myplanCourses"),
      text: v.string(),
      courseCode: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const openai = new OpenAI();

    console.log(`Generating embeddings for ${args.data.length} courses`);
    const embeddings = await Promise.all(args.data.map(async (course) => {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: course.text,
        encoding_format: "float",
      });
      return {
        _id: course._id,
        embedding: embedding.data[0].embedding,
      }
    }));

    console.log(`Updating ${embeddings.length} courses`);
    await ctx.runMutation(internal.myplan.updateCourses, {
      courses: embeddings.map((course) => ({
        id: course._id,
        data: {
          embedding: course.embedding,
        }
      })),
    });

    console.log(`Updated ${embeddings.length} courses with embeddings`);

    return {
      success: true,
    };
  }
})




export const checkCourseEmbeddings = internalAction({
  args: {

  },
  handler: async (ctx, args) => {
    let page = 1;
    let count = 0;
    let emptyEmbeddings = 0;

    console.log(`Fetching all course codes`);
    let courseQuery = await ctx.runQuery(api.myplan.listFullCourses, {
      limit: 100,
    });

    for (const course of courseQuery.page) {
      if (!course.embedding) {
        emptyEmbeddings++;
      }
    }

    count += courseQuery.page.length;
    page++;


    while (!courseQuery.isDone) {
      console.log(`Fetching page ${page}`);
      courseQuery = await ctx.runQuery(api.myplan.listFullCourses, {
        limit: 100,
        cursor: courseQuery.continueCursor,
      });
      for (const course of courseQuery.page) {
        if (!course.embedding) {
          emptyEmbeddings++;
        }
      }
      count += courseQuery.page.length;
      page++;
    }

    console.log(`Found ${emptyEmbeddings} empty embeddings out of ${count} courses`);

    return {
      success: true,
    };
  }
})


export const search = internalAction({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const openai = new OpenAI();
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: args.query,
      encoding_format: "float",
    });

    const results = await ctx.vectorSearch("myplanCourses", "by_embedding", {
      vector: embedding.data[0].embedding,
      limit: 10,
    });

    const c = await ctx.runQuery(api.myplan.listFullCoursesWithIds, {
      ids: results.map((result) => result._id),
    });

    const c2 = c.map((c) => ({
      _id: c!._id,
      courseCode: c!.courseCode,
      description: c!.description,
      // embedding: c.embedding,
    }));

    console.log(`Found ${c2.length} courses`);
    console.log(c2);

    // return c;
  }
})