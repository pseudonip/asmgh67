# Raincloud
A simple authoritive dns server

(admin dash example)
<img width="1920" height="996" alt="image" src="https://github.com/user-attachments/assets/57e1615a-c2c1-4cbb-b676-4182bb800248" />


## Setup

1. Install bun and clone the repo
2. Run `bun i` to install dependencies
3. Copy `apps/control/.env.example` to `apps/control/.env` and fill in the required values
4. To test the dashboard use `bun dev:control`, `bun dev:ns` for nameservers
5. Register an account and make yourself admin by setting isAdmin to true for your account in the db
6. On the admin dash create a nameserver and copy and fill `apps/nameservers/.env.example` with the token you get and the other details it wants
7. For running the dashboard in prod go to `apps/control` and run `bun run build` then `bun .output/server/index.mjs`
8. For running a nameserver in prod go to `apps/nameservers` and run `PORT=53 sudo bun start`

## Parts

### apps/control

The dashboard and source of truth, it sends zone data to the nameservers via sse.
It's a solidstart app, using drizzle and psql.

### apps/nameservers

The nameservers are made in bun and connect to the control app via ws to recieve zone updates, and report metrics.

### packages/types

Shared types used by both control and nameservers
