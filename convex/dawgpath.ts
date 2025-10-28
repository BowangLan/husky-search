import { Infer, v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";

export const dawgpathCourseFields = {
  courseCode: v.string(),
  courseName: v.string(),
  courseDescription: v.string(),
  coursePrerequisites: v.optional(v.array(v.string())),
  courseCoi: v.optional(v.array(v.string())),
  detailData: v.optional(v.any()),
  detailDataLastUpdated: v.optional(v.number()),
}


export type DawgpathCourseDetail = {
  coi_data: {
    course_coi: number
    course_level_coi: number
    curric_coi: number
    percent_in_range: number
  }
  concurrent_courses: {
    [key: string]: {
      coi_score: number
      is_bottleneck: boolean
      is_gateway: boolean
      percent: number
      title: string
    }
  }
  course_campus: string
  course_credits: string
  course_description: string
  course_id: string
  course_offered: string
  course_title: string
  department_abbrev: string
  gpa_distro: Array<{
    count: number
    gpa: string
  }>
  is_bottleneck: boolean
  is_gateway: boolean
  prereq_graph: {
    x: {
      edges: {
        from: {
          [key: string]: string
        }
        pr_and_or: {
          [key: string]: string
        }
        pr_concurrency: {
          [key: string]: string
        }
        pr_cr_s: {
          [key: string]: string
        }
        pr_grade_min: {
          [key: string]: string
        }
        pr_group_no: {
          [key: string]: number
        }
        pr_seq_no: {
          [key: string]: number
        }
        to: {
          [key: string]: string
        }
      }
      nodes: {
        "course.level": {
          [key: string]: number
        }
        course_branch: any
        course_cat_omit: {
          [key: string]: boolean
        }
        course_college: {
          [key: string]: string
        }
        course_number: {
          [key: string]: number
        }
        course_title: {
          [key: string]: string
        }
        department_abbrev: {
          [key: string]: string
        }
        diversity_crs: any
        english_comp: any
        indiv_society: any
        natural_world: any
        qsr: any
        vis_lit_perf_arts: any
        writing_crs: any
      }
      options: {
        autoResize: boolean
        edges: {
          arrows: string
          color: string
          smooth: {
            forceDirection: string
            roundness: number
            type: string
          }
        }
        height: string
        interaction: {
          dragNodes: boolean
        }
        layout: {
          hierarchical: {
            blockShifting: boolean
            direction: string
            edgeMinimization: boolean
            nodeSpacing: number
            sortMethod: string
          }
        }
        nodes: {
          borderWidth: number
          borderWidthSelected: number
          color: {
            background: string
            border: string
            highlight: {
              background: string
              border: string
            }
          }
          shape: string
        }
        physics: boolean
      }
    }
  }
  prereq_string: string
}


export const dawgpathCourseObj = v.object(dawgpathCourseFields);
export type DawgpathCourse = Infer<typeof dawgpathCourseObj>;

export const getAllSubjects = query({
  handler: async (ctx) => {
    return await ctx.db.query("dawgpathSubjects").collect();
  }
})

export const listCourseCodes = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db.query("dawgpathCourses").paginate({
      numItems: args.limit ?? 100,
      cursor: args.cursor ?? null,
    });


    return {
      data: data.page.map((item) => item.courseCode),
      continueCursor: data.continueCursor,
      isDone: data.isDone,
    };
  }
})

export const upsertCourses = internalMutation({
  args: {
    courses: v.array(v.object(dawgpathCourseFields)),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.courses.map(async (course) => {
      const c = await ctx.db.query("dawgpathCourses").withIndex("by_course_code", (q) => q.eq("courseCode", course.courseCode)).first();
      if (c) {
        await ctx.db.patch(c._id, course);
      } else {
        await ctx.db.insert("dawgpathCourses", course);
      }
    }));
    return {
      success: true,
    };
  }
})

export const upsertSubjects = internalMutation({
  args: {
    subjects: v.array(v.object({
      subjectCode: v.string(),
      name: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.subjects.map(async (subject) => {
      const s = await ctx.db.query("dawgpathSubjects").withIndex("by_subject_code", (q) => q.eq("subjectCode", subject.subjectCode)).first();
      if (s) {
        await ctx.db.patch(s._id, {
          name: subject.name,
          subjectCode: subject.subjectCode,
        });
      } else {
        await ctx.db.insert("dawgpathSubjects", {
          name: subject.name,
          subjectCode: subject.subjectCode,
        });
      }
    }));
  }
})

export const upsertCourseDetail = internalMutation({
  args: {
    courseCode: v.string(),
    detailData: v.any(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.query("dawgpathCourses").withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode)).first();
    if (c) {
      await ctx.db.patch(c._id, {
        detailData: args.detailData,
        detailDataLastUpdated: Date.now(),
      });
    }
    return {
      success: true,
    };
  }
})

export const getSubjectByCode = query({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("dawgpathSubjects").withIndex("by_subject_code", (q) => q.eq("subjectCode", args.subjectCode)).first();
  }
})