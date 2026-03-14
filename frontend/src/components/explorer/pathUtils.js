/**
 * Extract all leaf dot-notation paths from an object.
 *
 * Arrays are represented with [] in the path.
 * Example: { matches: [{ ip_str: "1.2.3.4" }] }
 * -> ["matches[].ip_str"]
 *
 * This is the single source of truth used by both TableView
 * (for column headers) and FieldSelector (for export checkboxes).
 */
export function extractPaths(obj, prefix = "", seen = new Set()) {
  if (!obj || typeof obj !== "object") return [prefix].filter(Boolean);

  const paths = [];

  if (Array.isArray(obj)) {
    const arrayPrefix = prefix ? `${prefix}[]` : "[]";
    if (obj.length === 0) {
      paths.push(arrayPrefix);
    } else {
      // Sample the first item to determine paths
      const child = obj[0];
      if (typeof child === "object" && child !== null) {
        paths.push(...extractPaths(child, arrayPrefix, seen));
      } else {
        paths.push(arrayPrefix);
      }
    }
    return paths;
  }

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (seen.has(fullKey)) continue;
    seen.add(fullKey);

    const val = obj[key];
    if (val !== null && typeof val === "object") {
      paths.push(...extractPaths(val, fullKey, seen));
    } else {
      paths.push(fullKey);
    }
  }

  return paths;
}

/**
 * Get a value from a nested object using a dot-notation path.
 * Handles array [] notation by returning the first element's sub-path.
 */
export function getByPath(obj, path) {
  if (!path || obj == null) return obj;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    const arrayMatch = part.match(/^(.+)\[\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]];
      if (Array.isArray(current)) return current;
      return undefined;
    }
    current = current[part];
  }
  return current;
}
