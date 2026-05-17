import {
  bigint,
  boolean,
  customType,
  index,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

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

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: bytea("token_hash").notNull().unique(),
    expires_at: text("expires_at").notNull(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expires_at),
  ],
);

export const nameservers = pgTable("nameservers", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostname: text("hostname").notNull().unique(),
  ipv4: text("ipv4").notNull(),
  pool: text("pool").notNull().default("default"),
  auth_token_hash: bytea("auth_token_hash").notNull().unique(),
});

export const zones = pgTable("zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("apex").notNull().unique(),
  status: text("status", { enum: ["active", "pending", "error"] })
    .notNull()
    .default("pending"),
  serial: bigint("serial", { mode: "number" }).notNull().default(1),
  nsPool: text("ns_pool").notNull().default("default"),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Nameserver = typeof nameservers.$inferSelect;
