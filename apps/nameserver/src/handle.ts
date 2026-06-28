import { Packet } from "dns-packet";
import { DnsRecord, State, Zone } from "./state";
import { recordQuery } from "./stats";
import { useMemoryCache } from "@acfatah/memory-cache";
import * as dns from "node:dns/promises";

enum RCODES {
  NOERROR = 0,
  FORMERR = 1,
  SERVFAIL = 2,
  NXDOMAIN = 3,
  NOTIMP = 4,
  REFUSED = 5,
}

const cache = useMemoryCache({
  ttl: 5 * 60 * 1000, // 5min default
})

export default async function handle(query: Packet, state: State): Promise<Packet> {
  const question = query.questions?.[0];
  if (!question) {
    recordQuery("unknown", "FORMERR");
    return errorResp(query, RCODES.FORMERR);
  }

  const qname = question.name.toLowerCase();
  const qtype = question.type.toUpperCase();

  const zone = state.findZone(qname);

  if (!zone) {
    recordQuery(qname, "REFUSED");
    return errorResp(query, RCODES.REFUSED);
  }

  const isApex = qname === zone.name;

  if (isApex && qtype === "SOA") {
    recordQuery(qname, "NOERROR");
    return soaResp(query, zone);
  }

  if (isApex && qtype === "NS") {
    recordQuery(qname, "NOERROR");
    return nsResp(query, zone);
  }

  let records = state.lookup(zone, qname, qtype);

  if (records.length === 0 && qtype != "CNAME") {
    records = state.lookup(zone, qname, "CNAME");
  }

  if (records.length === 0 && !isApex) {
    const parts = qname.split(".");
    parts[0] = "*";
    const wildcardName = parts.join(".");

    records = state.lookup(zone, wildcardName, qtype);
  }

  if (records.length > 0) {
    const resolved: DnsRecord[] = [];

    for (const r of records) {
      if (r.type === "CNAME" && isApex && qtype === "A") {
        const aRecordsCached = cache.get(`${r.data.target}-A`) as DnsRecord[];

        if (aRecordsCached) {
          console.log(`Cache hit for ${r.data.target}-A`);
          resolved.push(...aRecordsCached);
        } else {
          const aRecords = await dns.resolve4(r.data.target, { ttl: true });

          const aRecordsFormatted: DnsRecord[] = aRecords.map((record) => ({
            name: r.name,
            type: "A",
            ttl: record.ttl,
            data: { address: record.address },
          }));

          cache.set(`${r.data.target}-A`, aRecordsFormatted, { ttl: (aRecordsFormatted[0]?.ttl ?? 5 * 60 ) * 1000 });

          resolved.push(...aRecordsFormatted);
        }
      } else if (r.type === "CNAME" && isApex && qtype === "AAAA") {
        const aaaaRecordsCached = cache.get(`${r.data.target}-AAAA`) as DnsRecord[];

        if (aaaaRecordsCached) {
          resolved.push(...aaaaRecordsCached);
        } else {
          const aaaaRecords = await dns.resolve6(r.data.target, { ttl: true });

          const aaaaRecordsFormatted: DnsRecord[] = aaaaRecords.map((record) => ({
            name: r.name,
            type: "AAAA",
            ttl: record.ttl,
            data: { address: record.address },
          }));

          cache.set(`${r.data.target}-AAAA`, aaaaRecordsFormatted, { ttl: (aaaaRecordsFormatted[0]?.ttl ?? 5 * 60) * 1000 });

          resolved.push(...aaaaRecordsFormatted);
        }
      } else {
        resolved.push(r);
      }
    }

    console.log(`Resolved records for ${qname} (${qtype}):`, resolved);

    recordQuery(qname, "NOERROR");
    return answerResp(query, zone, resolved);
  }

  if (state.hasName(zone, qname)) {
    recordQuery(qname, "NOERROR");
    return emptyResp(query, zone);
  }

  recordQuery(qname, "NXDOMAIN");
  return nxResp(query, zone);
}

function toDnsData(type: string, data: any): any {
  switch (type) {
    case "A":
    case "AAAA":
      return data.address;

    case "CNAME":
    case "NS":
    case "PTR":
      return data.target;

    case "TXT":
      return data.text;

    case "MX":
      return { preference: data.priority, exchange: data.target };

    case "SRV":
      return {
        priority: data.priority,
        weight: data.weight,
        port: data.port,
        target: data.target,
      };

    case "CAA":
      return {
        flags: data.flags,
        tag: data.tag,
        value: data.value,
      };

    default:
      return data;
  }
}

function baseResp(query: Packet): Packet {
  return {
    id: query.id,
    type: "response",
    flags: 0x8400,
    questions: query.questions,
    answers: [],
    authorities: [],
    additionals: [],
  };
}

function errorResp(query: Packet, rcode: RCODES) {
  let res = baseResp(query);
  res.flags = (res.flags! & ~0x0400) | rcode;

  return res;
}

function emptyResp(query: Packet, zone: Zone): Packet {
  let res = baseResp(query);

  res.authorities = [
    {
      name: zone.name,
      type: "SOA",
      ttl: 300,
      class: "IN",
      data: {
        mname: process.env.SOA_MNAME!,
        rname: process.env.SOA_RNAME!,
        serial: zone.serial,
        refresh: 10800,
        retry: 3600,
        expire: 604800,
        minimum: 300,
      },
    },
  ];

  return res;
}

function nxResp(query: Packet, zone: Zone): Packet {
  let res = emptyResp(query, zone);
  res.flags! |= RCODES.NXDOMAIN;

  return res;
}

function answerResp(query: Packet, zone: Zone, records: DnsRecord[]): Packet {
  let res = baseResp(query);

  res.answers = records.map((record) => ({
    name: record.name,
    type: record.type as any,
    class: "IN",
    ttl: record.ttl,
    data: toDnsData(record.type, record.data),
  }));

  return res;
}

function soaResp(query: Packet, zone: Zone): Packet {
  const res = baseResp(query);

  res.answers = [
    {
      name: zone.name,
      type: "SOA",
      ttl: 300,
      class: "IN",
      data: {
        mname: process.env.SOA_MNAME!,
        rname: process.env.SOA_RNAME!,
        serial: zone.serial,
        refresh: 10800,
        retry: 3600,
        expire: 604800,
        minimum: 300,
      },
    },
  ];

  return res;
}

function nsResp(query: Packet, zone: Zone): Packet {
  const res = baseResp(query);

  res.answers = zone.ns.map((ns) => ({
    name: zone.name,
    type: "NS",
    ttl: 300,
    class: "IN",
    data: ns,
  }));

  return res;
}
