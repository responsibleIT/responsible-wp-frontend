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

  const projectTemplate = "project-detail-page";
  const SECTION_PARENTS = {
    projecten: { parentId: 27, template: projectTemplate },
  };

  const sections = {};
  const sectionParentIds = Object.values(SECTION_PARENTS).map(
    (s) => s.parentId,
  );

  for (const [key, { parentId, template }] of Object.entries(SECTION_PARENTS)) {
    const indexPage = pages.find((p) => p.id === parentId) || null;
    const children = pages.filter(
      (p) => p.parent === parentId && p.template === template,
    );

    sections[key] = {
      index: indexPage,
      items: children,
    };
  }

  const nonSectionPages = pages.filter(
    (p) =>
      !sectionParentIds.includes(p.id) && !sectionParentIds.includes(p.parent),
  );

  const allAcfFields = {};
  const taxonomyIds = {};
  
  sections.projecten.items.forEach((item) => {
    if (!item.acf) return;
    for (const [key, value] of Object.entries(item.acf)) {
      // Track all ACF fields for processing
      if (!allAcfFields[key]) {
        allAcfFields[key] = { type: 'unknown', values: new Set() };
      }
      
      if (Array.isArray(value) && value.length) {
        // These are likely taxonomy relationships
        allAcfFields[key].type = 'taxonomy';
        if (!taxonomyIds[key]) taxonomyIds[key] = new Set();
        value.forEach((id) => {
          taxonomyIds[key].add(id);
          allAcfFields[key].values.add(id);
        });
      } else if (value !== null && value !== '' && value !== false) {
        // These are other field types (text, select, number, etc.)
        allAcfFields[key].type = typeof value;
        allAcfFields[key].values.add(value);
      }
    }
  });


  const taxonomies = {};
  for (const [taxonomy, ids] of Object.entries(taxonomyIds)) {
    const [raw, meta] = await Promise.all([
      NormalizedFetch(taxonomy, "_fields=slug,name,id,taxonomy"),
      NormalizedFetch(`taxonomies/${taxonomy}`, "_fields=name"),
    ]);
    const rawArray = Array.isArray(raw) ? raw : [raw];
    taxonomies[taxonomy] = {
      label: meta.name,
      type: 'taxonomy',
      items: rawArray.filter((term) => ids.has(Number(term.id))),
    };
  }
  
  // Process other ACF fields (non-taxonomies) 
  const acfFields = {};
  for (const [fieldKey, fieldData] of Object.entries(allAcfFields)) {
    if (fieldData.type !== 'taxonomy' && fieldData.values.size > 0) {
      acfFields[fieldKey] = {
        label: fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert snake_case to Title Case
        type: fieldData.type,
        items: Array.from(fieldData.values).map(value => ({
          name: typeof value === 'string' ? value : String(value),
          slug: typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : String(value),
          value: value, // Keep original value for form rendering
        })),
      };
    }
  }
  
  // Combine for backward compatibility (if needed)
  const combinedFields = { ...taxonomies, ...acfFields };

  sections.projecten.items.forEach((item) => {
    if (!item.acf) return;
    
    // Process taxonomies
    for (const [key, termData] of Object.entries(taxonomies)) {
      if (Array.isArray(item.acf[key]) && Array.isArray(termData.items)) {
        item.acf[key] = item.acf[key]
          .map((id) => termData.items.find((t) => t.id === id)?.slug)
          .filter(Boolean);
      }
    }
    
    // Process other ACF fields
    for (const [key, fieldData] of Object.entries(acfFields)) {
      if (item.acf[key] !== undefined) {
        const originalValue = item.acf[key];
        if (originalValue !== null && originalValue !== '' && originalValue !== false) {
          // Convert to slug format for consistency with filtering
          item.acf[key] = [typeof originalValue === 'string' ? 
            originalValue.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 
            String(originalValue)];
        } else {
          item.acf[key] = [];
        }
      }
    }
  });

  // Count usage for taxonomies
  for (const [fieldKey, termData] of Object.entries(taxonomies)) {
    termData.items.forEach((term) => {
      term.count = sections.projecten.items.filter(
        (item) =>
          Array.isArray(item.acf[fieldKey]) &&
          item.acf[fieldKey].includes(term.slug),
      ).length;
    });
  }
  
  // Count usage for other ACF fields
  for (const [fieldKey, fieldData] of Object.entries(acfFields)) {
    fieldData.items.forEach((item) => {
      item.count = sections.projecten.items.filter(
        (project) =>
          Array.isArray(project.acf[fieldKey]) &&
          project.acf[fieldKey].includes(item.slug),
      ).length;
    });
  }

  console.log('Taxonomies:', taxonomies);
  console.log('ACF Fields:', acfFields);
  

  return {
    home,
    pages: nonSectionPages,
    sections,
    combinedFields,
    taxonomies,
    acfFields,
  };
}
