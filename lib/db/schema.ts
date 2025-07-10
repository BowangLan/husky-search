import { InferInsertModel, InferSelectModel } from "drizzle-orm"
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" })

export const UsersTable = pgTable(
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (users) => [uniqueIndex("unique_idx").on(users.code)]
)

// Connect to  Postgres
export const db = drizzle(sql)
