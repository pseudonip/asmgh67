import { boolean, customType, index, pgTable, text, uuid } from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({
  dataType: () => "citext",
});

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: bytea("token_hash").notNull().unique(),
  expires_at: text("expires_at").notNull(),
}, (t) => [
  index("sessions_user_id_idx").on(t.userId),
  index("sessions_expires_at_idx").on(t.expires_at),
]);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
