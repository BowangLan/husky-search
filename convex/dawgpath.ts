import { v } from "convex/values";
import { action, query } from "./_generated/server";

const COOKIE = "_ga_VQZHV3SH3P=GS2.1.s1746589140$o1$g1$t1746589227$j0$l0$h0; _hjSessionUser_3542396=eyJpZCI6ImNhYzQ2MjlmLTM4YzgtNTY3Ni1iYmIzLTI0NjMxYzdkNmU4YyIsImNyZWF0ZWQiOjE3NDcxOTc3MjU4ODUsImV4aXN0aW5nIjp0cnVlfQ==; _fbp=fb.1.1747197726331.115911875945980748; _ga_0V5LFWD2KQ=GS2.1.s1747935853$o1$g1$t1747936345$j19$l0$h0$dR2YvLwKSS1jCphuMmKjS-bP4T4IWuOGjQA; _ga_YHX5G0W6DX=GS2.1.s1747937532$o2$g0$t1747937532$j0$l0$h0; _ga_K5Q4WV298H=GS2.1.s1747933199$o1$g1$t1747938514$j0$l0$h0; _ga_5NP8JDX6NQ=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dG4XvxCAG0rfpOKPrtoRi1AbSSPVA4UkpLA; _ga_MX29D1QWGH=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dxC1HkbqNja6xDBYDEseQwSEKt83uCm8LWw; _ga_0VMRR09G41=GS2.1.s1748364465$o1$g0$t1748364470$j0$l0$h0; _ga_S51TRWK3R8=GS2.1.s1750134110$o4$g0$t1750134111$j59$l0$h0; ps_rvm_ZkiN=%7B%22pssid%22%3A%2238Y0jAzv3GjOFtQ7-1750107949183%22%2C%22last-visit%22%3A%221750134111689%22%7D; _ga=GA1.1.107335358.1742470468; _uetvid=c9d07890307d11f0b754537bf5d08d37|kj0mft|1748066424492|2|1|bat.bing.com/p/insights/c/j; _ga_MBEGNXVCWH=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h72956306; _ga_YJ09SKYQ9C=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h0; _ga_WGSVEGE14H=GS2.1.s1750707773$o11$g1$t1750707795$j38$l0$h0; _ga_B3VH61T4DT=GS2.1.s1750711023$o40$g0$t1750711023$j60$l0$h0; _clck=ghtic3%7C2%7Cfx9%7C0%7C2009; _ga_29JYF25HLW=GS2.1.s1751472063$o2$g1$t1751472878$j60$l0$h1135471766; fs_uid=#o-1V47MT-na1#0d1e305f-fceb-4356-a2f3-2a575a93a39d:00a92d97-a482-4617-8a9c-61f71a39812c:1753945821112::1#efac8273#/1775255924; csrftoken=OG7VW5ylkViYImsDpZC5QebxfdtWyXgX; sessionid=jtm900wbzt9714e5ori3hkcmhui3cybw; _ga_TNNYEHDN9L=GS2.1.s1755648147$o51$g1$t1755648208$j60$l0$h0; _ga_BFQJ094C4L=GS2.1.s1755649127$o10$g0$t1755649133$j54$l0$h0"

const headers = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
  "priority": "u=1, i",
  "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"macOS\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "cookie": COOKIE,
  "Referer": `https://dawgpath.uw.edu/`
}

export const scrapeCourseDetail = action({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
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

export const scrapeSubjectCoi = action({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
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

export const scrapeSubjectPrereqs = action({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`https://dawgpath.uw.edu/api/v1/curric_prereq/${args.subjectCode}`, {
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

export const scrapeAllSubjectCoi = action({
  args: {},
  handler: async (ctx) => {
    const response = await fetch("https://dawgpath.uw.edu/api/v1/coi/curric/", {
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
