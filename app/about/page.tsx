import ReactMarkdown from "react-markdown"

import { Page, PageTitle } from "@/components/page-wrapper"

const AboutText = `
I often found myself frustrated by the tedious process of planning courses in MyPlan. Sometimes, I simply wanted to quickly search for a course or explore a major, but getting to that information required at least 10 clicks – logging in, navigating to the search page, selecting campus, and more.

Experiencing this consistent inefficiency led me to build this website. My goal was to create a tool that makes searching for UW courses and majors significantly easier and more direct, eliminating the unnecessary steps I encountered myself. This project is my effort to streamline that experience for all UW students.

I'm graduating this year, so this project is also a gift from me to future huskies and the UW community as a whole. I'm planning to keep this project alive and updated for years to come. 

Main data sources for this project:

- [UW Course Catalog](https://www.washington.edu/students/crscat/)
- [MyPlan](https://myplan.uw.edu/)
- [DawgPath](https://dawgpath.uw.edu/)
- [UW Course Evaluation Catalog](https://www.washington.edu/students/crscat/)


My vision for this tool is to offer a way to search courses that is truly *intuitive*, *human-centered*, and *blazingly-fast*. I want this to be the go-to place for UW students to quickly and effectively discover the courses and academic paths that best fit their goals, without any unnecessary friction.

Feel free to reach out:

- [jeffreybl.dev@gmail.com](mailto:jeffreybl.dev@gmail.com)

I'm always open to feedback and suggestions for improvement. Whether you've found a bug, have a feature request, or just want to share your thoughts, I'd love to hear from you. Your input helps make this tool better for everyone.
`

export default function AboutPage() {
  return (
    <Page className="max-w-screen-md mx-auto px-page">
      <div className="py-12">
        <PageTitle>About</PageTitle>
      </div>
      <div className="prose prose-sm text-base font-normal leading-relaxed space-y-4 markdown">
        <ReactMarkdown>{AboutText}</ReactMarkdown>
      </div>
    </Page>
  )
}
