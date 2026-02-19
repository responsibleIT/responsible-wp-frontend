import { config } from "dotenv";
import specifiedSkip from "./specifiedSkip.js";
config();

const WP_API_URL = process.env.WP_API_URL;

// --- 1. Move fetchBuilder to the top so it is available to other functions ---
const fetchBuilder = (options, page = 1) => {
  const defaultParams = {
    per_page: "100",
    status: "publish",
    _fields: "id,title,slug,content,date,tags,categories,parent",
    page: page.toString(),
  };

  const params = new URLSearchParams(defaultParams);

  if (options) {
    try {
      const customParams = new URLSearchParams(options);
      customParams.forEach((value, key) => {
        params.set(key, value);
      });
    } catch (e) {
      console.error("Error parsing options string:", options, e);
    }
  }

  return `?${params.toString()}`;
};

// --- 2. Date Conversion Helper ---
function convertDatesToObjects(obj) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDatesToObjects(item));
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        ["date", "date_gmt", "modified", "modified_gmt"].includes(key) &&
        typeof value === "string" && value !== ""
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

// --- 3. Pagination Helper ---
async function fetchAllWithPagination(endpoint, options = "") {
  let allItems = [];
  let currentPage = 2;
  let hasMorePages = true;

  while (hasMorePages) {
    const url = `${WP_API_URL}/${endpoint}${fetchBuilder(options, currentPage)}`;
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pagination Error: [${response.status}] at ${url}`, errorText);
        break;
      }

      const items = await response.json();
      if (!Array.isArray(items) || items.length === 0) {
        hasMorePages = false;
        break;
      }

      allItems = [...allItems, ...items];
      
      const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
      console.log(`Successfully fetched page ${currentPage} of ${totalPages}`);

      if (currentPage >= totalPages) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    } catch (error) {
      console.error(`Critical Pagination Failure at ${url}:`, error);
      hasMorePages = false;
    }
  }
  return allItems;
}

// --- 4. Main Exported Function ---
export default async function NormalizedFetch(fetchSource, options = "") {
  if (!WP_API_URL) {
    console.error("Critical Error: WP_API_URL is not defined in .env");
    return {};
  }

  let url = `${WP_API_URL}/${fetchSource}`;
  
  try {
    if (fetchSource !== "frontpage") {
      url += fetchBuilder(options);
    }

    console.log(`Starting fetch: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody} at URL: ${url}`);
    }

    let firstPageData = await response.json();
    const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
    const totalRecords = response.headers.get("X-WP-Total");

    let finalCombinedData;

    if (totalPages > 1 && Array.isArray(firstPageData)) {
      
      console.log(`Page 1 of ${totalPages} fetched (${totalRecords} total records). Fetching remaining...`);
      const remainingPagesData = await fetchAllWithPagination(fetchSource, options);
      finalCombinedData = [...firstPageData, ...remainingPagesData];
    } else {
      finalCombinedData = firstPageData;
    }

    if(finalCombinedData.length === 1) {
  finalCombinedData = finalCombinedData[0];
}

if (Array.isArray(finalCombinedData)) {
  const filteredData = specifiedSkip(fetchSource, finalCombinedData);
  return convertDatesToObjects(filteredData);
}

return convertDatesToObjects(finalCombinedData);

  } catch (error) {
    console.error(`NormalizedFetch failed for source "${fetchSource}":`, error.message);
    return {}; // Return empty object to prevent app crash
  }
}