import NormalizedFetch from "../utils/normalizedFetch.js";

// ! _data makes use of utils

export default async function (eleventyData) {
  console.log("Fetching home data...");
  const home = await NormalizedFetch("frontpage", "");
  const pages = await NormalizedFetch("pages", "");
  console.log(
    "[pages.js] Fetched pages:",
    Array.isArray(pages),
    Array.isArray(pages) ? pages.length : typeof pages,
  );

  // Map WP IDs to slugs so we can build nested permalinks
  const idToSlug = {};
  pages.forEach((page) => {
    idToSlug[page.id] = page.slug;
  });

  // Attach Eleventy-style permalinks based on parent/child relationships
  pages.forEach((page) => {
    page.permalink =
      page.parent !== 0
        ? `/${idToSlug[page.parent]}/${page.slug}/`
        : `/${page.slug}/`;
  });

  const PROJECTS_PARENT_ID = 27;

  const projects = pages.filter((p) => p.parent === PROJECTS_PARENT_ID);
  const nonProjectPages = pages.filter(
    (p) => p.parent !== PROJECTS_PARENT_ID && p.id !== PROJECTS_PARENT_ID,
  );
  console.log(
    "[pages.js] Split counts => projects:",
    projects.length,
    "nonProjectPages:",
    nonProjectPages.length,
  );
  
  const content = {
    home,
    pages: nonProjectPages,
    projects,
  }
  return content;
}