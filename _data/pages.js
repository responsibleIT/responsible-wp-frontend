import NormalizedFetch from "../utils/NormalizedFetch.js";
import fs from 'fs';
import path from 'path';

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
    console.log('taxonomy:', taxonomy, 'ids:', [...ids]);
    const raw = await NormalizedFetch(taxonomy, '_fields=slug,name,id,taxonomy');
    console.log('raw:', raw);
    const rawArray = Array.isArray(raw) ? raw : [raw];
    terms[taxonomy] = rawArray.filter(term => ids.has(Number(term.id)));
    console.log('filtered terms:', terms[taxonomy]);
  }
  
  sections.projecten.items.forEach(item => {
    if (!item.acf) return;
    for (const [key, termList] of Object.entries(terms)) {
      if (Array.isArray(item.acf[key])) {
        item.acf[key] = item.acf[key].map(id => 
          termList.find(t => t.id === id)?.slug
        ).filter(Boolean);
      }
    }
  });

  return {
    home,
    pages: nonSectionPages,
    sections,
    terms
  };
}