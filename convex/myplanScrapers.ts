import { ConvexError, Infer, v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { MyplanCourseInfo, myplanCourseInfoObj, MyplanCourseTermData, myplanSubjectFields } from "./schema";

const campuses = ["seattle", "tacoma", "bothell"] as const;
const campusLiteral = campuses.map(c => v.literal(c));
const campusUnion = v.union(...campusLiteral);
type Campus = Infer<typeof campusUnion>;

// TypeScript interfaces for data types
export interface SearchCourseItem {
  id: string;
  courseId: string;
  code: string;
  subject: string;
  level: string;
  title: string;
  credit: string;
  campus: Campus;
  termId: string;
  institution: string;
  allCredits: string[];
  genEduReqs: string[];
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
  campus: Campus;
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

const MYPLAN_COOKIE = `_ga_VQZHV3SH3P=GS2.1.s1746589140$o1$g1$t1746589227$j0$l0$h0; _hjSessionUser_3542396=eyJpZCI6ImNhYzQ2MjlmLTM4YzgtNTY3Ni1iYmIzLTI0NjMxYzdkNmU4YyIsImNyZWF0ZWQiOjE3NDcxOTc3MjU4ODUsImV4aXN0aW5nIjp0cnVlfQ==; _fbp=fb.1.1747197726331.115911875945980748; _ga_0V5LFWD2KQ=GS2.1.s1747935853$o1$g1$t1747936345$j19$l0$h0$dR2YvLwKSS1jCphuMmKjS-bP4T4IWuOGjQA; _ga_5NP8JDX6NQ=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dG4XvxCAG0rfpOKPrtoRi1AbSSPVA4UkpLA; _ga_MX29D1QWGH=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dxC1HkbqNja6xDBYDEseQwSEKt83uCm8LWw; _ga_0VMRR09G41=GS2.1.s1748364465$o1$g0$t1748364470$j0$l0$h0; _ga_S51TRWK3R8=GS2.1.s1750134110$o4$g0$t1750134111$j59$l0$h0; ps_rvm_ZkiN=%7B%22pssid%22%3A%2238Y0jAzv3GjOFtQ7-1750107949183%22%2C%22last-visit%22%3A%221750134111689%22%7D; _uetvid=c9d07890307d11f0b754537bf5d08d37|kj0mft|1748066424492|2|1|bat.bing.com/p/insights/c/j; _ga_MBEGNXVCWH=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h72956306; _ga_YJ09SKYQ9C=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h0; _clck=ghtic3%7C2%7Cfx9%7C0%7C2009; _ga_29JYF25HLW=GS2.1.s1751472063$o2$g1$t1751472878$j60$l0$h1135471766; fs_uid=#o-1V47MT-na1#0d1e305f-fceb-4356-a2f3-2a575a93a39d:00a92d97-a482-4617-8a9c-61f71a39812c:1753945821112::1#efac8273#/1775255924; _gcl_au=1.1.892997884.1757364387; _ga_58P4G5E9Q9=GS2.1.s1757364387$o1$g0$t1757364392$j55$l0$h0; _ga_5RFPSMZQJ7=GS2.1.s1757364387$o1$g0$t1757364393$j54$l0$h0; _ga_K5Q4WV298H=GS2.1.s1757364406$o2$g0$t1757364415$j51$l0$h0; _ga_YHX5G0W6DX=GS2.1.s1757364370$o3$g1$t1757364422$j8$l0$h0; _ga_WGSVEGE14H=GS2.1.s1757593238$o14$g1$t1757593261$j37$l0$h0; _ga_B3VH61T4DT=GS2.1.s1758297737$o57$g0$t1758297737$j60$l0$h0; _ga_BFQJ094C4L=GS2.1.s1758670657$o18$g0$t1758670657$j60$l0$h0; _ga=GA1.1.107335358.1742470468; _ga_63X2ZQHK8P=GS2.1.s1758774265$o1$g1$t1758774579$j18$l0$h0; _ga_ZYFDGVCGY3=GS2.1.s1759017050$o4$g0$t1759017050$j60$l0$h0; sessionId=f8ad6377ab31b8123c6831ee64780dd739d2193403c07dde6f301bca65db0027; _ga_TNNYEHDN9L=GS2.1.s1759253124$o87$g1$t1759253136$j48$l0$h0`
const MYPLAN_CSRF_TOKEN = `43545b32caef059c2afa82b6001d9435a57704975fe20e2c193b8230b84a0ac08a7577a4717158efe0eca5f243c2075bb06a8b152585535792dcb477cc30ab10153beabd137cc96696d6c8bcbf6cc76236314691f046bf13e95eb5e7ac402d6e73b81b1569643028d65fe6830db29a752573a47d68fabfa93bcf40be6e4c59b0`

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
    campus: v.optional(campusUnion),
  },
  handler: async (ctx, args): Promise<SearchCourseItem[]> => {
    const payload: SearchCoursesPayload = {
      username: "GUEST",
      requestId: generateRequestId(),
      sectionSearch: true,
      instructorSearch: false,
      queryString: args.query,
      consumerLevel: "UNDERGRADUATE",
      campus: args.campus || "seattle",
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
        throw new ConvexError("Error making request to MyPlan API");
      }

      const data = await response.json();
      return data as SearchCourseItem[];
    } catch (error) {
      console.error(`Error making request to MyPlan API: ${error}`);
      throw new ConvexError("Error making request to MyPlan API");
    }
  },
});

// Convex action to get subject areas
export const scrapeSubjectAreas = internalAction({
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

export const scheduleEmtpyAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const BATCH_SIZE = 100
    const BATCH_INTERVAL_MS = 1000 * 60 * 5; // 5 minutes between batches

    let page = 1;

    let paginatedResult = await ctx.runQuery(api.myplan.listEmptyDetailCourses, {
      limit: BATCH_SIZE,
      cursor: undefined,
    });
    console.log(`Scheduling batch 1 to run at ${new Date(Date.now() + 0).toLocaleTimeString()}`);
    await ctx.scheduler.runAfter(0, internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
      courseCodes: paginatedResult.page.map((course) => course.courseCode),
    });
    page++;

    while (!paginatedResult.isDone) {
      paginatedResult = await ctx.runQuery(api.myplan.listEmptyDetailCourses, {
        limit: BATCH_SIZE,
        cursor: paginatedResult.continueCursor,
      });
      console.log(`Scheduling batch ${page} to run at ${new Date(Date.now() + (page - 1) * BATCH_INTERVAL_MS).toLocaleTimeString()}`);
      await ctx.scheduler.runAfter((page - 1) * BATCH_INTERVAL_MS, internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
        courseCodes: paginatedResult.page.map((course) => course.courseCode),
      });
      page++;
    }

    console.log(`Scheduled all courses to be scraped in ${page * BATCH_INTERVAL_MS} seconds`);
    return {
      success: true,
    };
  }
})


// schedule course detailupdates for all courses
export const scheduleAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const BATCH_SIZE = 100
    const BATCH_INTERVAL_MS = 1000 * 60 * 5; // 5 minutes between batches

    let page = 1;

    let paginatedResult = await ctx.runQuery(api.myplan.listCourseCodes, {
      limit: BATCH_SIZE,
      cursor: undefined,
    });
    console.log(`Scheduling batch 1 to run at ${new Date(Date.now() + 0).toLocaleTimeString()}`);
    await ctx.scheduler.runAfter(0, internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
      courseCodes: paginatedResult.data.map((course) => course.courseCode),
    });
    page++;

    while (!paginatedResult.isDone) {
      paginatedResult = await ctx.runQuery(api.myplan.listCourseCodes, {
        limit: BATCH_SIZE,
        cursor: paginatedResult.continueCursor,
      });
      console.log(`Scheduling batch ${page} to run at ${new Date(Date.now() + (page - 1) * BATCH_INTERVAL_MS).toLocaleTimeString()}`);
      await ctx.scheduler.runAfter((page - 1) * BATCH_INTERVAL_MS, internal.myplanScrapers.scrapeAndSaveCourseDetailBatch, {
        courseCodes: paginatedResult.data.map((course) => course.courseCode),
      });
      page++;
    }

    console.log(`Scheduled all courses to be scraped in ${page * BATCH_INTERVAL_MS} seconds`);
    return {
      success: true,
    };
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
    console.log(`Scraping latest subject areas...`);
    const subjectAreas = await ctx.runAction(internal.myplanScrapers.scrapeSubjectAreas, {});
    console.log(`Found ${subjectAreas.length} subject areas`);

    const offset = args.offset ?? 0;
    const limit = args.limit ?? undefined
    const filteredSubjectAreas = subjectAreas.slice(offset, limit ? offset + limit : undefined);
    console.log(`Filtered subject areas to process: ${filteredSubjectAreas.length}`);

    let i = 0;
    let totalCourses = 0;

    const seen = new Set<string>();

    // Process subject areas in batches of 100
    const batchSize = 20;
    for (let i = 0; i < filteredSubjectAreas.length; i += batchSize) {
      const batch = filteredSubjectAreas.slice(i, i + batchSize);
      console.log(`Processing subject area batch ${i / batchSize + 1} of ${Math.ceil(filteredSubjectAreas.length / batchSize)}`);

      const searchData = await Promise.all(batch.map(async (subjectArea) => {
        console.log(`Start scraping search courses for subject area '${subjectArea.code}'...`);
        const searchData = await ctx.runAction(api.myplanScrapers.scrapeSearchCourses, {
          query: subjectArea.code,
          campus: subjectArea.campus,
        });
        console.log(`Found ${searchData.length} courses for subject area '${subjectArea.code}'`);
        return searchData;
      }));

      let courseData = searchData.flat();
      const batchSize2 = 100;
      courseData = courseData.filter((course) => !seen.has(course.code));
      for (let i = 0; i < courseData.length; i += batchSize2) {
        console.log(`Updating course data batch ${i / batchSize2 + 1} of ${Math.ceil(courseData.length / batchSize2)}`);
        const batch = courseData.slice(i, i + batchSize2);
        await ctx.runMutation(internal.myplan.updateCourseByCourseCodeBatch, {
          courseCodes: batch.map((course) => ({
            courseCode: course.code,
            allCredits: course.allCredits,
            genEduReqs: course.genEduReqs ?? [],
          })),
        });
        batch.forEach((course) => {
          seen.add(course.code);
        });
      }

      totalCourses += courseData.length;
    }

    console.log(`Scraped ${totalCourses} courses in total`);


    return {
      success: true,
      totalCourses: totalCourses,
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

// Subject area related functions

export const getAllSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("myplanSubjects").collect();
  }
})

export const insertSubject = internalMutation({
  args: myplanSubjectFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert("myplanSubjects", args);
  }
})

export const deleteSubject = internalMutation({
  args: {
    subjectId: v.id("myplanSubjects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.subjectId);
  }
})

export const upsertSubject = internalMutation({
  args: {
    ...myplanSubjectFields,
    subjectId: v.id("myplanSubjects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.subjectId, args);
  }
})


export const scrapeAndSaveSubjectAreas = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Scraping subject areas from MyPlan API");

    const newSubjectAreas = await ctx.runAction(internal.myplanScrapers.scrapeSubjectAreas, {});

    console.log(`Found ${newSubjectAreas.length} subject areas`);

    // Clear existing subject areas and insert new ones
    const existingSubjects = await ctx.runQuery(api.myplanScrapers.getAllSubjects, {});
    const existingSubjectsMap = new Map(existingSubjects.map((subject) => [subject.code, subject]));

    // // Insert new subject areas
    for (const subjectArea of newSubjectAreas) {
      const existingSubject = existingSubjectsMap.get(subjectArea.code);
      if (existingSubject) {
        await ctx.runMutation(internal.myplanScrapers.upsertSubject, {
          subjectId: existingSubject._id,
          ...subjectArea,
        });
      } else {
        await ctx.runMutation(internal.myplanScrapers.insertSubject, {
          code: subjectArea.code,
          title: subjectArea.title,
          campus: subjectArea.campus,
          collegeCode: subjectArea.collegeCode,
          collegeTitle: subjectArea.collegeTitle,
          departmentCode: subjectArea.departmentCode,
          departmentTitle: subjectArea.departmentTitle,
          codeNoSpaces: subjectArea.codeNoSpaces,
          quotedCode: subjectArea.quotedCode,
        });
      }
    }

    console.log(`Saved ${newSubjectAreas.length} subject areas to database`);

    return {
      success: true,
    };
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
