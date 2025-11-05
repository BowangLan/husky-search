import { Icons } from "@/components/icons";
import { Calendar, Home, Layers, LucideIcon, Network } from "lucide-react";

export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Husky Search",
  description:
    "Discover and explore University of Washington courses with detailed information about credits, prerequisites, enrollment data, and course content. Find your perfect UW courses and academic programs.",
  mainNav: [
    {
      title: "Courses",
      href: "/",
      IconComp: Icons.course
    },
    {
      title: "Majors",
      href: "/majors",
      IconComp: Icons.subjectArea
    },
    {
      title: "Schedule",
      href: "/schedule",
      IconComp: Calendar
    },
    {
      title: "Prereq Graph",
      href: "/prereq-graph",
      IconComp: Icons.graph
    }
    // {
    //   title: "Plan",
    //   href: "/plan",
    // },
    // {
    //   title: "About",
    //   href: "/about",
    // },
  ] as Array<{
    title: string
    href: string
    IconComp: LucideIcon
  }>,
  // links: {
  //   twitter: "https://twitter.com/uw",
  //   github: "https://github.com/uw",
  //   docs: "https://www.washington.edu/",
  // },
}

export const externalLinks = {
  feedback: "https://forms.gle/BDNCjDo3mCEfA5wz7",
}

export const EASIEST_COURSES_LIMIT = 20;
export const TOUGHEST_COURSES_LIMIT = 20;

export const STATIC_ASSETS = {
  ALL_COURSE_CODES: "course_codes.json",
  ALL_SUBJECT_AREAS: "subject_areas.json",
};

export const DOMAIN = "huskysearch.fyi";