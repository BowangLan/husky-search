import { Infer, v } from "convex/values";
import { action, internalAction, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const getHeaders = query({
  args: {},
  handler: async (ctx) => {
    const cookie: string = await ctx.runQuery(api.kvStore.getDawgpathCookie, {});

    return {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": cookie,
      "Referer": "https://dawgpath.uw.edu/"
    };
  }
});

export const scrapeCourseDetail = internalAction({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const headers = await ctx.runQuery(api.dawgpathScrapers.getHeaders, {});

    const response = await fetch(`https://dawgpath.uw.edu/api/v1/courses/details/${args.courseCode}`, {
      "headers": headers,
      "method": "GET"
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  }
})

export const scrapeSubjectCoi = internalAction({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
    const headers = await ctx.runQuery(api.dawgpathScrapers.getHeaders, {});

    const response = await fetch(`https://dawgpath.uw.edu/api/v1/coi/course/${args.subjectCode}`, {
      "headers": headers,
      "method": "GET"
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  }
})

export const scrapeSubjectPrereqs = internalAction({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
    const headers = await ctx.runQuery(api.dawgpathScrapers.getHeaders, {});

    const response = await fetch(`https://dawgpath.uw.edu/api/v1/curric_prereq/${args.subjectCode}`, {
      "headers": headers,
      "method": "GET"
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as {
      course_data: Array<{
        course_id: string
        course_title: string
        postreqs: Array<{
          course_id: string
        }>
        prereqs: Array<{
          course_id: string
        }>
      }>
    };
  }
})

export const scrapeAllSubjectCoi = internalAction({
  args: {},
  returns: v.array(v.object({
    curric: v.string(),
    curric_name: v.string(),
    score: v.union(v.number(), v.null()),
  })),
  handler: async (ctx) => {
    const headers = await ctx.runQuery(api.dawgpathScrapers.getHeaders, {});

    const response = await fetch("https://dawgpath.uw.edu/api/v1/coi/curric/", {
      "headers": headers,
      "method": "GET"
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data as {
      curric: string;
      curric_name: string;
      score: number | null;
    }[];
  }
})

export const scrapeAndSaveAllSubjects = internalAction({
  args: {},
  handler: async (ctx) => {
    const data = await ctx.runAction(internal.dawgpathScrapers.scrapeAllSubjectCoi, {});
    console.log(`Scraped ${data.length} subjects`);

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      console.log(`Upserting batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}`);
      await ctx.runMutation(internal.dawgpath.upsertSubjects, {
        subjects: batch.map((item) => ({
          subjectCode: item.curric,
          name: item.curric_name,
        })),
      });
    }
    console.log(`Upserted ${data.length} subjects`);

    return {
      success: true,
    };
  }
})

export const scrapeAndSaveCoursesBySubject = internalAction({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.runQuery(api.dawgpath.getSubjectByCode, {
      subjectCode: args.subjectCode,
    });

    if (!subject) {
      return {
        success: false,
        error: `Subject not found: ${args.subjectCode}`,
      };
    }

    const data = await ctx.runAction(internal.dawgpathScrapers.scrapeSubjectPrereqs, {
      subjectCode: args.subjectCode,
    });

    if (!data) {
      return {
        success: false,
        error: `Failed to scrape courses for subject ${args.subjectCode}`,
      };
    }

    console.log(`Scraped ${data.course_data.length} courses for subject ${args.subjectCode}`);

    for (let i = 0; i < data.course_data.length; i += 100) {
      const batch = data.course_data.slice(i, i + 100);
      console.log(`Upserting batch ${i / 100 + 1} of ${Math.ceil(data.course_data.length / 100)}`);
      await ctx.runMutation(internal.dawgpath.upsertCourses, {
        courses: batch.map((item) => ({
          courseCode: item.course_id,
          courseName: item.course_title,
          courseDescription: "",
          coursePrerequisites: [],
          courseCoi: [],
        })),
      });
    }

    console.log(`Upserted ${data.course_data.length} courses for subject ${args.subjectCode}`);
    return {
      success: true,
    };
  }
})

export const scrapeAndSaveCoursesForAllSubjects = internalAction({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.runQuery(api.dawgpath.getAllSubjects, {});

    let i = 0;
    for (const subject of subjects) {
      console.log(`Scheduling scrapeAndSaveCoursesBySubject for ${subject.subjectCode}`);
      await ctx.scheduler.runAfter(i * 1000, internal.dawgpathScrapers.scrapeAndSaveCoursesBySubject, {
        subjectCode: subject.subjectCode,
      });
      i++;
    }

    console.log(`Scheduled ${i} scrapeAndSaveCoursesBySubject jobs`);

    return {
      success: true,
    };
  }
})

export const scrapeAndSaveCourseDetail = internalAction({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runAction(internal.dawgpathScrapers.scrapeCourseDetail, {
      courseCode: args.courseCode,
    });
    await ctx.runMutation(internal.dawgpath.upsertCourseDetail, {
      courseCode: args.courseCode,
      detailData: data,
    });
    return {
      success: true,
    };
  }
})


export const scrapeAndSaveAllCourseDetail = internalAction({
  args: {},
  handler: async (ctx) => {
    const SIZE = 200;
    const itemsPerSecond = 5;
    let currentBatch = await ctx.runQuery(api.dawgpath.listCourseCodes, {
      limit: SIZE,
      cursor: undefined,
    });

    for (let i = 0; i < currentBatch.data.length; i += itemsPerSecond) {
      const batch = currentBatch.data.slice(i, i + itemsPerSecond);
      console.log(`Processing ${batch.length} courses (batch ${i / itemsPerSecond + 1})`);
      await Promise.all(batch.map(async (course) => {
        await ctx.scheduler.runAfter(i * 1000, internal.dawgpathScrapers.scrapeAndSaveCourseDetail, {
          courseCode: course,
        });
      }));
    }

    let j = 2;

    while (!currentBatch.isDone) {
      console.log(`Processing ${currentBatch.data.length} courses (batch ${j})`);
      currentBatch = await ctx.runQuery(api.dawgpath.listCourseCodes, {
        limit: SIZE,
        cursor: currentBatch.continueCursor,
      });
      for (let i = 0; i < currentBatch.data.length; i += itemsPerSecond) {
        const batch = currentBatch.data.slice(i, i + itemsPerSecond);
        console.log(`Processing ${batch.length} courses (batch ${i / itemsPerSecond + 1})`);
        await Promise.all(batch.map(async (course) => {
          await ctx.scheduler.runAfter(i * 1000, internal.dawgpathScrapers.scrapeAndSaveCourseDetail, {
            courseCode: course,
          });
        }));
      }
    }

    return {
      success: true,
    };
  }
})