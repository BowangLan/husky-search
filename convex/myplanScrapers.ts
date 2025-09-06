import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { MyplanCourseInfo, myplanCourseInfoObj, MyplanCourseTermData } from "./schema";
import { processCourseDetail } from "./myplanUtils";

// TypeScript interfaces for data types
export interface Course {
  id: string;
  courseId: string;
  code: string;
  subject: string;
  level: string;
  title: string;
  credit: string;
  campus: string;
  termId: string;
  institution: string;
  allCredits: string[];
  genEduReqs: any[];
  sectionGroups: string[];
  startTime: number;
  endTime: number;
  score: number;
  latestVersion: boolean;
  expiringTermId: any;
  beginningTermId: any;
  prereqs: string;
  onlineLearningCodes: string[];
  meetingDays: string[];
  versions: any[];
  gradingSystems: string[];
  open: boolean;
  tba: boolean;
  pce: boolean;
  enrRestricted: boolean;
}

export interface SubjectArea {
  code: string;
  title: string;
  campus: string;
  collegeCode: string;
  collegeTitle: string;
  departmentCode: string;
  departmentTitle: string;
  codeNoSpaces: string;
  quotedCode: string;
}

export interface Instructor {
  name: string;
  campus: string;
}

interface SearchCoursesPayload {
  username: string;
  requestId: string;
  sectionSearch: boolean;
  instructorSearch: boolean;
  queryString: string;
  consumerLevel: string;
  campus: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
}

function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Base API configuration
const BASE_URL = "https://course-app-api.planning.sis.uw.edu/api";

const MYPLAN_COOKIE = `_ga_VQZHV3SH3P=GS2.1.s1746589140$o1$g1$t1746589227$j0$l0$h0; _hjSessionUser_3542396=eyJpZCI6ImNhYzQ2MjlmLTM4YzgtNTY3Ni1iYmIzLTI0NjMxYzdkNmU4YyIsImNyZWF0ZWQiOjE3NDcxOTc3MjU4ODUsImV4aXN0aW5nIjp0cnVlfQ==; _fbp=fb.1.1747197726331.115911875945980748; _ga_0V5LFWD2KQ=GS2.1.s1747935853$o1$g1$t1747936345$j19$l0$h0$dR2YvLwKSS1jCphuMmKjS-bP4T4IWuOGjQA; _ga_YHX5G0W6DX=GS2.1.s1747937532$o2$g0$t1747937532$j0$l0$h0; _ga_K5Q4WV298H=GS2.1.s1747933199$o1$g1$t1747938514$j0$l0$h0; _ga_5NP8JDX6NQ=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dG4XvxCAG0rfpOKPrtoRi1AbSSPVA4UkpLA; _ga_MX29D1QWGH=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dxC1HkbqNja6xDBYDEseQwSEKt83uCm8LWw; _ga_0VMRR09G41=GS2.1.s1748364465$o1$g0$t1748364470$j0$l0$h0; _ga_S51TRWK3R8=GS2.1.s1750134110$o4$g0$t1750134111$j59$l0$h0; ps_rvm_ZkiN=%7B%22pssid%22%3A%2238Y0jAzv3GjOFtQ7-1750107949183%22%2C%22last-visit%22%3A%221750134111689%22%7D; _ga=GA1.1.107335358.1742470468; _uetvid=c9d07890307d11f0b754537bf5d08d37|kj0mft|1748066424492|2|1|bat.bing.com/p/insights/c/j; _ga_MBEGNXVCWH=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h72956306; _ga_YJ09SKYQ9C=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h0; _clck=ghtic3%7C2%7Cfx9%7C0%7C2009; _ga_29JYF25HLW=GS2.1.s1751472063$o2$g1$t1751472878$j60$l0$h1135471766; fs_uid=#o-1V47MT-na1#0d1e305f-fceb-4356-a2f3-2a575a93a39d:00a92d97-a482-4617-8a9c-61f71a39812c:1753945821112::1#efac8273#/1775255924; _ga_WGSVEGE14H=GS2.1.s1756241720$o13$g1$t1756241728$j52$l0$h0; _ga_B3VH61T4DT=GS2.1.s1756405592$o55$g1$t1756405664$j49$l0$h0; sessionId=7e19d415c7221cb49ecdebaa9560ce5690ba4b40c0fd506e34881aa8b3e88378; _ga_BFQJ094C4L=GS2.1.s1757128095$o15$g1$t1757128116$j39$l0$h0; _ga_ZYFDGVCGY3=GS2.1.s1757141980$o2$g0$t1757141980$j60$l0$h0; _ga_TNNYEHDN9L=GS2.1.s1757146518$o71$g1$t1757146528$j50$l0$h0`
const MYPLAN_CSRF_TOKEN = `3dd6e37f234cc735b36caaa44e49b46b34a2ceb0d9ca9103332e85d19c8f4afd857997d5a345efce012d32ffdd28563ed6c3777c9c56791fb364dcd0d73e82be42c62c3d37a3e8637fcbdd94165babf73c2992a20691f4fec9b79a685841cd899e99fe5a614edaf74c08da0670bfa0035e7372140378e24a522112bd79a7f553`

function getHeaders() {
  return {
    "accept": "*/*",
    "content-type": "application/json",
    "origin": "https://myplan.uw.edu",
    "referer": "https://myplan.uw.edu/",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "cookie": MYPLAN_COOKIE,
    "x-csrf-token": MYPLAN_CSRF_TOKEN,
  };
}

// Convex action to search for courses
export const scrapeSearchCourses = action({
  args: {
    query: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    days: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<Course[]> => {
    const payload: SearchCoursesPayload = {
      username: "GUEST",
      requestId: generateRequestId(),
      sectionSearch: true,
      instructorSearch: false,
      queryString: args.query,
      consumerLevel: "UNDERGRADUATE",
      campus: "seattle",
      startTime: args.startTime || "0630",
      endTime: args.endTime || "2230",
      days: args.days || [],
    };

    const headers = getHeaders();

    try {
      const response = await fetch(`${BASE_URL}/courses`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Error making request to MyPlan API: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data as Course[];
    } catch (error) {
      console.error(`Error making request to MyPlan API: ${error}`);
      return [];
    }
  },
});

// Convex action to get subject areas
export const scrapeSubjectAreas = action({
  args: {},
  handler: async (ctx): Promise<SubjectArea[]> => {
    const headers = getHeaders();

    try {
      const response = await fetch(`${BASE_URL}/subjectAreas`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error(`Error making request to MyPlan API: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data as SubjectArea[];
    } catch (error) {
      throw new Error(`Error making request to MyPlan API: ${error}`);
      return [];
    }
  },
});

// Convex action to get instructors
export const scrapeInstructors = action({
  args: {},
  handler: async (ctx): Promise<Instructor[]> => {
    const headers = getHeaders();

    try {
      const response = await fetch(`${BASE_URL}/instructors`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error(`Error making request to MyPlan API: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data as Instructor[];
    } catch (error) {
      console.error(`Error making request to MyPlan API: ${error}`);
      return [];
    }
  },
});

// Convex action to get course details
export const scrapeCourseDetail = action({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args): Promise<Record<string, any>> => {
    const headers = getHeaders();

    const url = new URL(`${BASE_URL}/courses/${args.courseCode}/details`);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error(`Error making request to MyPlan API: ${response.status} ${response.statusText}`);
        return {
          error: response.status,
          message: response.statusText,
        };
      }

      const data = await response.json();

      return data;

      // return {
      //   ...processCourseDetail(data),
      //   // raw: data,
      // }
    } catch (error) {
      console.error(`Error making request to MyPlan API: ${error}`);
      return {};
    }
  },
});


export const scrapeAndSaveCourseDetail = internalAction({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`Scraping course detail for ${args.courseCode}`);
    const data = await ctx.runAction(api.myplanScrapers.scrapeCourseDetail, {
      courseCode: args.courseCode,
    });

    console.log(`Upserting course detail for ${args.courseCode}`);
    await ctx.runMutation(internal.myplan.upsertCourseDetail, {
      courseCode: args.courseCode,
      detailData: data,
    });

    console.log(`Upserted course detail for ${args.courseCode}`);
  }
})

export const scrapeAndSaveCourseDetailBatch = internalAction({
  args: {
    courseCodes: v.array(v.string()),
    batchSize: v.optional(v.number()),
    batchDelay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 2;
    const batchDelay = args.batchDelay ?? 1000; // 1 second

    for (let i = 0; i < args.courseCodes.length; i += batchSize) {
      const batch = args.courseCodes.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(args.courseCodes.length / batchSize)}`);
      await Promise.all(batch.map(async (courseCode) => {
        await ctx.scheduler.runAfter(i * batchDelay, internal.myplanScrapers.scrapeAndSaveCourseDetail, {
          courseCode: courseCode,
        });
      }));
    }
  }
})


export const scrapeCourseDetailTest = action({
  args: {},
  handler: async (ctx): Promise<Record<string, any>> => {
    const TEST_COURSE_CODE = "INFO 200"

    const data = await ctx.runAction(api.myplanScrapers.scrapeCourseDetail, {
      courseCode: TEST_COURSE_CODE,
    });

    return data;
  }
});

export const scrapeAndSaveSearchResultsForAllSubjectAreas = action({
  args: {
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {

    const subjectAreas = await ctx.runAction(api.myplanScrapers.scrapeSubjectAreas, {});
    const kvStoreCourseCodes = new Set(await ctx.runQuery(internal.myplan.getKVStoreCourseCodes, {}));

    const offset = args.offset ?? 0;
    const limit = args.limit ?? undefined
    const filteredSubjectAreas = subjectAreas.slice(offset, limit);

    let i = 0;
    let totalCourses = 0;
    let totalExistingCourses = 0;

    const courses: MyplanCourseInfo[] = [];

    // Process subject areas in batches of 100
    const batchSize = 20;
    for (let i = 0; i < filteredSubjectAreas.length; i += batchSize) {
      const batch = filteredSubjectAreas.slice(i, i + batchSize);
      console.log(`Processing subject area batch ${i / batchSize + 1} of ${Math.ceil(filteredSubjectAreas.length / batchSize)}`);

      const searchData = await Promise.all(batch.map(async (subjectArea) => {
        const searchData = await ctx.runAction(api.myplanScrapers.scrapeSearchCourses, {
          query: subjectArea.code,
        });
        return searchData;
      }));

      for (const batchSearchData of searchData) {
        for (const course of batchSearchData) {
          if (kvStoreCourseCodes.has(course.code)) {
            // console.log(`Course ${course.code} already exists in KV store`);
            totalExistingCourses++;
            continue;
          }
          courses.push({
            courseCode: course.code,
            courseId: course.courseId,
            description: "", // Not available in search results
            title: course.title,
            credit: course.credit,
            campus: course.campus,
            subjectArea: course.subject,
            courseNumber: course.code.slice(-3),
            prereqs: course.prereqs,
          });
        }
      }
    }

    for (let i = 0; i < courses.length; i += 100) {
      console.log(`Processing batch ${i / 100 + 1} of ${Math.ceil(courses.length / 100)}`);
      const batch = courses.slice(i, i + 100);
      await ctx.runMutation(internal.myplan.addCourseCodesToKVStore, {
        courseCodes: batch.map((course) => course.courseCode),
      });
      await Promise.all(batch.map(async (course) => {
        await ctx.runMutation(internal.myplan.upsertCourseInfo, {
          ...course
        });
        // await ctx.runMutation(internal.myplan.upsertCourseSearch, {
        //   courseCode: course.courseCode,
        //   searchData: course,
        // });
      }));
    }


    console.log(`Scraped ${totalCourses + totalExistingCourses} courses for ${i} subject areas`);
    console.log(`Saved ${totalCourses} courses`);
    console.log(`Skipped ${totalExistingCourses} courses`);

    return {
      success: true,
      totalCourses: totalCourses,
      totalExistingCourses: totalExistingCourses,
      totalSubjectAreas: i,
    };
  }
});


export const kickOffScrapersForCoursesWithoutTermData = internalAction({
  args: {},
  handler: async (ctx, args) => {
    let count = 0;
    let page = 1;
    let paginatedResults = await ctx.runQuery(api.myplan.list, {
      select: ["_id", "currentTermData", "courseCode"],
      limit: 500,
    })

    let coursesWithoutTermData = paginatedResults.page.filter((course) => !course.currentTermData);
    count += paginatedResults.page.length;

    while (!paginatedResults.isDone) {
      paginatedResults = await ctx.runQuery(api.myplan.list, {
        select: ["_id", "currentTermData", "courseCode"],
        cursor: paginatedResults.continueCursor,
        limit: 500,
      })

      coursesWithoutTermData.push(...paginatedResults.page.filter((course) => !course.currentTermData) as any[]);
      count += paginatedResults.page.length;
      page++;

      // console.log(`Page ${page} fetched, found ${coursesWithoutTermData.length} courses without term data so far`);
    }

    console.log(`Found ${coursesWithoutTermData.length} courses without term data`);

    // Kick off scrapers in batches
    const batchSize = 3;
    const secondsPerBatch = 1;
    let batchI = 0;
    for (let i = 0; i < coursesWithoutTermData.length; i += batchSize) {
      const batch = coursesWithoutTermData.slice(i, i + batchSize);
      console.log(`Kicking off scrapers for batch ${batchI + 1} (size = ${batch.length}) (codes = ${batch.map((course) => course.courseCode).join(", ")})`);
      await ctx.scheduler.runAfter(batchI * secondsPerBatch, internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
        courseCodes: batch.map((course) => course.courseCode),
      });
      batchI++;
      // break;
    }

    console.log(`Kicked off ${batchI} scrapers. Should all be started in ${batchI * secondsPerBatch} seconds`);

    // print first 5 course codes
    console.log(coursesWithoutTermData.slice(0, 5).map((course) => course.courseCode));


    // return {
    //   totalCourses: count,
    //   coursesWithoutTermData: coursesWithoutTermData.length,
    // }
  }
});


/**
 * Cron jobs for scraping course detail
 */


export const getCourseDetailCronJobs = query({
  args: {
    intervalSeconds: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("myplanCourses")
      .withIndex("by_update_interval_seconds", (q) => q.eq("updateIntervalSeconds", args.intervalSeconds))
      .paginate({
        numItems: 100,
        cursor: args.cursor ?? null,
      });
  }
})

export const runCourseDetailCronJob = internalAction({
  args: {
    intervalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    console.log("Running course detail cron job for interval", args.intervalSeconds);

    let paginationResult = await ctx.runQuery(api.myplanScrapers.getCourseDetailCronJobs, {
      intervalSeconds: args.intervalSeconds,
    });

    await ctx.runAction(internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
      courseCodes: paginationResult.page.map((course) => course.courseCode),
    });

    while (!paginationResult.isDone) {
      console.log(`Processing ${paginationResult.page.length} courses`);
      const courses = paginationResult.page;
      paginationResult = await ctx.runQuery(api.myplanScrapers.getCourseDetailCronJobs, {
        intervalSeconds: args.intervalSeconds,
        cursor: paginationResult.continueCursor,
      });
      await ctx.runAction(internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
        courseCodes: courses.map((course) => course.courseCode),
      });
    }
  }
})

export const healthCheck = action({
  args: {},
  handler: async (ctx, args) => {
    const response = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        username: "GUEST",
        requestId: generateRequestId(),
        sectionSearch: true,
        instructorSearch: false,
        queryString: "INFO 200",
      }),
    });

    const data = await response.json();

    return {
      status: response.status,
      statusText: response.statusText,
      body: data,
    }
  }
})