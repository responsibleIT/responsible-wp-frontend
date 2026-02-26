import NormalizedFetch from "../utils/NormalizedFetch.js";

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

  const taxonomyIds = {};
  sections.projecten.items.forEach(item => {
    if (!item.acf) return;
    for (const [key, value] of Object.entries(item.acf)) {
      if (Array.isArray(value) && value.length) {
        if (!taxonomyIds[key]) taxonomyIds[key] = new Set();
        value.forEach(id => taxonomyIds[key].add(id));
      }
    }
  });

  // fetch only the terms we actually need
  const terms = {};
  for (const [taxonomy, ids] of Object.entries(taxonomyIds)) {
    const [raw, meta] = await Promise.all([
      NormalizedFetch(taxonomy, '_fields=slug,name,id,taxonomy'),
      NormalizedFetch(`taxonomies/${taxonomy}`, '_fields=name')
    ]);
    const rawArray = Array.isArray(raw) ? raw : [raw];
    terms[taxonomy] = {
      label: meta.name,
      items: rawArray.filter(term => ids.has(Number(term.id)))
    };
  }

  sections.projecten.items.forEach(item => {
    if (!item.acf) return;
    for (const [key, termData] of Object.entries(terms)) {
      if (Array.isArray(item.acf[key]) && Array.isArray(termData.items)) {
        item.acf[key] = item.acf[key].map(id =>
          termData.items.find(t => t.id === id)?.slug
        ).filter(Boolean);
      }
    }
  });

  for (const [taxonomy, termData] of Object.entries(terms)) {
    termData.items.forEach(term => {
      term.count = sections.projecten.items.filter(item =>
        Array.isArray(item.acf[taxonomy]) && item.acf[taxonomy].includes(term.slug)
      ).length;
    });
  }

  return {
    home,
    pages: nonSectionPages,
    sections,
    terms
  };
}