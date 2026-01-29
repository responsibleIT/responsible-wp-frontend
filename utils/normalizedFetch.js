import { config } from "dotenv";
import specifiedSkip from "./specifiedSkip.js"
config();

const WP_API_URL = process.env.WP_API_URL;

// Helper function to convert date strings to Date objects recursively
function convertDatesToObjects(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDatesToObjects(item));
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert common WordPress date fields
      if (
        (key === "date" ||
          key === "date_gmt" ||
          key === "modified" ||
          key === "modified_gmt") &&
        typeof value === "string"
      ) {
        converted[key] = new Date(value);
      } else if (typeof value === "object") {
        converted[key] = convertDatesToObjects(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  return obj;
}

// Helper function to fetch all pages from a WordPress API endpoint with pagination
async function fetchAllWithPagination(endpoint) {
  let allItems = [];
  let currentPage = 1;
  let hasMorePages = true;
  const perPage = 100; // WordPress API maximum

  while (hasMorePages) {
    try {
      const response = await fetch(
        `${WP_API_URL}/${endpoint}?per_page=${perPage}&page=${currentPage}&status=publish`
      );

      if (!response.ok) {
        if (response.status === 400) {
          // We've reached the end of available pages
          hasMorePages = false;
          break;
        }
        throw new Error(
          `WP API ${response.status} when fetching ${endpoint} page ${currentPage}`
        );
      }

      const items = await response.json();
      if (items.length === 0) {
        hasMorePages = false;
        break;
      }

      allItems = [...allItems, ...items];
      currentPage++;

      const totalPages = parseInt(response.headers.get("X-WP-TotalPages"));
      if (currentPage > totalPages) {
        hasMorePages = false;
      }

      console.log(
        `Fetched ${endpoint} page ${currentPage - 1} of ${totalPages || "unknown"} (${items.length} items)`
      );
    } catch (error) {
      console.error(`Error fetching ${endpoint} page ${currentPage}:`, error);
      hasMorePages = false;
    }
  }

  return allItems;
}

export default async function NormalizedFetch(fetchSource, options = "") {
  console.log("typeof fetchSource:", typeof fetchSource, "value:", fetchSource);
  console.log("typeof options:", typeof options, "value:", options);

  try {
    // Check if this is a collection endpoint that might need pagination
    // WordPress collection endpoints: pages, posts, etc.
    const collectionEndpoints = ["pages", "posts"];
    const isCollectionEndpoint = collectionEndpoints.includes(fetchSource);

    let data;

    if (isCollectionEndpoint) {
      // Use pagination to fetch all items
      console.log(`Fetching all ${fetchSource} with pagination...`);
      data = await fetchAllWithPagination(fetchSource);
    } else {
      // Regular single fetch
      const url = `${WP_API_URL}/${fetchSource}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
      }

      data = await response.json();
    }

    // Convert date strings to Date objects for Eleventy compatibility
    data = convertDatesToObjects(data);

    // Apply any configured skip rules for collection endpoints
    if (Array.isArray(data)) {
      data = specifiedSkip(fetchSource, data);
    }

    // Determine if data is an array (multiple objects) or a single object
    const isArray = Array.isArray(data);
    const dataType = isArray ? "array" : "object";
    const itemCount = isArray ? data.length : 1;

    console.log(
      `Data type: ${dataType}`,
      isArray ? `(${itemCount} items)` : "(single object)"
    );

    // If it's an array with multiple items, fetch each item separately by ID
    if (isArray && data.length > 0) {
      const fetchedItems = await Promise.all(
        data.map(async (item) => {
          if (item.id) {
            try {
              const itemUrl = `${WP_API_URL}/${fetchSource}/${item.id}`;
              console.log(`Fetching ${fetchSource}/${item.id}...`);
              const itemResponse = await fetch(itemUrl);
              if (itemResponse.ok) {
                const itemData = await itemResponse.json();
                return convertDatesToObjects(itemData);
              } else {
                console.warn(
                  `Failed to fetch ${fetchSource}/${item.id}: ${itemResponse.status}`,
                );
                return item; // Return original item if fetch fails
              }
            } catch (err) {
              console.error(`Error fetching ${fetchSource}/${item.id}:`, err);
              return item; // Return original item if fetch fails
            }
          }
          return item; // Return item as-is if no ID
        }),
      );
      console.log(`Fetched ${fetchedItems.length} individual items`);
      return fetchedItems;
    } else if (!isArray && data) {
      console.log("Object keys:", Object.keys(data));
    }

    return data;
  } catch (err) {
    console.error(`Error fetching ${fetchSource}:`, err);
    return null;
  }
}
