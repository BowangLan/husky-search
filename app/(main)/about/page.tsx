import ReactMarkdown from "react-markdown"

import { DOMAIN } from "@/config/site"
import { Page, PageTitle } from "@/components/page-wrapper"

const AboutText = `
## About Me

Hello, I'm Jeffrey, a fellow husky, alum, and a web enthusiast. Welcome to ${DOMAIN}! 

## About this Project

Ever since my sophomore year, I've been frustrated by how tedious it is to use MyPlan for something as simple as searching for a course or exploring a major. What should've been quick and easy often took 10 clicks—logging in, finding the right page, setting filters—just to get to the information I needed.

Over the years, MyPlan has added useful features like Schedule Builder and a better interface, but the core problem remained: it takes too much work. Most students I’ve talked to have the same experience—keeping 10+ browser tabs open at once during registration, bouncing between pages, and wasting time and mental energy.

As someone who cares deeply about building great web experiences, I wanted to fix that. This project was born out of that frustration. It’s designed to strip away the extra steps and make searching for UW courses and majors fast, intuitive, and human-centered.

I’m graduating in 2025, and I see this project as a small gift to the Husky community. My goal is to keep it alive and improving for future students—so that course planning can feel less like a chore and more like an opportunity to discover the path that’s right for you.

## Links

Main data sources for this project:

- [UW Course Catalog](https://www.washington.edu/students/crscat/)
- [MyPlan](https://myplan.uw.edu/)
- [DawgPath](https://dawgpath.uw.edu/)
- [UW Course Evaluation Catalog](https://www.washington.edu/students/crscat/)

Feel free to reach out:

- [jeffreybl.dev@gmail.com](mailto:jeffreybl.dev@gmail.com)
- [My LinkedIn](https://www.linkedin.com/in/jeffrey-lan/)

I'm always open to feedback and suggestions for improvement. Whether you've found a bug, have a feature request, or just want to share your thoughts, I'd love to hear from you!
`

export default function AboutPage() {
  return (
    <Page className="max-w-screen-md mx-auto px-page">
      {/* <div className="py-12">
        <PageTitle>About</PageTitle>
      </div> */}
      <div className="prose prose-sm text-base font-normal leading-relaxed space-y-4 markdown">
        <ReactMarkdown>{AboutText}</ReactMarkdown>
      </div>
    </Page>
  )
}
