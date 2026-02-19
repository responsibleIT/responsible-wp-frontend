import NormalizedFetch from "../utils/normalizedFetch.js";

// ! _data makes use of utils

export default async function (eleventyData) {
  console.log("Fetching home data...");
  const home = await NormalizedFetch("frontpage", "");
  const pages = await NormalizedFetch("pages", "");

  const idToSlug = { 27: 'projecten' };
  pages.forEach(page => idToSlug[page.id] = page.slug);

  pages.forEach(page => {
    page.permalink = page.parent !== 0
      ? `/${idToSlug[page.parent]}/${page.slug}/`
      : `/${page.slug}/`;
  });

  const projects = pages.filter(p => p.parent === 27);
const nonProjectPages = pages.filter(p => p.parent !== 27);
  
  const content = {
    home,
    pages: nonProjectPages,
    projects,
  }
  return content;
}