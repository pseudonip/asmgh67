import { Packet } from "dns-packet";

const MAX_UDP_SIZE = 1232;

export type EdnsData = {
  present: boolean;
  udpSize: number;
  doBit: boolean;
  version: number;
}

export function readEdns(query: Packet): EdnsData {
  const opt = query.additionals?.find(a => a.type === "OPT");
  if (!opt) return {
    present: false,
    udpSize: 512,
    doBit: false,
    version: 0,
  }

  return {
    present: true,
    udpSize: Math.min(opt.udpPayloadSize ?? 512, MAX_UDP_SIZE),
    doBit: !!opt.flag_do,
    version: opt.ednsVersion ?? 0,
  }
}

export function applyEdns(packet: Packet, query: Packet): Packet {
  const edns = readEdns(query);
  if (!edns.present) return packet;

  packet.additionals ??= [];

  packet.additionals.push({
    type: "OPT",
    name: ".",
    udpPayloadSize: edns.udpSize,
    flag_do: edns.doBit,
    flags: 0,
    ednsVersion: edns.version,
    options: [],
    extendedRcode: 0,
  });

  return packet;
}
