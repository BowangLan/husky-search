import { v } from "convex/values";
import { action, internalAction, query } from "./_generated/server";
import { api } from "./_generated/api";

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

// Helper functions
function generateChecksum(data: string): string {
  // Note: In a real implementation, you'd need a proper MD5 implementation
  // For now, this is a placeholder
  return btoa(data).slice(0, 32);
}

function generateCsrfToken(): string {
  // Simplified CSRF token generation
  const timestamp = Date.now().toString();
  return btoa(timestamp + Math.random().toString()).slice(0, 64);
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

const MYPLAN_COOKIE = `_ga_VQZHV3SH3P=GS2.1.s1746589140$o1$g1$t1746589227$j0$l0$h0; _hjSessionUser_3542396=eyJpZCI6ImNhYzQ2MjlmLTM4YzgtNTY3Ni1iYmIzLTI0NjMxYzdkNmU4YyIsImNyZWF0ZWQiOjE3NDcxOTc3MjU4ODUsImV4aXN0aW5nIjp0cnVlfQ==; _fbp=fb.1.1747197726331.115911875945980748; _ga_0V5LFWD2KQ=GS2.1.s1747935853$o1$g1$t1747936345$j19$l0$h0$dR2YvLwKSS1jCphuMmKjS-bP4T4IWuOGjQA; _ga_YHX5G0W6DX=GS2.1.s1747937532$o2$g0$t1747937532$j0$l0$h0; _ga_K5Q4WV298H=GS2.1.s1747933199$o1$g1$t1747938514$j0$l0$h0; _ga_5NP8JDX6NQ=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dG4XvxCAG0rfpOKPrtoRi1AbSSPVA4UkpLA; _ga_MX29D1QWGH=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dxC1HkbqNja6xDBYDEseQwSEKt83uCm8LWw; _ga_0VMRR09G41=GS2.1.s1748364465$o1$g0$t1748364470$j0$l0$h0; _ga_S51TRWK3R8=GS2.1.s1750134110$o4$g0$t1750134111$j59$l0$h0; ps_rvm_ZkiN=%7B%22pssid%22%3A%2238Y0jAzv3GjOFtQ7-1750107949183%22%2C%22last-visit%22%3A%221750134111689%22%7D; _ga=GA1.1.107335358.1742470468; _uetvid=c9d07890307d11f0b754537bf5d08d37|kj0mft|1748066424492|2|1|bat.bing.com/p/insights/c/j; _ga_MBEGNXVCWH=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h72956306; _ga_YJ09SKYQ9C=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h0; _ga_WGSVEGE14H=GS2.1.s1750707773$o11$g1$t1750707795$j38$l0$h0; _ga_B3VH61T4DT=GS2.1.s1750711023$o40$g0$t1750711023$j60$l0$h0; _clck=ghtic3%7C2%7Cfx9%7C0%7C2009; _ga_29JYF25HLW=GS2.1.s1751472063$o2$g1$t1751472878$j60$l0$h1135471766; fs_uid=#o-1V47MT-na1#0d1e305f-fceb-4356-a2f3-2a575a93a39d:00a92d97-a482-4617-8a9c-61f71a39812c:1753945821112::1#efac8273#/1775255924; _ga_BFQJ094C4L=GS2.1.s1754551810$o9$g0$t1754551810$j60$l0$h0; sessionId=458bc690f1e39c9047f8bfe6b10e83c5078c594486e5ecf6cce59c9867e6453f; _ga_TNNYEHDN9L=GS2.1.s1755648147$o51$g1$t1755648171$j36$l0$h0`
const MYPLAN_CSRF_TOKEN = `e1902bf7b723dd19d4219e72de34cf34affa8ccfeb7f66a669789f0c7b639de727d583fc5042ff67eea91f5ba8b969507b6c02d0f1239b2070439315ce58fb264a673b52de3a4804eb62983d1b2c71c4e946b0975ed5308ec5edb03e582bbf4e61cdd132538975e02ec66797b872ae6f8b22a4063c033c6b9402e407ed40b1d2`

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
    } catch (error) {
      console.error(`Error making request to MyPlan API: ${error}`);
      return {};
    }
  },
});


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

export const getCourseDetailCronJobs = query({
  args: {
    intervalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("myplanDetailCronJobs").withIndex("by_interval_seconds", (q) => q.eq("intervalSeconds", args.intervalSeconds)).collect();
  }
})

export const courseDetailCronJob5m = internalAction({
  args: {},
  handler: async (ctx) => {
    const courseCodes = await ctx.runQuery(api.myplanScrapers.getCourseDetailCronJobs, {
      intervalSeconds: 300,
    });
    for (const courseCode of courseCodes) {
      await ctx.runAction(api.myplanScrapers.scrapeCourseDetail, {
        courseCode: courseCode.courseCode,
      });
    }
  }
})

export const courseDetailCronJob1m = internalAction({
  args: {},
  handler: async (ctx) => {
    const courseCodes = await ctx.runQuery(api.myplanScrapers.getCourseDetailCronJobs, {
      intervalSeconds: 60,
    });
    for (const courseCode of courseCodes) {
      await ctx.runAction(api.myplanScrapers.scrapeCourseDetail, {
        courseCode: courseCode.courseCode,
      });
    }
  }
})

export const courseDetailCronJob10m = internalAction({
  args: {},
  handler: async (ctx) => {
    const courseCodes = await ctx.runQuery(api.myplanScrapers.getCourseDetailCronJobs, {
      intervalSeconds: 10 * 60,
    });
    for (const courseCode of courseCodes) {
      await ctx.runAction(api.myplanScrapers.scrapeCourseDetail, {
        courseCode: courseCode.courseCode,
      });
    }
  }
})

export const courseDetailCronJob15m = internalAction({
  args: {},
  handler: async (ctx) => {
    const courseCodes = await ctx.runQuery(api.myplanScrapers.getCourseDetailCronJobs, {
      intervalSeconds: 15 * 60,
    });
    for (const courseCode of courseCodes) {
      await ctx.runAction(api.myplanScrapers.scrapeCourseDetail, {
        courseCode: courseCode.courseCode,
      });
    }
  }
})