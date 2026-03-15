/**
 * Compute top-N distributions from OSINT query results.
 *
 * Supports Shodan (matches[]) and Censys (hits[]) data structures.
 * All computation is client-side — no backend calls needed.
 */

const FIELD_MAPS = {
  shodan: {
    port:      { path: "port" },
    org:       { path: "org" },
    country:   { path: "location.country_name" },
    isp:       { path: "isp" },
    os:        { path: "os" },
    transport: { path: "transport" },
    software:  { type: "shodan_software" },
  },
  censys: {
    port:      { type: "censys_ports" },
    org:       { path: "autonomous_system.name" },
    country:   { path: "location.country" },
    isp:       { path: "autonomous_system.description" },
    os:        null,
    transport: { type: "censys_transport" },
    software:  { type: "censys_software" },
  },
};

const STAT_LABELS = {
  port:      "Top Ports",
  org:       "Top Organizations",
  country:   "Top Countries",
  isp:       "Top ISP / ASN",
  os:        "Top OS",
  transport: "Transport Protocols",
  software:  "Top Software / CPE",
};

/** Order in which stats are displayed */
const STAT_ORDER = ["port", "org", "country", "isp", "os", "transport", "software"];

export { STAT_LABELS, STAT_ORDER };

/**
 * Main entry point: compute all stats for a given module + raw data.
 * Returns an object keyed by stat name, each value is { label, items: [{ value, count }] }.
 * Only includes stats that have at least 1 item.
 */
export function computeStats(module, rawData, topN = 10) {
  const fieldMap = FIELD_MAPS[module] || FIELD_MAPS.shodan;
  const records = module === "censys"
    ? (rawData.hits || [])
    : (rawData.matches || []);

  if (records.length === 0) return {};

  const result = {};

  for (const key of STAT_ORDER) {
    const spec = fieldMap[key];
    if (!spec) continue;

    let items;
    if (spec.type) {
      items = extractSpecial(records, spec.type, topN);
    } else {
      items = extractByPath(records, spec.path, topN);
    }

    if (items.length > 0) {
      result[key] = { label: STAT_LABELS[key], items };
    }
  }

  return result;
}

// ── Extraction helpers ──────────────────────────────────────────────────────

function extractByPath(records, path, topN) {
  const counts = {};
  for (const rec of records) {
    const val = getNestedValue(rec, path);
    if (val === null || val === undefined || val === "") continue;
    const key = String(val);
    counts[key] = (counts[key] || 0) + 1;
  }
  return toSortedTop(counts, topN);
}

function extractSpecial(records, type, topN) {
  const counts = {};

  switch (type) {
    case "shodan_software": {
      for (const rec of records) {
        // Try product + version first
        if (rec.product) {
          const label = rec.version ? `${rec.product}/${rec.version}` : rec.product;
          counts[label] = (counts[label] || 0) + 1;
        }
        // Also count CPEs
        const cpes = rec.cpe || rec.cpe23 || [];
        for (const cpe of (Array.isArray(cpes) ? cpes : [])) {
          const parsed = parseCpe(cpe);
          if (parsed) counts[parsed] = (counts[parsed] || 0) + 1;
        }
      }
      break;
    }

    case "censys_ports": {
      for (const rec of records) {
        const services = rec.services || [];
        for (const svc of services) {
          if (svc.port != null) {
            const key = String(svc.port);
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      }
      break;
    }

    case "censys_transport": {
      for (const rec of records) {
        const services = rec.services || [];
        for (const svc of services) {
          const proto = svc.transport_protocol;
          if (proto) counts[proto] = (counts[proto] || 0) + 1;
        }
      }
      break;
    }

    case "censys_software": {
      for (const rec of records) {
        const services = rec.services || [];
        for (const svc of services) {
          const software = svc.software || [];
          for (const sw of software) {
            const label = sw.product || sw.vendor;
            if (label) {
              const full = sw.version ? `${label}/${sw.version}` : label;
              counts[full] = (counts[full] || 0) + 1;
            }
          }
        }
      }
      break;
    }
  }

  return toSortedTop(counts, topN);
}

// ── Utility ─────────────────────────────────────────────────────────────────

function getNestedValue(obj, path) {
  if (!path || obj == null) return undefined;
  return path.split(".").reduce(
    (cur, key) => (cur == null ? undefined : cur[key]),
    obj
  );
}

function toSortedTop(counts, topN) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([value, count]) => ({ value, count }));
}

/**
 * Parse a CPE string (v2.2 or v2.3) into a readable "vendor/product" or "product/version".
 * Example: "cpe:/a:apache:http_server:2.4.41" → "apache http_server/2.4.41"
 * Example: "cpe:2.3:a:nginx:nginx:1.18.0:*:..." → "nginx/1.18.0"
 */
function parseCpe(cpe) {
  if (!cpe || typeof cpe !== "string") return null;
  const parts = cpe.split(":");
  if (parts.length < 5) return null;

  // cpe:2.3 format
  if (parts[1] === "2.3") {
    const product = parts[4] || "";
    const version = parts[5] && parts[5] !== "*" ? parts[5] : "";
    return version ? `${product}/${version}` : product || null;
  }

  // cpe:/a format (v2.2)
  const vendor = (parts[2] || "").replace(/^\/\w:/, "");
  const product = parts[3] || "";
  const version = parts[4] || "";
  const label = product || vendor;
  return label ? (version ? `${label}/${version}` : label) : null;
}
