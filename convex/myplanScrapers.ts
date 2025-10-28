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

export const getHeaders = query({
  args: {},
  handler: async (ctx) => {
    const cookie: string = await ctx.runQuery(api.kvStore.getMyplanCookie, {});
    const csrfToken: string = await ctx.runQuery(api.kvStore.getMyplanCsrfToken, {});

    return {
      "accept": "*/*",
      "content-type": "application/json",
      "origin": "https://myplan.uw.edu",
      "referer": "https://myplan.uw.edu/",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      "cookie": cookie,
      "x-csrf-token": csrfToken,
    };
  }
});


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

    const headers = await ctx.runQuery(api.myplanScrapers.getHeaders, {});

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
    const headers = await ctx.runQuery(api.myplanScrapers.getHeaders, {});

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
    const headers = await ctx.runQuery(api.myplanScrapers.getHeaders, {});

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
    const headers = await ctx.runQuery(api.myplanScrapers.getHeaders, {});

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

export const scrapeAndSaveCourseDetialBySubjectArea = internalAction({
  args: {
    subjectArea: v.string(),
  },
  handler: async (ctx, args) => {
    const courses = await ctx.runQuery(api.myplan.listCourseCodesBySubjectArea, {
      subjectArea: args.subjectArea,
    });

    console.log(`Found ${courses.length} courses for subject area ${args.subjectArea}`);

    const batchSize = 10;
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);
      console.log(`Scraping batch ${i / batchSize + 1} of ${Math.ceil(courses.length / batchSize)} [${batch.map((course) => course.courseCode).join(", ")}]`);
      await Promise.all(
        batch.map(course =>
          ctx.runAction(internal.myplanScrapers.scrapeAndSaveCourseDetail, {
            courseCode: course.courseCode,
          })
        )
      );
    }

    console.log(`Scraped ${courses.length} courses for subject area ${args.subjectArea}`);

    return {
      success: true,
    };
  }
})

export const healthCheck = action({
  args: {},
  handler: async (ctx, args) => {
    const headers = await ctx.runQuery(api.myplanScrapers.getHeaders, {});
    const response = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: headers,
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
