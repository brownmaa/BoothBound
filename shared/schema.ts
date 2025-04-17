import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  company: text("company"),
  role: text("role"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  company: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Event model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed
  userId: integer("user_id").notNull(), // foreign key to users
  leadCount: integer("lead_count").notNull().default(0),
  todayLeadCount: integer("today_lead_count").notNull().default(0),
  leadScoringCriteria: text("lead_scoring_criteria"), // Custom AI scoring criteria
});

// Event Attendees model
export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(), // foreign key to events
  name: text("name").notNull(),
  email: text("email"),
  role: text("role"), // Their role at the event (e.g., "Sales Rep", "Product Demo", "Booth Manager")
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({ 
  id: true,
  createdAt: true
});

export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;

export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true,
  leadCount: true,
  todayLeadCount: true
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Lead model
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  title: text("title"),
  company: text("company"),
  eventId: integer("event_id").notNull(), // foreign key to events
  notes: text("notes"),
  score: text("score").notNull().default("medium"), // low, medium, high
  userId: integer("user_id").notNull(), // foreign key to users
  employeeId: integer("employee_id"), // ID of employee who collected the lead
  employeeName: text("employee_name"), // Name of employee who collected the lead
  avatar: text("avatar"), // Will be undefined when null in the frontend
  source: text("source").notNull().default("manual"), // manual, scan, import
  createdAt: timestamp("created_at").notNull().defaultNow(),
  aiScoreExplanation: text("ai_score_explanation"), // AI-generated explanation for the score
  aiSimilarityScore: text("ai_similarity_score"), // Raw numerical similarity score from AI
  // LinkedIn specific fields
  linkedIn: text("linkedin_url"), // LinkedIn profile URL
  location: text("location"), // Location from LinkedIn profile
  industry: text("industry"), // Industry from LinkedIn profile
  bio: text("bio"), // Biography or summary from LinkedIn
});

export const insertLeadSchema = createInsertSchema(leads).omit({ 
  id: true,
  createdAt: true
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
