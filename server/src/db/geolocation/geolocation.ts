import type { City, SubdivisionsRecord } from "@maxmind/geoip2-node";
import { Reader } from "@maxmind/geoip2-node";
import { readFile } from "fs/promises";
import path from "path";
import { IS_CLOUD } from "../../lib/const.js";
import { logger } from "../../lib/logger/logger.js";

// Adjust path to find the database relative to project root
const dbPath = path.join(process.cwd(), "GeoLite2-City.mmdb");

export type LocationResponse = {
  city?: string;
  country?: string;
  region?: string;
  countryIso?: string;
  latitude?: number;
  longitude?: number;
  timeZone?: string;
  error?: string;

  vpn?: string;
  crawler?: string;
  datacenter?: string;
  isProxy?: boolean;
  isTor?: boolean;
  isSatellite?: boolean;

  company?: {
    name?: string;
    domain?: string;
    type?: string;
    abuseScore?: number;
  };

  asn?: {
    asn?: number;
    org?: string;
    domain?: string;
    type?: string;
    abuseScore?: number;
  };
} | null;

type IPAPIResponse = {
  ip: string;
  rir?: string;
  is_bogon?: boolean;
  is_mobile?: boolean;
  is_satellite?: boolean;
  is_crawler?: string | boolean;
  is_datacenter?: boolean;
  is_tor?: boolean;
  is_proxy?: boolean;
  is_vpn?: boolean;
  is_abuser?: boolean;
  elapsed_ms?: number;
  location?: {
    city?: string;
    country?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    state?: string;
    continent?: string;
    continent_code?: string;
    postal_code?: string;
    zip?: string;
    region?: string;
    region_code?: string;
  };
  asn?: {
    asn?: number;
    abuser_score?: string;
    route?: string;
    descr?: string;
    country?: string;
    active?: boolean;
    org?: string;
    domain?: string;
    abuse?: string;
    type?: string;
    created?: string;
    updated?: string;
    rir?: string;
    whois?: string;
  };
  vpn?: {
    ip?: string;
    service?: string;
    url?: string;
    type?: string;
    last_seen?: number;
    last_seen_str?: string;
    exit_node_region?: string;
    country_code?: string;
    city_name?: string;
    latitude?: number;
    longitude?: number;
  };
  datacenter?: {
    datacenter?: string;
    network?: string;
    region?: string;
    country?: string;
    city?: string;
  };
  company?: {
    name?: string;
    abuser_score?: string;
    domain?: string;
    type?: string;
    network?: string;
    whois?: string;
  };
  abuse?: {
    name?: string;
    address?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
};

let reader: Reader | null = null;

// Extend the Reader type to include the city method
interface ExtendedReader extends Reader {
  city(ip: string): City;
}

async function loadDatabase(dbPath: string) {
  const dbBuffer = await readFile(dbPath);
  reader = Reader.openBuffer(dbBuffer);
  logger.info("GeoIP database loaded successfully");
}

await loadDatabase(dbPath);

// Utility function to extract response data
function extractLocationData(response: City | null): LocationResponse {
  if (!response) {
    return null;
  }

  return {
    city: response.city?.names?.en,
    country: response.country?.names?.en,
    countryIso: response.country?.isoCode,
    latitude: response.location?.latitude,
    longitude: response.location?.longitude,
    timeZone: response.location?.timeZone,
    region: response.subdivisions?.[0]?.isoCode,
  };
}

const apiKey = process.env.IPAPI_KEY;

async function getLocationFromIPAPI(ips: string[]): Promise<Record<string, LocationResponse>> {
  if (!apiKey) {
    logger.warn("IPAPI_KEY not configured for cloud geolocation");
    return {};
  }

  const localInfo = await getLocationFromLocal(ips);
  try {
    const response = await fetch("https://api.ipapi.is/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ips,
        key: apiKey,
      }),
    });

    if (!response.ok) {
      logger.error(`IPAPI request failed: ${response.status} ${response.statusText}`);
      return localInfo;
    }

    const data = (await response.json()) as Record<string, IPAPIResponse>;

    const results: Record<string, LocationResponse> = {};
    for (const ip of ips) {
      const item = data[ip];

      if (!item) {
        continue;
      }

      results[ip] = {
        city: item.location?.city,
        country: item.location?.country,
        countryIso: item.location?.country_code,
        region: localInfo[ip]?.region,
        latitude: item.location?.latitude,
        longitude: item.location?.longitude,
        timeZone: item.location?.timezone,
        vpn: item.vpn?.service,
        crawler: typeof item.is_crawler === "string" ? item.is_crawler : undefined,
        datacenter: item.datacenter?.datacenter,
        isProxy: item.is_proxy,
        isTor: item.is_tor,
        isSatellite: item.is_satellite,

        company: {
          name: item.company?.name,
          domain: item.company?.domain,
          type: item.company?.type,
          abuseScore: Number(item.company?.abuser_score?.split(" ")[0]),
        },

        asn: {
          asn: item.asn?.asn,
          org: item.asn?.org,
          domain: item.asn?.domain,
          type: item.asn?.type,
          abuseScore: Number(item.asn?.abuser_score?.split(" ")[0]),
        },
      };
    }
    return results;
  } catch (error) {
    logger.error("Error fetching from IPAPI:", error);
    return {};
  }
}

async function getLocationFromLocal(ips: string[]): Promise<Record<string, LocationResponse>> {
  const responses = await Promise.all(
    ips.map(ip => {
      try {
        return (reader as ExtendedReader).city(ip);
      } catch (error) {
        return null;
      }
    })
  );

  const results: Record<string, LocationResponse> = {};

  responses.forEach((response, index) => {
    results[ips[index]] = extractLocationData(response);
  });

  return results;
}

export async function getLocation(ips: string[], useLocal?: boolean): Promise<Record<string, LocationResponse>> {
  const dedupedIps = [...new Set(ips)];

  if (IS_CLOUD && !useLocal) {
    return getLocationFromIPAPI(dedupedIps);
  }

  return getLocationFromLocal(dedupedIps);
}
