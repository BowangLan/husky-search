export {};

const cookie = process.argv[2];

if (!cookie) {
  console.error("Usage: bun scripts/test-cookie.ts <cookie>");
  process.exit(1);
}

const response = await fetch(
  "https://course-app-api.planning.sis.uw.edu/api/courses/AFRAM%20272/details?courseId=5090537b-acfa-4e14-a371-262fc4b04315",
  {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-sis-api-checksum": "2d88b810e05b04582d066748465520a15a84e7bc",
      cookie,
      Referer: "https://myplan.uw.edu/",
    },
    method: "GET",
  }
);

console.log("Status:", response.status, response.statusText);
console.log("Headers:", Object.fromEntries(response.headers.entries()));

const text = await response.text();
try {
  const json = JSON.parse(text);
  console.log("Response:", JSON.stringify(json, null, 2));
} catch {
  console.log("Response (text):", text);
}
