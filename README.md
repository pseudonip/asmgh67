# Raincloud

A self-hostable authoritative DNS server with a web dashboard and admin panel.

<img width="1920" height="996" alt="image" src="https://github.com/user-attachments/assets/57e1615a-c2c1-4cbb-b676-4182bb800248" />

## Architecture

`apps/control` is the web dashboard and admin panel, along with being the source of truth for zone info and records
`apps/nameserver` is the actual DNS server that responds to queries, it gets its data from control
`packages/types` is a package of types that are shared between control and nameserver

## Prerequisites
- Bun 1.3 or newer
- PostgreSQL
- (for production) a domain name where you can set glue records for nameservers, and a minimum of 1 server with a public IP (but ideally 2 servers)

## Setup

Clone and install deps:

```bash
git clone https://github.com/cyteon/raincloud.git
cd raincloud
bun install
```

Copy `apps/control/.env.example` to `apps/control/.env` and fill in the DATABASE_URL

Run migrations:

```bash
bun db:migrate
```

Start the dashboard in dev:

```bash
bun dev:control
```

Go to `http://localhost:3000` and create an account, then make yourself admin by setting is_admin to true in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

Go to `http://localhost:3000/admin/ns` and create a nameserver, copy down the token thats shown.

Copy `apps/nameserver/.env.example` to `apps/nameserver/.env` and fill out the vales

Start the nameserver:

```bash
bun dev:ns
```

Add a zone on the dashboard and add some records, then test it with dig:

```bash
dig @localhost -p 5354 example.com A
```

## Production

Build and run the dashboard (you might want to run it with pm2 or systemd), behind a reverse proxy for TLS:

```bash
cd apps/control
bun run build
bun .output/server/index.mjs
```

Nameserver:

```bash
cd apps/nameserver
PORT=53 sudo bun start
```

For real deployment you will need to set up glue records for your nameservers (for example ns1.example.com and ns2.example.com) with your domain registrars.
