import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { LETTERS, CEC_COOKIE } from "./constants";
import { transformCourseData } from "./cec";

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

// Helper function to get headers from the CEC cookie
function getCecHeaders() {
  return {
    "Cookie": CEC_COOKIE,
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  };
}

// Convex action to get letter courses
export const scrapeByLetter = action({
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

export const scrapeAndSaveByLetter = action({
  args: {
    letter: v.string(),
  },
  handler: async (ctx, args) => {
    const courses = await ctx.runAction(api.cecIndexScrapers.scrapeByLetter, {
      letter: args.letter,
    });

    console.log(`Found ${courses.length} courses for ${args.letter}`);

    const batchSize = 1000;
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);
      console.log(`Creating ${batch.length} courses for ${args.letter}`);
      await ctx.runMutation(api.cec.createCourses, {
        courses: batch.map(course => ({
          url: course,
          letter: args.letter,
          data: null,
        })),
      });
    }

    return "done"
  },
});


// Convex action to get all letter courses
export const scrapeAndSaveAll = action({
  args: {},
  handler: async (ctx) => {
    await Promise.all(LETTERS.split('').map(letter =>
      ctx.runAction(api.cecIndexScrapers.scrapeAndSaveByLetter, {
        letter,
      })
    ));

    return "done";
  },
});
