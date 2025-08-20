import { v } from "convex/values";
import { action } from "./_generated/server";

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

// Constants
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CEC_COOKIE = `nmstat=5347ae69-fc39-017d-5be1-c747cc5c798b; _fbp=fb.1.1742492410804.25217141481684384; cebs=1; _mkto_trk=id:131-AQO-225&token:_mch-washington.edu-3dbd83a75f74029c461961c07ab6a7fa; _clck=57sla2%7C2%7Cfvq%7C0%7C1954; __utmc=80390417; _ga_6PNRL82PD4=GS2.1.s1748575255$o1$g1$t1748575287$j28$l0$h0; _ga_VLXYEPDF94=GS2.1.s1748575255$o1$g1$t1748575287$j28$l0$h0; _ga_4DEGMHTN3T=GS2.2.s1749780628$o5$g0$t1749780628$j60$l0$h0; _ga_ZSJL1C6YJ5=GS2.1.s1750584497$o1$g0$t1750584501$j56$l0$h0; _gcl_au=1.1.642359019.1750637329; _ga_25XGC4P1F5=GS2.2.s1750704337$o3$g0$t1750704337$j60$l0$h0; _ga_C854SEMWV6=GS2.2.s1750891748$o3$g1$t1750891771$j37$l0$h0; _ga_XSBFHD17M5=GS2.1.s1751471957$o1$g1$t1751471990$j27$l0$h0; _ga_CPBMNL5L6C=GS2.1.s1751500452$o4$g0$t1751500453$j59$l0$h0; _ga_67C94ZRNEY=GS2.1.s1753207920$o7$g0$t1753207920$j60$l0$h0; _ga_3L5RZ9EB10=GS2.1.s1753945806$o6$g1$t1753945991$j45$l0$h0; ps_rvm_fZxi=%7B%22pssid%22%3A%22DU4JbhiivBL6N5Hg-1753945985783%22%2C%22opening-catcher%22%3A1752785267093%2C%22last-visit%22%3A%221753945991610%22%7D; _hjSessionUser_5349179=eyJpZCI6ImI5Y2FhNzM5LWJiODctNWIxNi1hYWRmLTkwY2Q2NjIwYWRlNyIsImNyZWF0ZWQiOjE3NTM5OTE3NDU4ODksImV4aXN0aW5nIjpmYWxzZX0=; _ga_57P4HTBKTG=GS2.1.s1753991736$o1$g1$t1753991755$j41$l0$h0; __utmz=80390417.1754257279.5.4.utmcsr=bing|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); __utma=80390417.1069828593.1742492411.1754257279.1754289666.6; _ga_HZC6629TRG=GS2.2.s1754530407$o3$g0$t1754530407$j60$l0$h0; cebsp_=23; _ce.s=v~c202540d6dd15891cb1935165499071cb28b967d~lcw~1754530407616~vir~new~lva~1754530407458~vpv~0~v11.fhb~1746679454978~v11.lhb~1746720818846~v11ls~8470a4f0-732e-11f0-ba86-ef66015df776~v11.cs~458693~v11.s~8470a4f0-732e-11f0-ba86-ef66015df776~v11.vs~c202540d6dd15891cb1935165499071cb28b967d~v11.fsvd~eyJ1cmwiOiJ3YXNoaW5ndG9uLmVkdS9hc3Nlc3NtZW50L2NvdXJzZS1ldmFsdWF0aW9ucy9jZWMiLCJyZWYiOiJodHRwczovL3d3dy5iaW5nLmNvbS8iLCJ1dG0iOltdfQ%3D%3D~v11.sla~1754530407615~v11.wss~1754530407616~v11slnt~1754530407616~lcw~1754530407617; _ga_3T65WK0BM8=GS2.1.s1754530407$o18$g0$t1754530415$j52$l0$h0; _ga_JLHM9WH4JV=GS2.1.s1754530407$o18$g0$t1754530416$j51$l0$h0; _ga_SHNBKYT066=GS2.1.s1754589704$o14$g0$t1754589706$j58$l0$h0; _ga_DCJXF1RLXE=GS2.1.s1754589704$o2$g0$t1754589706$j58$l0$h0; _shibsession_64656661756c7468747470733a2f2f7777772e77617368696e67746f6e2e6564752f73686962626f6c657468=_33c9237eb2c98a2031f3e18a91967303; _ga=GA1.2.1069828593.1742492411; _gid=GA1.2.195920965.1755648915; _gat=1; _affinity=w13|aKUTn; _ga_E1YV43XFCK=GS2.2.s1755648921$o11$g0$t1755648921$j60$l0$h0`;

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

// Convex action to get letter courses
export const getLetterCourses = action({
  args: {
    letter: v.string(),
  },
  handler: async (ctx, args): Promise<string[]> => {
    const letter = args.letter.toLowerCase();
    const url = `https://www.washington.edu/cec/${letter}-toc.html`;

    try {
      const response = await fetch(url, {
        headers: getCecHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      const doc = parseHTML(htmlContent);

      // Extract all href attributes from anchor tags
      const linkElements = doc.querySelectorAll('a[href]') as { getAttribute: (attr: string) => string | null; }[];
      const links = linkElements
        .map(a => a.getAttribute('href'))
        .filter((href): href is string => href !== null && href.startsWith(`${letter}/`));

      return links;
    } catch (error) {
      console.error(`Error fetching letter courses for ${letter}:`, error);
      return [];
    }
  },
});

// Helper function to get letter courses (internal)
async function getLetterCoursesInternal(letter: string): Promise<string[]> {
  const lowerLetter = letter.toLowerCase();
  const url = `https://www.washington.edu/cec/${lowerLetter}-toc.html`;

  try {
    const response = await fetch(url, {
      headers: getCecHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const htmlContent = await response.text();
    const doc = parseHTML(htmlContent);

    // Extract all href attributes from anchor tags
    const linkElements = doc.querySelectorAll('a[href]') as { getAttribute: (attr: string) => string | null; }[];
    const links = linkElements
      .map(a => a.getAttribute('href'))
      .filter((href): href is string => href !== null && href.startsWith(`${lowerLetter}/`));

    return links;
  } catch (error) {
    console.error(`Error fetching letter courses for ${letter}:`, error);
    return [];
  }
}

// Convex action to get all letter courses
export const getAllLetterCourses = action({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const results: string[] = [];

    // Process letters in batches
    for (let i = 0; i < LETTERS.length; i += 10) {
      const batch = LETTERS.slice(i, i + 10);
      const batchPromises = batch.split('').map(letter =>
        getLetterCoursesInternal(letter)
      );

      const batchResults = await Promise.all(batchPromises);
      for (const courses of batchResults) {
        results.push(...courses);
      }
    }

    return results;
  },
});

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
export const getCourseCecDetail = action({
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

// Helper function to get course CEC detail (internal)
async function getCourseCecDetailInternal(url: string): Promise<CecCourseData | null> {
  const fullUrl = `https://www.washington.edu/cec/${url}`;

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
    console.error(`Error fetching course CEC detail for ${url}:`, error);
    return null;
  }
}

// Convex action to process courses in batches
export const processCoursesBatch = action({
  args: {
    courses: v.array(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CecCourseItem[]> => {
    const batchSize = args.batchSize || 25;
    const results: CecCourseItem[] = [];

    for (let i = 0; i < args.courses.length; i += batchSize) {
      const batch = args.courses.slice(i, i + batchSize);
      const batchPromises = batch.map(async (course) => {
        const data = await getCourseCecDetailInternal(course);
        if (data) {
          return {
            courseUrl: course,
            data,
          };
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter((item): item is CecCourseItem => item !== null);
      results.push(...validResults);

      console.log(`Processed batch ${i / batchSize + 1}: ${validResults.length} courses`);
    }

    return results;
  },
});

// Convex action to scrape all CEC courses
export const scrapeAllCecCourses = action({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ totalProcessed: number; courses: CecCourseItem[] }> => {
    console.log("Starting CEC course scraping...");

    // Get all letter courses using internal helper
    const results: string[] = [];
    for (let i = 0; i < LETTERS.length; i += 10) {
      const batch = LETTERS.slice(i, i + 10);
      const batchPromises = batch.split('').map(letter =>
        getLetterCoursesInternal(letter)
      );

      const batchResults = await Promise.all(batchPromises);
      for (const courses of batchResults) {
        results.push(...courses);
      }
    }

    console.log(`Found ${results.length} courses in total`);

    // Process courses in batches
    const batchSize = args.batchSize || 25;
    const processedCourses: CecCourseItem[] = [];

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const batchPromises = batch.map(async (course) => {
        const data = await getCourseCecDetailInternal(course);
        if (data) {
          return {
            courseUrl: course,
            data,
          };
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter((item): item is CecCourseItem => item !== null);
      processedCourses.push(...validResults);

      console.log(`Processed batch ${i / batchSize + 1}: ${validResults.length} courses`);
    }

    console.log(`Total processed: ${processedCourses.length} courses`);

    return {
      totalProcessed: processedCourses.length,
      courses: processedCourses,
    };
  },
});

// Convex action to test single course extraction
export const testExtractCourseCecData = action({
  args: {
    url: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CecCourseData | null> => {
    const testUrl = args.url || "a/AA310A2971.html";
    const fullUrl = `https://www.washington.edu/cec/${testUrl}`;

    try {
      const response = await fetch(fullUrl, {
        headers: getCecHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      const data = extractCourseCecData(htmlContent);
      console.log("Extracted CEC data:", data);
      return data;
    } catch (error) {
      console.error(`Error testing course CEC extraction:`, error);
      return null;
    }
  },
});

// Note: Database operations would need to be implemented using Convex's database
// This would require setting up proper Convex tables and mutations
// The upload functionality would be implemented as a separate mutation function
