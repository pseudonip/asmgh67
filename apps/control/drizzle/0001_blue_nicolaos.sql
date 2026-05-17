CREATE TABLE "nameservers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hostname" text NOT NULL,
	"ipv4" text NOT NULL,
	"pool" text DEFAULT 'default' NOT NULL,
	"auth_token_hash" "bytea" NOT NULL,
	CONSTRAINT "nameservers_hostname_unique" UNIQUE("hostname"),
	CONSTRAINT "nameservers_auth_token_hash_unique" UNIQUE("auth_token_hash")
);
