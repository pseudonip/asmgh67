export type DnsRecord = {
  name: string;
  type: string;
  data: any;
  ttl: number;
};

export type Zone = {
  name: string;
  serial: number;
  records: Map<string, DnsRecord[]>;
}

export class State {
  private zones = new Map<string, Zone>();

  set(zone: Zone) {
    this.zones.set(zone.name, zone);
  }

  findZone(qname: string): Zone | null {
    const parts = qname.split(".");

    for (let i = 0; i < parts.length; i++) {
      const zoneName = parts.slice(i).join(".");
      const zone = this.zones.get(zoneName);

      if (zone) return zone;
    }

    return null;
  }

  hasName(zone: Zone, name: string): boolean {
    for (let key of zone.records.keys()) {
      if (key.startsWith(`${name}:`)) return true;
    }

    return false;
  }

  lookup(zone: Zone, qname: string, qtype: string): DnsRecord[] {
    const key = `${qname}:${qtype}`;
    return zone.records.get(key) || [];
  }
}
