import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const matchClassEnum = pgEnum("match_class", ["A_STRONG","B_STRETCH","C_LONG_SHOT"]);
export const applicationOutcomeEnum = pgEnum("application_outcome", ["PENDING","IN_PROGRESS","REJECTED","WITHDRAWN","OFFER"]);
export const applicationStageEnum = pgEnum("application_stage", ["APPLICATION","RECRUITER_SCREENING","HIRING_MANAGER","TECHNICAL","CHALLENGE","FINAL","OFFER"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  yearsExperience: numeric("years_experience", { precision: 4, scale: 1 }),
  englishLevel: varchar("english_level", { length: 20 }),
  workAuthorization: varchar("work_authorization", { length: 120 }),
  targetRoles: text("target_roles").array(),
  targetCountries: text("target_countries").array(),
  primarySkills: text("primary_skills").array(),
  secondarySkills: text("secondary_skills").array(),
  profileSummary: text("profile_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  roleCategory: varchar("role_category", { length: 120 }),
  seniority: varchar("seniority", { length: 80 }),
  country: varchar("country", { length: 120 }),
  workMode: varchar("work_mode", { length: 40 }),
  source: varchar("source", { length: 80 }),
  vacancyUrl: text("vacancy_url"),
  cvVersion: varchar("cv_version", { length: 120 }),
  userMatchClass: matchClassEnum("user_match_class"),
  userMatchPercentage: integer("user_match_percentage"),
  aiMatchClass: matchClassEnum("ai_match_class"),
  aiMatchPercentage: integer("ai_match_percentage"),
  aiMatchConfidence: integer("ai_match_confidence"),
  workAuthorization: varchar("work_authorization", { length: 120 }),
  sponsorshipRequired: boolean("sponsorship_required"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: varchar("currency", { length: 10 }),
  outcome: applicationOutcomeEnum("outcome").default("PENDING").notNull(),
  stage: applicationStageEnum("stage").default("APPLICATION").notNull(),
  responseAt: timestamp("response_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  rejectionType: varchar("rejection_type", { length: 80 }),
  requirementsAndGaps: text("requirements_and_gaps"),
  notes: text("notes"),
  jdVerifiedAt: timestamp("jd_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  openaiConversationId: text("openai_conversation_id"),
  lastOpenaiResponseId: text("last_openai_response_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  openaiResponseId: text("openai_response_id"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
