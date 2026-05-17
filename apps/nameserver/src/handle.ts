import { Packet } from "dns-packet";
import { DnsRecord, State, Zone } from "./state";

enum RCODES {
  NOERROR = 0,
  FORMERR = 1,
  SERVFAIL = 2,
  NXDOMAIN = 3,
  NOTIMP = 4,
  REFUSED = 5,
}

export default function handle(query: Packet, state: State): Packet {
  const question = query.questions?.[0];
  if (!question) return errorResp(query, RCODES.FORMERR);

  const qname = question.name.toLowerCase();
  const qtype = question.type.toUpperCase();

  const zone = state.findZone(qname);
  if (!zone) return errorResp(query, RCODES.NXDOMAIN);

  const records = state.lookup(zone, qname, qtype);

  if (records.length > 0) return answerResp(query, zone, records);

  if (state.hasName(zone, qname)) return emptyResp(query, zone);

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

    // todo: finish types

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
  }
}

function errorResp(query: Packet, rcode: RCODES) {
  let res = baseResp(query);
  res.flags! |= rcode;
  return res;
}

function emptyResp(query: Packet, zone: Zone): Packet {
  let res = baseResp(query);

  // todo: soa records

  return res;
}

function nxResp(query: Packet, zone: Zone): Packet {
  let res = emptyResp(query, zone);
  res.flags! |= RCODES.NXDOMAIN;
  return res;
}

function answerResp(query: Packet, zone: Zone, records: DnsRecord[]): Packet {
  let res = baseResp(query);

  res.answers = records.map(record => ({
    name: record.name,
    type: record.type as any,
    class: "IN",
    ttl: record.ttl,
    data: toDnsData(record.type, record.data),
  }));

  return res;
}
