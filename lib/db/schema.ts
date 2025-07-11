import { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const CoursesTable = pgTable(
  "uw_courses",
  {
    id: serial("id").primaryKey(),
    code: text("code").unique().notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    credit: text("credit").notNull(),
    subject: text("subject").notNull(),
    number: text("number").notNull(),
    quarters: text("quarters").notNull(),
    programCode: text("programCode").references(() => ProgramsTable.code),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (users) => [uniqueIndex("uw_courses_unique_code_idx").on(users.code)]
)

export const ProgramsTable = pgTable(
  "uw_programs",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").unique().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (programs) => [uniqueIndex("uw_programs_unique_code_idx").on(programs.code)]
)

// Connect to  Postgres
export const db = drizzle(process.env.DATABASE_URL!)
