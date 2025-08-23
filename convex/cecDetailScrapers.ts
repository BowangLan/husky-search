import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { LETTERS, CEC_COOKIE } from "./constants";

// TypeScript interfaces for CEC data types
export interface CecCourseData {
  caption: {
    text: string | null;
    surveyed: string | null;
    enrolled: string | null;
  };
  headers: string[];
  table_data_list_of_lists: string[][];
  table_data_list_of_dicts: Record<string, string>[];
  h1: string | null;
  h2: string | null;
}

export interface CecCourseItem {
  courseUrl: string;
  data: CecCourseData;
}

// Helper function to parse HTML using simple regex patterns
// Note: This is a simplified HTML parser for specific CEC page structure
function parseHTML(htmlContent: string) {
  return {
    querySelector: (selector: string) => {
      if (selector === 'caption') {
        const captionMatch = htmlContent.match(/<caption[^>]*>(.*?)<\/caption>/is);
        return captionMatch ? { textContent: captionMatch[1] } : null;
      }
      if (selector === 'h1') {
        const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/is);
        return h1Match ? { textContent: h1Match[1] } : null;
      }
      if (selector === 'h2') {
        const h2Match = htmlContent.match(/<h2[^>]*>(.*?)<\/h2>/is);
        return h2Match ? { textContent: h2Match[1] } : null;
      }
      return null;
    },
    querySelectorAll: (selector: string) => {
      if (selector === 'a[href]') {
        const linkMatches = htmlContent.matchAll(/<a[^>]*href=["']([^"']*?)["'][^>]*>/gi);
        return Array.from(linkMatches).map(match => ({
          getAttribute: (attr: string) => attr === 'href' ? match[1] : null
        }));
      }
      if (selector === 'th') {
        const thMatches = htmlContent.matchAll(/<th[^>]*>(.*?)<\/th>/gis);
        return Array.from(thMatches).map(match => ({
          textContent: match[1].replace(/<[^>]*>/g, '').trim()
        }));
      }
      if (selector === 'tr') {
        const trMatches = htmlContent.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis);
        return Array.from(trMatches).map(match => ({
          querySelectorAll: (selector: string) => {
            if (selector === 'td') {
              const tdMatches = match[1].matchAll(/<td[^>]*>(.*?)<\/td>/gis);
              return Array.from(tdMatches).map(tdMatch => ({
                textContent: tdMatch[1].replace(/<[^>]*>/g, '').trim()
              }));
            }
            return [];
          }
        }));
      }
      return [];
    }
  };
}

// Helper function to extract text content safely
function getTextContent(element: { textContent?: string } | null): string {
  return element?.textContent?.trim().replace(/\xa0/g, ' ') || '';
}

// Helper function to get headers from the CEC cookie
function getCecHeaders() {
  return {
    "Cookie": CEC_COOKIE,
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  };
}


// Function to extract course CEC data from HTML
function extractCourseCecData(htmlContent: string): CecCourseData {
  const doc = parseHTML(htmlContent);

  // Extract caption data
  const captionElement = doc.querySelector('caption');
  let captionText: string | null = null;
  let surveyed: string | null = null;
  let enrolled: string | null = null;

  if (captionElement) {
    captionText = getTextContent(captionElement);
    const captionTextContent = captionElement.textContent || '';
    const quoteParts = captionTextContent.split('"');
    surveyed = quoteParts.length > 1 ? quoteParts[1] : null;
    enrolled = quoteParts.length > 3 ? quoteParts[3] : null;
  }

  // Extract headers
  const headerElements = doc.querySelectorAll('th') as { textContent: string }[];
  const headers = headerElements.map(th => getTextContent(th));

  // Extract table data
  const tableDataListOfLists: string[][] = [];
  const rowElements = doc.querySelectorAll('tr') as { querySelectorAll: (selector: string) => { textContent: string }[] }[];
  const rows = rowElements.slice(1); // Skip header row

  for (const row of rows) {
    const cellElements = row.querySelectorAll('td');
    const rowData = cellElements.map(td => getTextContent(td));
    tableDataListOfLists.push(rowData);
  }

  // Create list of dictionaries
  const tableDataListOfDicts: Record<string, string>[] = [];
  if (headers.length > 0 && tableDataListOfLists.length > 0) {
    for (const row of tableDataListOfLists) {
      const rowDict: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        if (i < row.length) {
          rowDict[headers[i]] = row[i];
        }
      }
      tableDataListOfDicts.push(rowDict);
    }
  }

  // Extract h1 and h2
  const h1Element = doc.querySelector('h1');
  const h1 = h1Element ? getTextContent(h1Element) : null;

  const h2Element = doc.querySelector('h2');
  const h2 = h2Element ? getTextContent(h2Element) : null;

  return {
    caption: {
      text: captionText,
      surveyed,
      enrolled,
    },
    headers,
    table_data_list_of_lists: tableDataListOfLists,
    table_data_list_of_dicts: tableDataListOfDicts,
    h1,
    h2,
  };
}

// Convex action to get course CEC detail
export const scrapeCourseCecDetail = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<CecCourseData | null> => {
    const fullUrl = `https://www.washington.edu/cec/${args.url}`;

    try {
      const response = await fetch(fullUrl, {
        headers: getCecHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      return extractCourseCecData(htmlContent);
    } catch (error) {
      console.error(`Error fetching course CEC detail for ${args.url}:`, error);
      return null;
    }
  },
});

export const scrapeAndSaveCourseDetail = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runAction(api.cecDetailScrapers.scrapeCourseCecDetail, {
      url: args.url,
    });
    await ctx.runMutation(api.cec.updateCourseDataByUrl, {
      url: args.url,
      data,
    });
    return "done"
  },
});

export const scrapeAndSaveByLetter = action({
  args: {
    letters: v.string(),
  },
  handler: async (ctx, args) => {
    const letters = Array.from(new Set(args.letters.split("")));
    const coursesList = await Promise.all(letters.map(async (letter) => {
      return await ctx.runQuery(api.cec.getCoursesByLetter, {
        letter,
      });
    }));
    const courses = coursesList.flat();

    console.log(`Found ${courses.length} courses for ${letters.join(", ")}`);

    const batchSize = 10;
    for (let i = 0; i < courses.length; i += batchSize) {
      console.log(`Scraping batch ${i / batchSize + 1} of ${Math.ceil(courses.length / batchSize)}`);
      const batch = courses.slice(i, i + batchSize);
      const data = await Promise.all(batch.map(async (course) => {
        const data = await ctx.runAction(api.cecDetailScrapers.scrapeCourseCecDetail, {
          url: course.url,
        });
        return {
          url: course.url,
          data,
        }
      }));

      await ctx.runMutation(api.cec.updateCourseDataByUrlBatch, {
        data,
      });
    }

    return "done";
  },
});


export const scrapeAndSaveAll = action({
  args: {},
  handler: async (ctx) => {
    let i = 0;
    for (const letter of LETTERS) {
      console.log(`Scheduling scrapeAndSaveCourseDetailForLetter for ${letter}`);
      // run after 1 minute, 2 minutes, 3 minutes, etc.
      await ctx.scheduler.runAfter(1000 * i * 60, api.cecDetailScrapers.scrapeAndSaveByLetter, {
        letters: letter,
      });
      i++;
    }

    return "done";
  },
});

export const scrapeAndSaveAllNullCourses = action({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.runQuery(api.cec.getCoursesWithNullData);

    console.log(`Found ${courses.length} courses with null data`);

    const batchSize = 10;
    for (let i = 0; i < courses.length; i += batchSize) {
      console.log(`Scraping batch ${i / batchSize + 1} of ${Math.ceil(courses.length / batchSize)}`);
      const batch = courses.slice(i, i + batchSize);
      const data = await Promise.all(batch.map(async (course) => {
        const data = await ctx.runAction(api.cecDetailScrapers.scrapeCourseCecDetail, {
          url: course.url,
        });
        return {
          url: course.url,
          data,
        }
      }));

      await ctx.runMutation(api.cec.updateCourseDataByUrlBatch, {
        data,
      });
    }

    return "done";
  },
});

