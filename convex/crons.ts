import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "scrape latest course details every 5 minutes",
  "*/5 * * * *",
  internal.myplanScrapers.courseDetailCronJob5m
);

crons.cron(
  "scrape latest course details every 1 minute",
  "*/1 * * * *",
  internal.myplanScrapers.courseDetailCronJob1m
);

crons.cron(
  "scrape latest course details every 10 minutes",
  "*/10 * * * *",
  internal.myplanScrapers.courseDetailCronJob10m
);


crons.cron(
  "scrape latest course details every 15 minutes",
  "*/15 * * * *",
  internal.myplanScrapers.courseDetailCronJob15m
);


export default crons;