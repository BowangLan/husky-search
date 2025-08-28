import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "scrape latest course details every 5 minutes",
  "*/5 * * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 5 * 60,
  }
);

crons.cron(
  "scrape latest course details every 1 minute",
  "*/1 * * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 60,
  }
);

crons.cron(
  "scrape latest course details every 10 minutes",
  "*/10 * * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 10 * 60,
  }
);


crons.cron(
  "scrape latest course details every 15 minutes",
  "*/15 * * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 15 * 60,
  }
);

crons.cron(
  "scrape latest course details every 30 minutes",
  "*/30 * * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 30 * 60,
  }
);


crons.cron(
  "scrape latest course details every 1 hour",
  "0 * * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 60 * 60,
  }
);


crons.cron(
  "scrape latest course details every 2 hours",
  "0 */2 * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 2 * 60 * 60,
  }
);


crons.cron(
  "scrape latest course details every 6 hours",
  "0 */6 * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 6 * 60 * 60,
  }
);


crons.cron(
  "scrape latest course details every 12 hours",
  "0 */12 * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 12 * 60 * 60,
  }
);


crons.cron(
  "scrape latest course details every 24 hours",
  "0 0 * * *",
  internal.myplanScrapers.runCourseDetailCronJob,
  {
    intervalSeconds: 24 * 60 * 60,
  }
);

export default crons;