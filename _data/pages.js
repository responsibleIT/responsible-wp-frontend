import NormalizedFetch from "../utils/normalizedFetch.js";

// ! _data makes use of utils

export default async function (eleventyData) {
  console.log("Fetching home data...");
  const home = await NormalizedFetch("frontpage", "");
  const pages = await NormalizedFetch("pages", "");

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

  // Configure parent IDs for sectioned collections
  // Extend this map to add more sections (e.g. onderzoek, onderwijs, etc.)
  const SECTION_PARENTS = {
    projecten: 27,
  };

  const sections = {};
  const sectionParentIds = Object.values(SECTION_PARENTS);

  for (const [key, parentId] of Object.entries(SECTION_PARENTS)) {
    const indexPage = pages.find((p) => p.id === parentId) || null;
    const children = pages.filter((p) => p.parent === parentId);

    sections[key] = {
      index: indexPage,
      items: children,
    };
  }

  const nonSectionPages = pages.filter(
    (p) =>
      !sectionParentIds.includes(p.id) && !sectionParentIds.includes(p.parent),
  );

  return {
    home,
    pages: nonSectionPages,
    sections,
  };
}