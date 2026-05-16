# Raincloud

## Setup

todo

## Parts

### apps/control

The dashboard and source of truth, it sends zone data to the nameservers via websockets.
It's a solidstart app, using drizzle and psql.

### apps/nameservers

The nameservers are made in bun and connect to the control app via ws to recieve zone updates, and report metrics.

### packages/shared

Shared types used by both control and nameservers
