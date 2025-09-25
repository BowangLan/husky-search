# UW Course Catalog Integration Scripts

This document describes the complete workflow for integrating UW course catalog data with your existing MyPlan course database.

## Overview

The integration process consists of several scripts that work together to:

1. Scrape all courses from the UW course catalog
2. Transform the data to match your Convex schema
3. Import only new courses (avoiding duplicates)
4. Set up courses for detailed MyPlan data enrichment

## Scripts and Commands

> **Note**: For database maintenance and export operations, see [Course DevOps Documentation](./COURSE_DEVOPS.md)

### 1. Scrape All UW Course Catalog Data

**Purpose**: Scrape all courses from the official UW course catalog website.

**Script**: `scripts/courses/scrape_all_uw_courses.py`

```bash
# Run full scrape (saves to temp/all_uw_courses.json)
uv run python -m scripts.courses.scrape_all_uw_courses

# Test with single department first (uncomment test_single_department in script)
uv run python -m scripts.courses.scrape_all_uw_courses
```

**Output**: `temp/all_uw_courses.json` with structure:

```json
{
  "courses": [
    {
      "uwCourseCode": "INFO200",
      "myplanCode": "EDSPE601",
      "myplanUrl": "https://myplan.uw.edu/course/#/courses/EDSPE601",
      "title": "Course Title (5)",
      "description": "Course description...",
      "credits": "5",
      "quarters": "AW",
      "subject": "INFO",
      "number": "200"
    }
  ],
  "total_count": 15234,
  "scraped_at": "2025-01-21 10:30:45"
}
```

---

### 3. Transform Courses for Convex Import

**Purpose**: Transform scraped course data to match myplanCourses schema and exclude existing courses.

**Script**: `scripts/courses/transform_courses_for_convex.py`

```bash
# Normal run (uses cache if available)
uv run python -m scripts.courses.transform_courses_for_convex

# Force refresh cache from Convex
uv run python -m scripts.courses.transform_courses_for_convex --refresh-cache

# Skip cache completely (always fetch fresh)
uv run python -m scripts.courses.transform_courses_for_convex --no-cache
```

**Key Features**:

- **Course Code Formatting**: `"EDSPE601"` → `"EDSPE 601"` (adds space)
- **Duplicate Prevention**: Fetches existing course codes and excludes them
- **Caching**: Caches Convex course codes for faster subsequent runs
- **Schema Compliance**: Ensures all required fields are populated

**Output**: `temp/convex_courses.json` - Array of course objects ready for Convex import

---

### 4. Import Courses into Convex

**Purpose**: Import the transformed courses into your Convex myplanCourses table.

**Script**: `convex/catelogCourseScrapers.ts`

```javascript
// In Convex dashboard or via API
await ctx.runAction(api.catelogCourseScrapers.importCatalogCoursesFromLocal, {
  jsonData: `${JSON.stringify(courseData)}`, // Copy content from temp/convex_courses.json
  batchSize: 100, // optional
})
```

**Alternative**: Use the Convex CLI or dashboard to run the import action with your JSON data.

---

### 5. Enrich Courses with MyPlan Details (Optional)

**Purpose**: For catalog-only courses, scrape detailed MyPlan data and fill complete course information.

**Script**: `convex/myplanScrapers.ts`

```javascript
// Get courses needing detail scraping (those with non-null URLs)
await ctx.runQuery(api.myplanScrapers.getCoursesNeedingDetailScraping, {})

// Schedule detail enrichment for all catalog courses
await ctx.runAction(
  internal.myplanScrapers.enrichCatalogCoursesWithMyPlanDetails,
  {
    batchSize: 5, // optional
    batchDelay: 2000, // optional (ms)
  }
)
```

---

## Complete Workflow

### Step-by-Step Process:

1. **Scrape UW course catalog**
2. **Transform for Convex import**
3. **Import into Convex**: Use the Convex dashboard/CLI with the import action


```bash
uv run python -m scripts.courses.scrape_all_uw_courses
uv run python -m scripts.courses.transform_courses_for_convex
bunx convex import --table myplanCourses --append temp/convex_courses.json
```

4. **Enrich with MyPlan details** (optional): Run enrichment action in Convex

Go to Convex dashboard, run `myplanScrapers:scheduleEmtpyAll` . 

> **Note**: For database exports and monitoring, see [Course DevOps Documentation](./COURSE_DEVOPS.md)

### File Structure:

```
temp/
├── all_uw_courses.json              # Raw scraped data
├── convex_courses.json              # Transformed for import
├── convex_course_codes_cache.json   # Cached existing codes
└── convex_course_codes.json         # Exported codes (optional)
```

---

## Data Schema Mapping

| UW Catalog Field | Convex Field   | Notes                                     |
| ---------------- | -------------- | ----------------------------------------- |
| `uwCourseCode`   | `uwCourseCode` | Original catalog code (e.g., "INFO200")   |
| `myplanCode`     | `courseCode`   | Formatted with space (e.g., "EDSPE 601")  |
| `myplanCode`     | `courseId`     | Original without space (e.g., "EDSPE601") |
| `myplanUrl`      | `url`          | Used for detail scraping queue            |
| `title`          | `title`        | Course title with credits                 |
| `description`    | `description`  | Course description                        |
| `credits`        | `credit`       | Credit hours                              |
| `quarters`       | `termsOffered` | Array of quarters offered                 |
| `subject`        | `subjectArea`  | Subject code (e.g., "INFO")               |
| `number`         | `courseNumber` | Course number (e.g., "200")               |

---

## Troubleshooting

### Common Issues:

1. **Cache Issues**: Use `--refresh-cache` or `--no-cache` flags
2. **Convex Connection**: Ensure `CONVEX_URL` is set in environment
3. **Schema Errors**: Check that all required fields are present
4. **Rate Limiting**: Scraper includes delays, but you may need to adjust batch sizes

### Dependencies:

- `httpx` - HTTP client for scraping
- `lxml` - HTML parsing
- `rich` - Pretty printing
- `convex` - Convex Python client

### Installation:

```bash
uv sync  # Install all dependencies from pyproject.toml
```

---

## Performance Notes

- **Scraping**: Takes ~10-15 minutes for full UW catalog
- **Transformation**: Fast with cache (~30 seconds), slower without (~5 minutes)
- **Import**: Depends on batch size and number of new courses
- **Enrichment**: Rate-limited to avoid overwhelming MyPlan servers

---

## Monitoring

The scripts provide detailed progress output including:

- Page-by-page scraping progress
- Transformation statistics (new vs existing courses)
- Subject analysis and course counts
- Cache hit/miss information
- Batch processing status
